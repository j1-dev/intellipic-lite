import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';

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
    const gender = (formData.get('gender') as string) || 'male';

    // Get the JWT token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    console.log(
      'Request headers:',
      Object.fromEntries(request.headers.entries())
    ); // Debug all headers
    console.log('Authorization header:', authHeader);

    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Missing or invalid Authorization header');
      return NextResponse.json(
        { error: 'Unauthorized - No Bearer token' },
        { status: 401 }
      );
    }
    const token = authHeader.split(' ')[1];
    console.log('Extracted token:', token.substring(0, 20) + '...');
    console.log('Extracted token:', token);

    // Verify the JWT token and get the user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('Authenticated user:', user.id);

    if (!prompt || !imageFile) {
      return NextResponse.json(
        { error: 'Prompt and image are required' },
        { status: 400 }
      );
    }

    // Convert image to Base64
    const imageBuffer = await imageFile.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const imageDataUrl = `data:${imageFile.type};base64,${imageBase64}`;

    // First, create a prediction record in our database
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
      throw predictionError;
    }
    console.log('Created prediction record:', predictionRecord);

    // Start the prediction with Replicate
    console.log(
      `${process.env.NEXT_PUBLIC_APP_URL!}/api/replicate-webhook/${
        predictionRecord.id
      }`
    );

    const prediction = await replicate.predictions.create({
      version: 'easel/ai-avatars',
      input: {
        face_image: imageDataUrl,
        user_gender: gender,
        prompt: prompt,
        workflow_type: 'Realistic',
      },
      webhook: `${process.env.NEXT_PUBLIC_APP_URL!}/api/replicate-webhook/${
        predictionRecord.id
      }`,
      webhook_events_filter: ['completed'],
    });

    console.log('Replicate prediction started:', prediction);

    // Update the prediction record with Replicate's prediction ID
    const { error: updateError } = await supabase
      .from('predictions')
      .update({
        replicate_prediction_id: prediction.id,
        status: 'processing',
      })
      .eq('id', predictionRecord.id);

    if (updateError) {
      throw updateError;
    }
    console.log('Updated prediction record with Replicate ID:', prediction.id);

    return NextResponse.json({
      id: predictionRecord.id,
      status: 'processing',
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
