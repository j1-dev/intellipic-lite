import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';

// Validate environment variables
const requiredEnvVars = [
  'REPLICATE_API_TOKEN',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Initialize Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    // Get form data with prompt and image
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const imageFile = formData.get('image') as File;

    // Validate input
    if (!prompt || !imageFile) {
      return NextResponse.json(
        { error: 'Prompt and image are required' },
        { status: 400 }
      );
    }

    // Get the JWT token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return NextResponse.json(
        { error: 'Unauthorized - No Bearer token' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT token and get the user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication failed: ' + authError?.message },
        { status: 401 }
      );
    }

    // Check if user has credits
    const { data: creditData, error: creditError } = await supabase
      .from('credits')
      .select('amount')
      .eq('user_id', user.id)
      .single();

    if (creditError) {
      console.error('Credit check error:', creditError);
      return NextResponse.json(
        { error: 'Failed to check credits: ' + creditError.message },
        { status: 500 }
      );
    }

    if (!creditData || creditData.amount < 1) {
      return NextResponse.json(
        {
          error:
            'Insufficient credits. Please purchase more credits to continue.',
        },
        { status: 402 }
      );
    }

    // Deduct 1 credit
    const { error: deductError } = await supabase.rpc('add_credits', {
      p_user_id: user.id,
      p_amount: -1,
    });

    if (deductError) {
      console.error('Credit deduction error:', deductError);
      return NextResponse.json(
        { error: 'Failed to deduct credits: ' + deductError.message },
        { status: 500 }
      );
    }

    // Convert image to Base64
    try {
      const imageBuffer = await imageFile.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');
      const imageDataUrl = `data:${imageFile.type};base64,${imageBase64}`;

      // Create prediction record
      const { data: predictionRecord, error: predictionError } = await supabase
        .from('predictions')
        .insert({
          user_id: user.id,
          status: 'started',
          prompt: prompt,
          input_image: imageDataUrl,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (predictionError) {
        console.error('Prediction record creation error:', predictionError);
        throw predictionError;
      }

      // Start the prediction with Replicate
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/replicate-webhook/${predictionRecord.id}`;
      console.log('Webhook URL:', webhookUrl);

      const prediction = await replicate.predictions.create({
        version: 'bytedance/seedream-4.5',
        input: {
          image_input: [imageDataUrl],
          prompt: prompt,
        },
        webhook: webhookUrl,
        webhook_events_filter: ['completed'],
      });

      // Update prediction record with Replicate ID
      const { error: updateError } = await supabase
        .from('predictions')
        .update({
          replicate_prediction_id: prediction.id,
          status: 'processing',
        })
        .eq('id', predictionRecord.id);

      if (updateError) {
        console.error('Prediction record update error:', updateError);
        throw updateError;
      }

      return NextResponse.json({
        id: predictionRecord.id,
        status: 'processing',
      });
    } catch (error) {
      // If there's an error, refund the credit
      await supabase.rpc('add_credits', {
        p_user_id: user.id,
        p_amount: 1,
      });
      throw error;
    }
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Failed to generate image: ${error.message}`
            : 'Failed to generate image: Unknown error',
      },
      { status: 500 }
    );
  }
}
