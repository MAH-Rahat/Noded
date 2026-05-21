import React from 'react'
import { GlobalStatsBar } from '../components/layout/GlobalStatsBar'
import { BentoGrid } from '../components/layout/BentoGrid'
import { ModuleCard } from '../components/layout/ModuleCard'
import { EmptyState } from '../components/ui/EmptyState'
import { PageTransition } from '../components/layout/PageTransition'

export default function DashboardPage() {
  return (
    <PageTransition>
      <GlobalStatsBar loading={false} notesCount={0} tasksDoneToday={0} balance="৳0" />
      <BentoGrid>
        <ModuleCard title="The Ledger" style={{ minHeight: '320px' }}>
          <EmptyState message="No transactions yet. Add your first income or expense." />
        </ModuleCard>
        <ModuleCard title="Routine & Relay" style={{ minHeight: '320px' }}>
          <EmptyState message="No tasks for today. Add your first task to get started." />
        </ModuleCard>
        <ModuleCard title="The Canvas" style={{ minHeight: '320px' }}>
          <EmptyState message="No notes yet. Click to create your first note." />
        </ModuleCard>
        <ModuleCard title="The Vault" style={{ minHeight: '320px' }}>
          <EmptyState message="Vault is locked. Unlock to view your secrets." />
        </ModuleCard>
      </BentoGrid>
    </PageTransition>
  )
}
