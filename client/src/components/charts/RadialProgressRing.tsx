import React from 'react'

interface RadialProgressRingProps {
  percent: number   // 0–100
  size?: number
  strokeWidth?: number
  label?: string
}

export function RadialProgressRing({
  percent,
  size = 80,
  strokeWidth = 7,
  label,
}: RadialProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 800ms ease-out' }}
        />
        {/* Center text — rotated back */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            transform: `rotate(90deg) translate(0, -${size}px)`,
            transformOrigin: `${size / 2}px ${size / 2}px`,
            fill: 'var(--color-text-primary)',
            fontSize: `${size * 0.2}px`,
            fontFamily: 'var(--font-ui)',
            fontWeight: 700,
          }}
        >
          {Math.round(percent)}%
        </text>
      </svg>
      {label && (
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{label}</span>
      )}
    </div>
  )
}
