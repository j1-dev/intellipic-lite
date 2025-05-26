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

type Image = {
  id: string;
  url: string;
  created_at: string;
  prompt: string;
};

export default function Dashboard() {
  const { user, session } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [gender, setGender] = useState('male');
  const [generating, setGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [error, setError] = useState('');
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
      console.log(data, error);

      if (error) {
        console.error('Error fetching images:', error);
      } else {
        setImages(data || []);
      }
    };

    fetchImages();
  }, [user?.id]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setError('Image must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError('');
    }
  };

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !selectedImage) {
      setError('Please provide both a prompt and an image');
      return;
    }

    if (!session?.access_token) {
      setError('Please log in to generate images');
      return;
    }

    setError('');
    setGenerating(true);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('image', selectedImage);
      formData.append('gender', gender);

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate image');
      }

      // After successful generation, refresh images list
      const { data: newImages } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      setImages(newImages || []);
      setPrompt('');
      setSelectedImage(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to generate image'
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back{user?.email ? `, ${user.email}` : ''}
            </h1>
            <p className="text-gray-500 mt-1">
              Upload a photo and create amazing AI avatars
            </p>
          </div>
          <Button variant="outline" className="mt-4 md:mt-0">
            View History
          </Button>
        </div>

        <form onSubmit={handleGenerateImage} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Your Photo
            </label>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              disabled={generating}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Your Gender
            </label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter Scene Description
            </label>
            <Input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the scene (e.g., astronaut in space, warrior in battle)"
              disabled={generating}
            />
          </div>

          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={generating || !selectedImage}>
            {generating ? 'Generating Avatar...' : 'Generate Avatar'}
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <div className="relative aspect-square">
              <Image
                src={image.url}
                alt={image.prompt}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 truncate">{image.prompt}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(image.created_at).toLocaleDateString()}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
