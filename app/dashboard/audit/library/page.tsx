import { LibraryPage } from '@/components/features/library-page'

export default function AuditLibraryPage() {
  return (
    <LibraryPage
      category="audit"
      categoryLabel="Audit & Assurance"
      backHref="/dashboard/audit"
      backLabel="findings tracker"
      description="GAO reports, IG findings, OMB A-123 workpapers, management responses, CAP tracking sheets, audit opinion letters."
    />
  )
}
