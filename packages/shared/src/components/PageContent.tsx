import React from 'react';

interface PageContentProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'none';
  className?: string;
  fill?: boolean;
}

const MAX_WIDTH_MAP: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  none: '',
};

export function PageContent({ children, maxWidth = 'none', className = '', fill = false }: PageContentProps) {
  const widthClass = MAX_WIDTH_MAP[maxWidth];
  const classes = [
    'flex-grow',
    widthClass,
    widthClass ? 'mx-auto w-full' : '',
    fill ? 'flex flex-col min-h-0' : '',
    className,
  ].filter(Boolean).join(' ');

  return <div className={classes}>{children}</div>;
}
