import { CategoryPage } from '@/components/features/category-page'

export default function AuditPage() {
  return (
    <CategoryPage
      category="audit"
      title="Audit"
      subtitle="GAO and IG reports, OMB Circular A-123 work, material weakness tracking, unmodified-opinion readiness."
      quickActions={[
        { label: 'Summarize findings', prompt: 'Summarize all findings and recommendations in my uploaded audit documents. Separate material weaknesses from significant deficiencies. Flag repeat findings.' },
        { label: 'CAP status', prompt: 'Build a Corrective Action Plan status table from my uploaded documents. Show open vs closed, due dates, and owners.' },
        { label: 'Readiness assessment', prompt: 'Assess the likelihood of achieving an improved audit opinion in the next cycle based on findings in my uploaded documents. Reference FMFIA, FFMIA, A-123 where applicable.' },
        { label: 'Year-over-year trend', prompt: 'Compare findings in my uploaded audit reports across years. Identify trend patterns and recurring issues.' },
        { label: 'Draft management response', prompt: 'Draft a management response template for the findings in my uploaded documents using standard federal audit response structure.' },
      ]}
    />
  )
}
