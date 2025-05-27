'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [gender, setGender] = useState('male');
  const [generating, setGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [images, setImages] = useState<ImageGeneration[]>([]);
  const [error, setError] = useState('');
  const [currentGeneration, setCurrentGeneration] =
    useState<ImageGeneration | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch images when component mounts
  useEffect(() => {
    const fetchImages = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching images:', error);
        setError('Failed to load your images');
      } else {
        setImages(data || []);
      }
    };

    fetchImages();

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
            fetchImages();
          }
        }
      }
    }, 1000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [user?.id, currentGeneration]);

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
      formData.append('gender', gender);

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
        case 'completed':
          return 'text-green-500';
        case 'failed':
          return 'text-red-500';
        default:
          return 'text-blue-500';
      }
    };

    const getStatusText = () => {
      switch (status) {
        case 'starting':
          return 'Starting generation...';
        case 'processing':
          return 'Generating your image...';
        case 'completed':
          return 'Generation complete!';
        case 'failed':
          return 'Generation failed';
        default:
          return 'Processing...';
      }
    };

    return (
      <div className={`flex items-center gap-2 ${getStatusColor()}`}>
        {status !== 'completed' && status !== 'failed' && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
        )}
        <span>{getStatusText()}</span>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Generation Form */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Generate New Image</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Reference Image
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedImage(file);
                    setPreviewUrl(URL.createObjectURL(file));
                  }
                }}
                ref={fileInputRef}
              />
              {previewUrl && (
                <div className="mt-2 relative w-32 h-32">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Prompt</label>
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt..."
                disabled={generating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Gender</label>
              <Select
                value={gender}
                onValueChange={setGender}
                disabled={generating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <Button
              onClick={handleGenerateImage}
              disabled={!selectedImage || !prompt || generating}
              className="w-full">
              {generating ? 'Generating...' : 'Generate Image'}
            </Button>
          </div>
        </Card>

        {/* Current Generation Status */}
        {currentGeneration ? (
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Current Generation</h3>
            <div className="space-y-4">
              <StatusDisplay status={currentGeneration.status} />
              {currentGeneration.url && (
                <div className="relative w-full h-64">
                  <Image
                    src={currentGeneration.url}
                    alt={currentGeneration.prompt}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              )}
              <p className="text-sm text-gray-600">
                Prompt: {currentGeneration.prompt}
              </p>
            </div>
          </Card>
        ) : (
          <Card className="p-6 flex items-center justify-center text-gray-500">
            <p>No active generation</p>
          </Card>
        )}
      </div>

      {/* Generated Images Gallery */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Your Generated Images</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="p-4">
              <div className="relative w-full h-64 mb-4">
                <Image
                  src={image.url}
                  alt={image.prompt}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <p className="text-sm text-gray-600 truncate">{image.prompt}</p>
              <p className="text-xs text-gray-400">
                {new Date(image.created_at).toLocaleDateString()}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
