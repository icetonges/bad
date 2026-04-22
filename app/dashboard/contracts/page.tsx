import { CategoryPage } from '@/components/features/category-page'

export default function ContractsPage() {
  return (
    <CategoryPage
      category="contracts"
      title="Contracts"
      subtitle="Contract files, cost proposals, performance data, FAR and DFARS compliance."
      quickActions={[
        { label: 'Contract summary', prompt: 'Produce a contract summary for each uploaded contract: type (FFP/CPFF/T&M), period of performance, total value, option structure, small business designation.' },
        { label: 'Cost proposal review', prompt: 'Review the cost proposals in my uploaded documents. Assess labor rate reasonableness, indirect rate structure, profit/fee, and flag FAR 15.4 / FAR 31 concerns.' },
        { label: 'Competition analysis', prompt: 'Analyze competition status of my uploaded contracts. Full and open vs limited vs sole source. Review justifications under FAR 6.302.' },
        { label: 'Performance variance', prompt: 'Calculate cost variance, schedule variance, ETC, and EAC from my uploaded EVM data. Flag breach thresholds.' },
        { label: 'FAR/DFARS compliance review', prompt: 'Scan my uploaded contracts for FAR and DFARS compliance issues. Reference specific clauses by number.' },
      ]}
    />
  )
}
