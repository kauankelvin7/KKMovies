import React from 'react';

export const SkeletonCard: React.FC<{ landscape?: boolean }> = ({ landscape }) => (
  <div
    className="skeleton flex-shrink-0 border border-[var(--glass-separator)] shadow-sm"
    style={{
      width: landscape ? 'min(75vw, 280px)' : 'min(40vw, 160px)',
      aspectRatio: landscape ? '16/9' : '2/3',
      borderRadius: 'var(--radius-lg)' // Consistente com os novos cards do iOS Glass
    }}
  />
);

export const SkeletonRow: React.FC<{ count?: number; landscape?: boolean }> = ({
  count = 6,
  landscape,
}) => (
  <div className="flex gap-4 sm:gap-6 overflow-hidden">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} landscape={landscape} />
    ))}
  </div>
);

export const SkeletonHero: React.FC = () => (
  <div className="relative w-full h-[85vh] md:h-screen min-h-[500px] overflow-hidden">
    <div className="skeleton absolute inset-0 rounded-none" />
    <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-0)] via-transparent to-transparent" />
  </div>
);

export const SkeletonDetail: React.FC = () => (
  <div className="min-h-screen bg-[var(--surface-0)] pb-24">
    {/* Hero Backdrop Cover */}
    <div className="relative w-full h-[55vh] min-h-[400px]">
      <div className="skeleton absolute inset-0 rounded-none opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-0)] via-[var(--surface-0)]/60 to-transparent" />
    </div>

    {/* Content Area */}
    <div className="section-container -mt-32 md:-mt-48 relative z-10">
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
        
        {/* Poster */}
        <div className="hidden md:block flex-shrink-0 glass-card p-1 rounded-2xl">
          <div className="skeleton w-48 lg:w-64 aspect-[2/3] rounded-xl" />
        </div>

        {/* Info */}
        <div className="flex-1 w-full pt-4 space-y-6">
          {/* Badge */}
          <div className="skeleton h-6 w-24 rounded-full" />
          
          {/* Title & Tagline */}
          <div className="space-y-4">
            <div className="skeleton h-12 md:h-16 w-3/4 max-w-md rounded-xl" />
            <div className="skeleton h-6 w-1/2 max-w-sm rounded-lg opacity-70" />
          </div>
          
          {/* Meta Info */}
          <div className="flex gap-4 py-2">
            <div className="skeleton h-4 w-16 rounded-md" />
            <div className="skeleton h-4 w-24 rounded-md" />
            <div className="skeleton h-4 w-20 rounded-md" />
          </div>
          
          {/* Buttons */}
          <div className="flex flex-wrap gap-3 py-4">
            <div className="skeleton h-11 w-32 rounded-xl" />
            <div className="skeleton h-11 w-28 rounded-xl" />
            <div className="skeleton h-11 w-11 rounded-full" />
            <div className="skeleton h-11 w-11 rounded-full" />
          </div>
          
          {/* Overview Paragraphs */}
          <div className="space-y-3 max-w-3xl pt-2">
            <div className="skeleton h-4 w-full rounded-md" />
            <div className="skeleton h-4 w-full rounded-md" />
            <div className="skeleton h-4 w-10/12 rounded-md" />
            <div className="skeleton h-4 w-3/4 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  </div>
);