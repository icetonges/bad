import { LibraryPage } from '@/components/features/library-page'

export default function AccountingLibraryPage() {
  return (
    <LibraryPage
      category="accounting"
      categoryLabel="Accounting & Execution"
      backHref="/dashboard/accounting"
      backLabel="obligation analysis"
      description="Financial statements, SF-133 reports, execution reports, USSGL trial balances, obligations/outlays data, TAFS registers."
    />
  )
}
