'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { supabase } from '@/utils/supabaseClient';

interface ImageGeneration {
  id: string;
  url: string;
  created_at: string;
  prompt: string;
  status: 'starting' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [images, setImages] = useState<ImageGeneration[]>([]);
  const [error, setError] = useState('');
  const [credits, setCredits] = useState<number | null>(null);
  const [currentGeneration, setCurrentGeneration] =
    useState<ImageGeneration | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch images and credits when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      // Fetch images
      const { data: imagesData, error: imagesError } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (imagesError) {
        console.error('Error fetching images:', imagesError);
      } else {
        setImages(imagesData || []);
      }

      // Fetch credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('credits')
        .select('amount')
        .eq('user_id', user?.id)
        .single();

      if (creditsError) {
        console.error('Error fetching credits:', creditsError);
      } else {
        setCredits(creditsData?.amount || 0);
      }
    };

    fetchData();

    // Set up polling for status updates if there's an active generation
    const pollInterval = setInterval(async () => {
      if (
        currentGeneration &&
        currentGeneration.status !== 'completed' &&
        currentGeneration.status !== 'failed'
      ) {
        // First check the prediction status
        const { data: predictionData, error: predictionError } = await supabase
          .from('predictions')
          .select('status, output_urls')
          .eq('id', currentGeneration.id)
          .single();

        if (predictionError) {
          console.error('Error polling prediction:', predictionError);
        } else if (predictionData) {
          // Update the current generation with new status
          setCurrentGeneration((prev) =>
            prev
              ? {
                  ...prev,
                  status: predictionData.status,
                  url: predictionData.output_urls?.[0] || prev.url,
                }
              : null
          );

          // If the prediction is complete, refresh the images
          if (
            predictionData.status === 'completed' ||
            predictionData.status === 'failed'
          ) {
            fetchData();
          }
        }
      }
    }, 1000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [user?.id, currentGeneration]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleGenerateImage = async () => {
    try {
      setGenerating(true);
      setError('');

      if (!selectedImage) {
        throw new Error('Please select an image first');
      }

      // Create a FormData object
      const formData = new FormData();
      formData.append('image', selectedImage); // Changed from 'file' to 'image' to match API expectation
      formData.append('prompt', prompt);

      // Get the current session from Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log('Session:', session); // Debug log
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      console.log('Using token:', session.access_token); // Debug log
      const headers = new Headers();
      headers.append('Authorization', `Bearer ${session.access_token}`);
      // Don't set Content-Type header, let the browser set it with the correct boundary for FormData

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers,
        body: formData,
        // Important: include credentials to ensure cookies and auth headers are sent
        credentials: 'same-origin',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate image');
      }

      const data = await response.json();

      // Initialize current generation tracking
      const { id: predictionId, status } = data;
      setCurrentGeneration({
        id: predictionId,
        status: status || 'starting',
        prompt,
        created_at: new Date().toISOString(),
        url: '',
      });
    } catch (err: Error | unknown) {
      const error =
        err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error.message);
      console.error('Error generating image:', err);
    } finally {
      setGenerating(false);
      // Clear the form
      setPrompt('');
      setSelectedImage(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Status display component
  const StatusDisplay = ({ status }: { status: string }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'starting':
          return 'text-blue-500 dark:text-blue-400';
        case 'processing':
          return 'text-yellow-500 dark:text-yellow-400';
        case 'completed':
          return 'text-green-500 dark:text-green-400';
        case 'failed':
          return 'text-red-500 dark:text-red-400';
        default:
          return 'text-gray-500 dark:text-gray-400';
      }
    };

    const getStatusText = () => {
      switch (status) {
        case 'starting':
          return 'Starting...';
        case 'processing':
          return 'Processing...';
        case 'completed':
          return 'Completed';
        case 'failed':
          return 'Failed';
        default:
          return 'Unknown';
      }
    };

    return (
      <span className={`font-semibold ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Generation Form */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Generate New Image
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Credits:</span>
              <span className="font-semibold text-foreground">{credits}</span>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Upload Reference Image
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 cursor-pointer hover:border-muted-foreground/50 transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="text-center">
                  <div className="text-muted-foreground mb-2">
                    Click to upload or drag and drop
                  </div>
                  <div className="text-xs text-muted-foreground">
                    PNG, JPG, GIF up to 10MB
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Prompt
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="Describe how you want to transform your image..."
                className="resize-none"
              />
            </div>


            {previewUrl && (
              <div className="mt-4">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  width={200}
                  height={200}
                  className="rounded-lg border border-border"
                />
              </div>
            )}

            {error && <div className="text-destructive text-sm">{error}</div>}

            <Button
              onClick={handleGenerateImage}
              disabled={!selectedImage || !prompt || generating}
              className="w-full">
              {generating ? 'Generating...' : 'Generate Image'}
            </Button>
          </div>
        </Card>

        {/* Generated Images */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">
            Your Generated Images
          </h2>

          {currentGeneration && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">
                  Current Generation
                </h3>
                <StatusDisplay status={currentGeneration.status} />
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {currentGeneration.prompt}
              </p>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {images.map((image) => (
              <Card key={image.id} className="p-4">
                {image.url ? (
                  <div className="aspect-square relative mb-3">
                    <Image
                      src={image.url}
                      alt={image.prompt}
                      fill
                      className="rounded-lg object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-muted rounded-lg mb-3" />
                )}
                <p className="text-sm text-muted-foreground mb-2">
                  {image.prompt}
                </p>
                <StatusDisplay status={image.status} />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
