import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUpIcon, CheckSquareIcon, FileTextIcon, ShieldIcon,
} from '../ui/Icons'
import api from '../../lib/api'

interface Step {
  id: string
  title: string
  subtitle: string
  description: string
  Icon?: React.ComponentType<any>
  accentColor: string
  isSpecial?: boolean
}

const STEPS: Step[] = [
  {
    id: 'welcome',
    title: 'Welcome to Noded',
    subtitle: 'Your personal command center',
    description: 'Everything you need in one place — finances, tasks, notes, and encrypted secrets.',
    accentColor: '#3B82F6',
    isSpecial: true,
  },
  {
    id: 'ledger',
    title: 'The Ledger',
    subtitle: 'Track your finances',
    description: 'Log income and expenses, visualize spending with charts, and set budget limits per category.',
    Icon: TrendingUpIcon,
    accentColor: '#10B981',
  },
  {
    id: 'tasks',
    title: 'Routine & Relay',
    subtitle: 'Build daily habits',
    description: 'Manage tasks with a visual timeline, track streaks, and never miss a deadline with reminders.',
    Icon: CheckSquareIcon,
    accentColor: '#3B82F6',
  },
  {
    id: 'canvas',
    title: 'The Canvas',
    subtitle: 'Capture your thoughts',
    description: 'Write in Markdown with a distraction-free editor. Tag, pin, and search your notes instantly.',
    Icon: FileTextIcon,
    accentColor: '#8B5CF6',
  },
  {
    id: 'vault',
    title: 'The Vault',
    subtitle: 'Secure your secrets',
    description: 'Store API keys, passwords, and personal IDs with AES-256 encryption. PIN-protected access.',
    Icon: ShieldIcon,
    accentColor: '#F59E0B',
  },
  {
    id: 'done',
    title: "You're all set",
    subtitle: 'Start using Noded',
    description: 'Your hub is ready. Explore each module from the navigation bar below.',
    accentColor: '#10B981',
    isSpecial: true,
  },
]

interface OnboardingOverlayProps {
  onComplete: () => void
}

export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()

  async function finish() {
    try {
      await api.patch('/api/v1/settings/preferences', { onboarding_completed: true })
    } catch { /* ignore */ }
    onComplete()
  }

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const isFirst = step === 0
  const StepIcon = current.Icon

  return createPortal(
    <div
      className="fade-in"
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(8, 10, 15, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="slide-up"
        style={{
          width: '100%', maxWidth: '380px',
          background: 'rgba(13, 16, 23, 0.85)',
          backdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding: '32px 28px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '160px', height: '160px', borderRadius: '50%',
          background: `${current.accentColor}20`,
          filter: 'blur(50px)', pointerEvents: 'none',
        }} />

        {/* Step progress dots */}
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '28px' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              height: '4px',
              width: i === step ? '20px' : '6px',
              borderRadius: '2px',
              background: i === step ? current.accentColor : 'rgba(255,255,255,0.15)',
              transition: 'all 300ms ease',
              boxShadow: i === step ? `0 0 8px ${current.accentColor}80` : 'none',
            }} />
          ))}
        </div>

        {/* Icon */}
        {StepIcon ? (
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: `${current.accentColor}15`,
            border: `1px solid ${current.accentColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: current.accentColor, marginBottom: '20px',
            boxShadow: `0 0 24px ${current.accentColor}20`,
          }}>
            <StepIcon size={26} strokeWidth={1.6} />
          </div>
        ) : (
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: `linear-gradient(135deg, ${current.accentColor}, ${current.accentColor}99)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: `0 0 32px ${current.accentColor}40`,
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem' }}>
              {isLast ? '✓' : 'N'}
            </span>
          </div>
        )}

        {/* Content */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: current.accentColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
            {current.subtitle}
          </p>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', marginBottom: '10px', lineHeight: 1.2 }}>
            {current.title}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            {current.description}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {!isFirst && !isLast && (
            <button onClick={() => setStep(s => s - 1)} style={{
              flex: 1, padding: '11px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--color-text-muted)', cursor: 'pointer',
              fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.875rem',
            }}>Back</button>
          )}
          <button
            onClick={isLast ? () => { finish(); navigate('/dashboard') } : () => setStep(s => s + 1)}
            style={{
              flex: 2, padding: '11px', borderRadius: '12px',
              background: `linear-gradient(135deg, ${current.accentColor}, ${current.accentColor}cc)`,
              border: 'none', color: '#fff', cursor: 'pointer',
              fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.9rem',
              boxShadow: `0 4px 20px ${current.accentColor}40`,
              transition: 'transform 150ms',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {isLast ? 'Get Started' : 'Next'}
          </button>
        </div>

        {/* Skip */}
        {!isLast && (
          <button onClick={finish} style={{
            display: 'block', width: '100%', marginTop: '12px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-muted)', fontFamily: 'var(--font-ui)',
            fontSize: '0.8rem', textAlign: 'center',
          }}>
            Skip onboarding
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}
