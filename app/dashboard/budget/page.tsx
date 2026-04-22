import { CategoryPage } from '@/components/features/category-page'

export default function BudgetPage() {
  return (
    <CategoryPage
      category="budget"
      title="Budget"
      subtitle="PB justifications, OMB Circular A-11 submissions, appropriation analyses, and reprogrammings."
      quickActions={[
        { label: 'Generate insider budget analysis', prompt: 'Produce an insider-quality budget analysis of my uploaded documents using the BUDGET_ANALYSIS_SKILL. Cover topline, appropriation structure, major program deltas, force structure implications, reform claims, and execution risk.' },
        { label: 'Compare FY27 to FY26 enacted', prompt: 'Compare the FY27 request to the FY26 enacted level in my uploaded documents. Focus on appropriation-title deltas and flag any program terminations or reversals.' },
        { label: 'Mandatory vs discretionary breakdown', prompt: 'Produce a detailed breakdown of mandatory vs discretionary funding by section and appropriation in my uploaded documents. Identify reconciliation dependencies.' },
        { label: 'Build procurement dashboard', prompt: 'Build a dashboard chart of procurement by service and appropriation title from my uploaded documents. Include discretionary and mandatory split.' },
        { label: 'Top weapons programs ranked', prompt: 'Produce a ranked list of top weapons procurement programs by dollars in my uploaded documents, with quantities and year-over-year change.' },
      ]}
    />
  )
}
