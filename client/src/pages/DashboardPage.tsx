import React from 'react'
import { GlobalStatsBar } from '../components/layout/GlobalStatsBar'
import { BentoGrid } from '../components/layout/BentoGrid'
import { LedgerCard } from '../components/ledger/LedgerCard'
import { RoutineRelayCard } from '../components/tasks/RoutineRelayCard'
import { CanvasCard } from '../components/notes/CanvasCard'
import { VaultCard } from '../components/vault/VaultCard'
import { PageTransition } from '../components/layout/PageTransition'

export default function DashboardPage() {
  return (
    <PageTransition>
      <GlobalStatsBar loading={false} notesCount={0} tasksDoneToday={0} balance="৳0" />
      <BentoGrid>
        <LedgerCard />
        <RoutineRelayCard />
        <CanvasCard />
        <VaultCard />
      </BentoGrid>
    </PageTransition>
  )
}
