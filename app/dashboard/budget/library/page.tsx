import { LibraryPage } from '@/components/features/library-page'

export default function BudgetLibraryPage() {
  return (
    <LibraryPage
      category="budget"
      categoryLabel="Budget & Programs"
      backHref="/dashboard/budget"
      backLabel="program analysis"
      description="PB justification books, OMB A-11 submissions, appropriation bills, reprogramming requests, R-1/P-1 exhibits."
    />
  )
}
