import React from 'react'
import { PageLayout } from '../components/layout/PageLayout'
import { VaultCard } from '../components/vault/VaultCard'

export default function VaultPage() {
  return (
    <PageLayout title="Vault">
      <VaultCard />
    </PageLayout>
  )
}
