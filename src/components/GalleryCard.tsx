/* eslint-disable @next/next/no-img-element */
'use client';

import Image from 'next/image';
import { Download } from 'lucide-react';

interface ImageGeneration {
  id: string;
  url: string;
  created_at: string;
  prompt: string;
  status: 'starting' | 'processing' | 'completed' | 'failed';
  error?: string;
}

const TTL_MS = 60 * 60 * 1000; // 1 hour

export const GalleryCard = ({ img }: { img: ImageGeneration }) => {
  const expired = Date.now() - new Date(img.created_at).getTime() > TTL_MS;
  if (expired || !img.url) return null; // don't render at all

  return (
    <div className="group relative aspect-square rounded-xl overflow-hidden border bg-card hover:shadow-lg transition">
      <Image src={img.url} alt={img.prompt} fill className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-3 text-white pointer-events-none max-md:hidden md:pointer-events-auto">
        <p className="text-xs line-clamp-2 mb-2">{img.prompt}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs">
            {new Date(img.created_at).toLocaleDateString()}
          </span>
          <a
            href={img.url}
            download
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30">
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
