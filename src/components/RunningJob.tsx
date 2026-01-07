'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function RunningJob({
  current,
}: {
  current: { status: string; prompt: string };
}) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (current.status !== 'starting' && current.status !== 'processing')
      return;
    const start = Date.now();
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [current.status]);

  const statusColour =
    current.status === 'completed'
      ? 'bg-green-500/10 text-green-400'
      : current.status === 'failed'
      ? 'bg-red-500/10 text-red-400'
      : 'bg-blue-500/10 text-blue-400';

  return (
    <div className="max-w-5xl mx-auto px-4 mt-4">
      <div className="flex items-center justify-between bg-card border rounded-xl p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${statusColour}`}>
            {current.status}
          </span>
          <p className="text-sm text-muted-foreground">{current.prompt}</p>
        </div>

        <div className="flex items-center gap-3">
          {(current.status === 'starting' ||
            current.status === 'processing') && (
            <>
              <span className="text-sm text-muted-foreground">{seconds}s</span>
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
