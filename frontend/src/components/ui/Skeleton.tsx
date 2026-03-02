/* KauanFlix — Skeleton Loading Components */
import React from 'react';

export const SkeletonCard: React.FC<{ landscape?: boolean }> = ({ landscape }) => (
  <div className={`skeleton flex-shrink-0 ${landscape ? 'card-landscape' : ''}`}
    style={{ width: landscape ? 280 : 180, aspectRatio: landscape ? '16/9' : '2/3' }}
  />
);

export const SkeletonRow: React.FC<{ count?: number; landscape?: boolean }> = ({
  count = 6,
  landscape,
}) => (
  <div className="flex gap-3 overflow-hidden">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} landscape={landscape} />
    ))}
  </div>
);

export const SkeletonHero: React.FC = () => (
  <div className="skeleton w-full" style={{ height: '70vh', minHeight: 400 }} />
);

export const SkeletonDetail: React.FC = () => (
  <div className="space-y-4 p-8">
    <div className="skeleton h-8 w-1/3" />
    <div className="skeleton h-4 w-2/3" />
    <div className="skeleton h-4 w-1/2" />
    <div className="flex gap-3 mt-6">
      <div className="skeleton h-12 w-32 rounded-md" />
      <div className="skeleton h-12 w-32 rounded-md" />
    </div>
  </div>
);
