import { CategoryPage } from '@/components/features/category-page'

export default function AccountingPage() {
  return (
    <CategoryPage
      category="accounting"
      title="Accounting &amp; data"
      subtitle="Financial statements, obligations, outlays, ULO analysis, cost reports, and execution data."
      quickActions={[
        { label: 'Obligation rate analysis', prompt: 'Calculate obligation rates by quarter and by appropriation from my uploaded execution data. Flag unusual patterns — back-loaded, Q4 spikes, expiring funds.' },
        { label: 'ULO analysis', prompt: 'Analyze Unliquidated Obligations in my uploaded documents. Identify stale ULOs, aging buckets, and cancellation risk.' },
        { label: 'TAFS summary', prompt: 'Build a Treasury Appropriation Fund Symbol summary from my uploaded documents, including period of availability and cancellation dates.' },
        { label: 'BA vs obligations vs outlays', prompt: 'Compare budget authority, obligations, and outlays across my uploaded documents. Produce a chart and identify execution gaps.' },
        { label: 'Object class breakdown', prompt: 'Break down spending by object class code (OC 11, 21, 22, 25, 31, 32) from my uploaded documents. Identify major cost drivers.' },
      ]}
    />
  )
}
