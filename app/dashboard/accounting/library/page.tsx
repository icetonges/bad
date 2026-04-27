import { LibraryPage } from '@/components/features/library-page'
import { AutoIngestedFiles } from '@/components/features/auto-ingested-files'

export default function AccountingLibraryPage() {
  return (
    <div>
      <AutoIngestedFiles />
      <LibraryPage
      category="accounting"
      categoryLabel="Accounting & Execution"
      backHref="/dashboard/accounting"
      backLabel="obligation analysis"
      description="Financial statements, SF-133 reports, execution reports, USSGL trial balances, obligations/outlays data, TAFS registers."
    />
    </div>
  )
}
