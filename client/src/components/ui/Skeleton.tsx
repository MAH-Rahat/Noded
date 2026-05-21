import React from 'react'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({
  width = '100%',
  height = '16px',
  borderRadius = 'var(--radius-input)',
  className,
  style,
}: SkeletonProps) {
  return (
    <div
      className={`skeleton${className ? ` ${className}` : ''}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
    />
  )
}

/** Convenience: a block of stacked skeleton lines */
export function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} height="14px" />
      ))}
    </div>
  )
}
