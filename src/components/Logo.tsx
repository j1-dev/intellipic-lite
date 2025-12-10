'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

interface LogoProps {
  size: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size, className }) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // prevents wrong logo flash

  const isDarkMode = theme === 'dark';

  return (
    <Image
      src="/favicon.ico"
      alt="Logo"
      width={size}
      height={size}
      className={`${className} ${isDarkMode ? 'invert' : ''}`}
    />
  );
};
