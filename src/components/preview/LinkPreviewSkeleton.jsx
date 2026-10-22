import React from 'react';

export default function LinkPreviewSkeleton() {
  return (
    <div className="w-[330px] rounded-2xl bg-white/95 dark:bg-[#0c1412]/95 backdrop-blur-2xl border border-gray-200/80 dark:border-white/10 p-4 shadow-2xl space-y-3 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="w-full h-28 rounded-xl bg-gray-200 dark:bg-white/10" />

      {/* Meta Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-white/20" />
          <div className="w-24 h-3.5 rounded bg-gray-200 dark:bg-white/10" />
        </div>
        <div className="w-16 h-4 rounded-full bg-gray-200 dark:bg-white/10" />
      </div>

      {/* Title & Desc Skeleton */}
      <div className="space-y-1.5">
        <div className="w-3/4 h-4 rounded bg-gray-300 dark:bg-white/20" />
        <div className="w-full h-3 rounded bg-gray-200 dark:bg-white/10" />
        <div className="w-4/5 h-3 rounded bg-gray-200 dark:bg-white/10" />
      </div>

      {/* Action Bar Skeleton */}
      <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-2">
        <div className="w-24 h-7 rounded-lg bg-gray-200 dark:bg-white/10" />
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-white/10" />
          <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}
