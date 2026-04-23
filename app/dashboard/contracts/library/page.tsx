import { LibraryPage } from '@/components/features/library-page'

export default function ContractsLibraryPage() {
  return (
    <LibraryPage
      category="contracts"
      categoryLabel="Contracts & Acquisition"
      backHref="/dashboard/contracts"
      backLabel="contract review"
      description="Contract documents, cost proposals, modifications, EVM reports, subcontractor agreements, FAR/DFARS compliance matrices."
    />
  )
}
