'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';

const PROMPTS = [
  'Turn background into cyberpunk city',
  'Make the portrait smile',
  'Change hair color to neon green',
  'Add golden hour lighting',
];

const RESULT_IMGS = [
  '/result1.webp',
  '/result2.webp',
  '/result3.webp',
  '/result4.webp',
];

const CHAR_DELAY = 45; // ms per typed character
const PAUSE_AFTER_FULL = 2000;
const DELETE_DELAY = 30; // ms per deleted character
const PAUSE_AFTER_EMPTY = 700;

export default function PromptFlowAnimation() {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const fullText = PROMPTS[index];
    let pos = 0;

    const typeIn = () => {
      const id = setInterval(() => {
        setText(fullText.slice(0, pos + 1));
        pos++;
        if (pos === fullText.length) {
          clearInterval(id);
          setShowResult(true);
          setTimeout(deleteOut, PAUSE_AFTER_FULL);
        }
      }, CHAR_DELAY);
      return () => clearInterval(id);
    };

    const deleteOut = () => {
      const id = setInterval(() => {
        pos--;
        setText(fullText.slice(0, pos));
        if (pos === 0) {
          clearInterval(id);
          setShowResult(false);
          setTimeout(nextPrompt, PAUSE_AFTER_EMPTY);
        }
      }, DELETE_DELAY);
      return () => clearInterval(id);
    };

    const nextPrompt = () => {
      setIndex((i) => (i + 1) % PROMPTS.length);
    };

    const clean = typeIn();
    return clean; 
  }, [index]);

  const resultSrc = RESULT_IMGS[index];

  return (
    <section className="max-w-5xl mx-auto mb-16 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative overflow-hidden rounded-2xl shadow-xl">
          <Image
            src="/base-demo.jpeg"
            alt="Base image"
            width={400}
            height={400}
            className="w-full h-auto object-cover"
          />
          <span className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
            Base image
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center space-y-4">
          <div className="text-xl font-semibold text-foreground text-center min-h-[1.75rem]">
            {text}
            <span className="inline-block w-[2px] h-6 translate-y-1 bg-blue-600 animate-pulse " />
          </div>

          <motion.svg
            className="hidden md:block w-32 h-10 text-blue-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            animate={{ x: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 12h14m0 0l-5-5m5 5l-5 5"
            />
          </motion.svg>

          <motion.svg
            className="md:hidden w-10 h-12 text-blue-600 rotate-90"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            animate={{ x: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 12h14m0 0l-5-5m5 5l-5 5"
            />
          </motion.svg>
        </motion.div>

        <div className="relative w-full">
          {/* invisible placeholder – keeps grid row tall */}
          <div className="w-full rounded-2xl shadow-xl overflow-hidden opacity-0 pointer-events-none">
            <Image
              src="/base-demo.jpeg" 
              alt="placeholder"
              width={400}
              height={400}
              className="w-full h-auto object-cover"
            />
          </div>

          <div className="absolute inset-0 grid place-items-center rounded-2xl border-border">
            <AnimatePresence mode="wait">
              {showResult ? (
                <motion.div
                  key={resultSrc}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="w-full h-full">
                  <Image
                    src={resultSrc}
                    alt="AI-edited result"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                  <span className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    AI result
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="spinner"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-blue-600 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
