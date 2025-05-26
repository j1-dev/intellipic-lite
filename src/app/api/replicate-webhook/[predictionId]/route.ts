import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function POST(
  request: Request,
  { params }: { params: { predictionId: string } }
) {
  try {
    const webhookData = await request.json();
    const predictionId = (await params).predictionId;

    console.log('Webhook data received:', webhookData);

    const { status, output } = webhookData;

    // Replicate uses 'succeeded' instead of 'completed'
    const normalizedStatus = status === 'succeeded' ? 'completed' : status;

    // Update the prediction record with the current status
    const updateData: {
      status: string;
      output_urls?: string[];
      completed_at?: string;
    } = {
      status: normalizedStatus,
    };

    // If the prediction succeeded, add the output URL
    if (status === 'succeeded' && output) {
      updateData.output_urls = [output];
      updateData.completed_at =
        webhookData.completed_at || new Date().toISOString();

      // Also store in images table for the gallery
      const { error: imageError } = await supabase.from('images').insert({
        url: output,
        user_id: (
          await supabase
            .from('predictions')
            .select('user_id')
            .eq('id', predictionId)
            .single()
        ).data?.user_id,
        created_at: new Date().toISOString(),
        prompt: webhookData.input.prompt,
      });

      if (imageError) {
        console.error('Error storing image:', imageError);
      }
    }

    console.log('Updating prediction with data:', updateData);
    // Update the prediction record
    const { error: updateError } = await supabase
      .from('predictions')
      .update(updateData)
      .eq('id', predictionId);

    if (updateError) {
      console.error('Error updating prediction:', updateError);
      return NextResponse.json(
        { error: 'Failed to update prediction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
