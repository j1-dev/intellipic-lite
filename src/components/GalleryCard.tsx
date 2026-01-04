'use client';

import { useEffect, useState } from 'react';
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

export const GalleryCard = ({ img }: { img: ImageGeneration }) => {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!img.url) return;
    // quick HEAD check – replicate only
    if (!img.url.includes('replicate.delivery')) return;

    fetch(img.url, { method: 'HEAD' })
      .then((r) => {
        if (!r.ok) setExpired(true);
      })
      .catch(() => setExpired(true));
  }, [img.url]);

  return (
    <div>
      {/* visual */}
      {img.url && !expired && (
        <div className="group relative aspect-square rounded-xl overflow-hidden border bg-card hover:shadow-lg transition">
          <Image src={img.url} alt={img.prompt} fill className="object-cover" />
          {/* hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-3 text-white">
            <p className="text-xs line-clamp-2 mb-2">{img.prompt}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs">
                {new Date(img.created_at).toLocaleDateString()}
              </span>

              {/* download button – hidden when expired */}
              <a
                href={img.url}
                download
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30"
                onClick={(e) => expired && e.preventDefault()}>
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
