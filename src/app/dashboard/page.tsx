'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabaseClient';
import Image from 'next/image';
import { X, Loader2, UploadCloud } from 'lucide-react';
import { GalleryCard } from '@/components/GalleryCard';

/*  types  */
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ----- state ----- */
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [images, setImages] = useState<ImageGeneration[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [current, setCurrent] = useState<ImageGeneration | null>(null);
  const [error, setError] = useState('');
  const [showExpiryBanner, setShowExpiryBanner] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      if (!user?.id) return;
      const { data, error: err } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!err && data) setImages(data);
    };

    const fetchCredits = async () => {
      if (!user?.id) return;
      const { data, error: err } = await supabase
        .from('credits')
        .select('amount')
        .eq('user_id', user.id)
        .single();
      if (!err && data) setCredits(data.amount);
    };

    const deleteDeadLinks = async () => {
      const TTL_MS = 60 * 60 * 1000; // 1 hour
      const cutOff = new Date(Date.now() - TTL_MS).toISOString();
      if (!user?.id) return;
      const { error } = await supabase
        .from('images')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', cutOff);
      if (error) {
        console.error('Purge failed: ', error);
        return;
      }
    };
    if (!user?.id) return;
    deleteDeadLinks();
    fetchImages();
    fetchCredits();

    const poll = setInterval(async () => {
      if (
        !current ||
        current.status === 'completed' ||
        current.status === 'failed'
      )
        return;

      const { data } = await supabase
        .from('predictions')
        .select('status, output_urls')
        .eq('id', current.id)
        .single();

      if (data) {
        setCurrent((prev) =>
          prev
            ? {
                ...prev,
                status: data.status,
                url: data.output_urls?.[0] || prev.url,
              }
            : null
        );
        if (data.status === 'completed' || data.status === 'failed') {
          fetchImages();
        }
      }
    }, 500);
    return () => clearInterval(poll);
  }, [user?.id, current]);

  /* ----------  handlers  ---------- */
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onGenerate = async () => {
    if (!selectedFile || !prompt) return;
    setGenerating(true);
    setError('');
    const body = new FormData();
    body.append('image', selectedFile);
    body.append('prompt', prompt);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}` },
      body,
      credentials: 'same-origin',
    });

    if (!res.ok) {
      const m = await res.json();
      setError(m.message || 'Failed');
      setGenerating(false);
      return;
    }

    const data = await res.json();
    setCurrent({
      id: data.id,
      status: data.status || 'starting',
      prompt,
      url: '',
      created_at: new Date().toISOString(),
    });
    setGenerating(false);
    setPrompt('');
    // setSelectedFile(null);
    // setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ----------  UI  ---------- */
  const statusColour = (s: string) =>
    s === 'completed'
      ? 'bg-green-500/10 text-green-400'
      : s === 'failed'
      ? 'bg-red-500/10 text-red-400'
      : 'bg-blue-500/10 text-blue-400';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-blue-50 dark:from-background dark:to-blue-950/30">
      {/* sticky bar */}
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 grid grid-cols-1 sm:flex sm:items-center sm:gap-4 gap-3">
          {/* hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            className="hidden"
          />

          {/* row 1 : upload + prompt */}
          <div className="flex items-center gap-3 w-full">
            {!previewUrl ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition text-sm shrink-0">
                <UploadCloud className="w-5 h-5" /> Upload
              </button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <Image
                  src={previewUrl}
                  alt="preview"
                  width={48}
                  height={48}
                  className="rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                  }}
                  className="p-1 rounded-full hover:bg-destructive/20">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the change…"
              className="w-full min-w-0 px-3 py-2 rounded-lg bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* row 2 : generate + credits */}
          <div className="flex items-center gap-3 sm:ml-auto">
            <button
              onClick={onGenerate}
              disabled={!selectedFile || !prompt || generating}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm">
              {generating && <Loader2 className="w-4 h-4 animate-spin" />}
              Generate
            </button>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Credits</span>
              <span className="font-semibold">{credits ?? '…'}</span>
            </div>
          </div>
        </div>
        {error && (
          <div className="px-4 pb-2 text-sm text-destructive">{error}</div>
        )}
      </header>

      {/* current job toast */}
      {current && (
        <div className="max-w-5xl mx-auto px-4 mt-4">
          <div className="flex items-center justify-between bg-card border rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${statusColour(
                  current.status
                )}`}>
                {current.status}
              </span>
              <p className="text-sm text-muted-foreground">{current.prompt}</p>
            </div>
            {(current.status === 'processing' ||
              current.status === 'starting') && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            )}
          </div>
        </div>
      )}

      {/* gallery */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <GalleryCard key={img.id} img={img} />
          ))}
        </div>

        {images.length === 0 && !current && (
          <div className="text-center py-20 text-muted-foreground">
            No images yet—upload a picture and create your first edit!
          </div>
        )}

        {showExpiryBanner && (
          <div className="max-w-5xl mx-auto mt-8">
            <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-300 rounded-lg px-4 py-2 text-sm">
              <span>
                Images expire after 1h — download the ones you want to keep!
              </span>
              <button
                onClick={() => setShowExpiryBanner(false)}
                className="p-1 rounded hover:bg-yellow-500/20">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
