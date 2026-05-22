import React from 'react'

interface IconProps {
  size?: number
  color?: string
  strokeWidth?: number
  style?: React.CSSProperties
}

const base = (size: number, sw: number, children: React.ReactNode, style?: React.CSSProperties) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={style}>
    {children}
  </svg>
)

export const HomeIcon = ({ size = 20, strokeWidth = 1.8, style }: IconProps) => base(size, strokeWidth, <>
  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  <polyline points="9 22 9 12 15 12 15 22" />
</>, style)

export const TrendingUpIcon = ({ size = 20, strokeWidth = 1.8, style }: IconProps) => base(size, strokeWidth, <>
  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
  <polyline points="17 6 23 6 23 12" />
</>, style)

export const CheckSquareIcon = ({ size = 20, strokeWidth = 1.8, style }: IconProps) => base(size, strokeWidth, <>
  <polyline points="9 11 12 14 22 4" />
  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
</>, style)

export const FileTextIcon = ({ size = 20, strokeWidth = 1.8, style }: IconProps) => base(size, strokeWidth, <>
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
  <polyline points="14 2 14 8 20 8" />
  <line x1="16" y1="13" x2="8" y2="13" />
  <line x1="16" y1="17" x2="8" y2="17" />
  <polyline points="10 9 9 9 8 9" />
</>, style)

export const ShieldIcon = ({ size = 20, strokeWidth = 1.8, style }: IconProps) => base(size, strokeWidth, <>
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
</>, style)

export const SearchIcon = ({ size = 18, strokeWidth = 1.8, style }: IconProps) => base(size, strokeWidth, <>
  <circle cx="11" cy="11" r="8" />
  <line x1="21" y1="21" x2="16.65" y2="16.65" />
</>, style)

export const SettingsIcon = ({ size = 18, strokeWidth = 1.8, style }: IconProps) => base(size, strokeWidth, <>
  <circle cx="12" cy="12" r="3" />
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
</>, style)

export const LogOutIcon = ({ size = 18, strokeWidth = 1.8, style }: IconProps) => base(size, strokeWidth, <>
  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
  <polyline points="16 17 21 12 16 7" />
  <line x1="21" y1="12" x2="9" y2="12" />
</>, style)

export const PlusIcon = ({ size = 18, strokeWidth = 2, style }: IconProps) => base(size, strokeWidth, <>
  <line x1="12" y1="5" x2="12" y2="19" />
  <line x1="5" y1="12" x2="19" y2="12" />
</>, style)

export const TrashIcon = ({ size = 16, strokeWidth = 1.8, style }: IconProps) => base(size, strokeWidth, <>
  <polyline points="3 6 5 6 21 6" />
  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
</>, style)

export const PinIcon = ({ size = 14, strokeWidth = 1.8, style }: IconProps) => base(size, strokeWidth, <>
  <line x1="12" y1="17" x2="12" y2="22" />
  <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z" />
</>, style)

export const ClockIcon = ({ size = 14, strokeWidth = 1.8, style }: IconProps) => base(size, strokeWidth, <>
  <circle cx="12" cy="12" r="10" />
  <polyline points="12 6 12 12 16 14" />
</>, style)

export const KeyIcon = ({ size = 16, strokeWidth = 1.8, style }: IconProps) => base(size, strokeWidth, <>
  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
</>, style)

export const LockIcon = ({ size = 16, strokeWidth = 1.8, style }: IconProps) => base(size, strokeWidth, <>
  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
</>, style)

export const IdCardIcon = ({ size = 16, strokeWidth = 1.8, style }: IconProps) => base(size, strokeWidth, <>
  <rect x="2" y="5" width="20" height="14" rx="2" />
  <circle cx="8" cy="12" r="2" />
  <path d="M14 9h4M14 12h4M14 15h2" />
</>, style)

export const ChevronRightIcon = ({ size = 16, strokeWidth = 2, style }: IconProps) => base(size, strokeWidth, <>
  <polyline points="9 18 15 12 9 6" />
</>, style)

export const ArrowLeftIcon = ({ size = 18, strokeWidth = 2, style }: IconProps) => base(size, strokeWidth, <>
  <line x1="19" y1="12" x2="5" y2="12" />
  <polyline points="12 19 5 12 12 5" />
</>, style)

export const EyeIcon = ({ size = 16, strokeWidth = 1.8, style }: IconProps) => base(size, strokeWidth, <>
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
  <circle cx="12" cy="12" r="3" />
</>, style)

export const EyeOffIcon = ({ size = 16, strokeWidth = 1.8, style }: IconProps) => base(size, strokeWidth, <>
  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
  <line x1="1" y1="1" x2="23" y2="23" />
</>, style)

export const CopyIcon = ({ size = 14, strokeWidth = 1.8, style }: IconProps) => base(size, strokeWidth, <>
  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
</>, style)

export const DownloadIcon = ({ size = 16, strokeWidth = 1.8, style }: IconProps) => base(size, strokeWidth, <>
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  <polyline points="7 10 12 15 17 10" />
  <line x1="12" y1="15" x2="12" y2="3" />
</>, style)

export const WifiOffIcon = ({ size = 14, strokeWidth = 1.8, style }: IconProps) => base(size, strokeWidth, <>
  <line x1="1" y1="1" x2="23" y2="23" />
  <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
</>, style)

export const FlameIcon = ({ size = 16, strokeWidth = 1.8, style }: IconProps) => base(size, strokeWidth, <>
  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
</>, style)
