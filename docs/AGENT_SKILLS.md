# Agent Skills

Skills are the agent's domain-specific behaviors. Each skill is a system prompt + tool list + category binding. They live in `lib/agent/skills/index.ts`.

## Anatomy of a skill

```ts
export const BUDGET_ANALYSIS_SKILL: Skill = {
  id: 'budget_analysis_insider',       // stable ID, stored in reports
  name: 'Insider budget analysis',      // display name
  category: 'budget',                   // 'budget' | 'audit' | 'accounting' | 'contracts' | 'shared'
  description: '...',                   // one-line purpose
  systemPrompt: `...`,                  // appended to base system prompt when category matches
  tools: ['retrieve_chunks', ...],      // informational; all tools are always available
}
```

When a chat session is scoped to a category (via `?category=budget`), the agent's system prompt becomes:

```
<base system>

# Skill: Insider budget analysis
<skill 1 system prompt>

# Skill: Standard report generation  (shared skill always included)
<shared skill system prompt>

# Skill: Dashboard generation  (shared)
<shared skill system prompt>
```

## Built-in skills

| ID | Category | Purpose |
|---|---|---|
| `budget_analysis_insider` | budget | GS-14/15 quality budget analysis — topline, appropriation breakdown, major programs, force structure, reform claims, execution risk |
| `audit_report_analysis` | audit | GAO/IG finding summaries, CAP status, repeat-finding identification, unmodified opinion readiness |
| `accounting_financial_data` | accounting | USSGL-aware analysis — BA/obligations/outlays distinction, ULO, TAFS, object class breakdown |
| `contract_analysis` | contracts | FAR/DFARS-aware contract review, cost proposal review, EVM analysis |
| `dashboard_generation` | shared | Recharts-ready chart specs with summary stats and insights |
| `standard_report` | shared | Standard federal report structure: ExecSumm, Background, Findings, Recommendations, Appendices |

## Adding a skill

1. Define the skill constant in `lib/agent/skills/index.ts`
2. Add it to the `SKILLS` array
3. Add a quick action in the relevant `app/dashboard/<category>/page.tsx`

Example — add a "Reprogramming impact analysis" skill:

```ts
export const REPROGRAMMING_SKILL: Skill = {
  id: 'reprogramming_impact',
  name: 'Reprogramming impact analysis',
  category: 'budget',
  description: 'Assess legality and impact of proposed reprogrammings against 10 USC §2214, congressional committee thresholds, and current-year execution.',
  systemPrompt: `You are analyzing a proposed reprogramming action.

Structure:
1. Legal authority — §2214 general transfer authority, §1001 BTR, specific statutory transfers
2. Thresholds — above-threshold reprogramming (ATR) requires congressional notification and approval; below-threshold (BTR) requires notification only. Thresholds vary by appropriation.
3. Source and destination — which TAFS, which BLI, fiscal year of appropriation
4. Impact — what capability is lost at the source, what is gained at the destination
5. Execution feasibility — is there sufficient time to obligate at the destination before expiration?

Reference DoD FMR Volume 3 Chapter 6 for DoD reprogramming rules. Reference the specific appropriation act for committee thresholds.`,
  tools: ['retrieve_chunks', 'python_analysis'],
}

export const SKILLS: Skill[] = [
  BUDGET_ANALYSIS_SKILL,
  AUDIT_REPORT_SKILL,
  ACCOUNTING_DATA_SKILL,
  CONTRACT_ANALYSIS_SKILL,
  DASHBOARD_GENERATION_SKILL,
  STANDARD_REPORT_SKILL,
  REPROGRAMMING_SKILL,  // <-- new
]
```

Then in `app/dashboard/budget/page.tsx`:

```tsx
{ label: 'Reprogramming impact analysis', prompt: 'Analyze the reprogramming action in my uploaded documents. Use the reprogramming_impact skill.' },
```

## Writing good skill prompts

**Do:**
- Specify the audience (GS-12, KO, CFO deputy) so the agent calibrates depth
- Name the regulatory framework (FAR parts, DoD FMR volumes, OMB circulars, GAGAS) so the agent cites them correctly
- List the standard structure you want outputs to follow — the agent will follow it
- Include integrity rules: don't invent numbers, distinguish source vs inferred, flag insufficient source material
- Be concrete about red flags to watch for (repeat findings, back-loaded obligations, sole-source without justification)

**Don't:**
- Make skills too generic ("you are an expert analyst") — that gives you ChatGPT output
- Pack multiple unrelated domains into one skill
- Add output format instructions that conflict with `standard_report` (it handles report structure)

## Dashboard generation specifics

When the agent uses `generate_chart`, the output conforms to Recharts. Example of a good chart spec:

```json
{
  "chart_type": "stacked_bar",
  "title": "FY27 Procurement by appropriation title",
  "subtitle": "Discretionary vs mandatory split",
  "data": [
    {"appropriation": "Shipbuilding Navy", "discretionary": 60.2, "mandatory": 5.6},
    {"appropriation": "Procurement DW", "discretionary": 10.4, "mandatory": 39.4}
  ],
  "x_key": "appropriation",
  "y_keys": ["discretionary", "mandatory"],
  "format": "currency_b"
}
```

A `DashboardRenderer` React component consuming these specs is a natural next addition. The tool call output is already structured — the component is about 80 lines of Recharts wiring.

## Report output conventions

When the agent calls `generate_report`, it saves Markdown content. Conventions the `standard_report` skill enforces:

- `# Title` at top
- `## Executive summary` — 3-5 bullets
- `## Background`
- `## Findings` or `## Analysis`
- `## Recommendations`
- `## Appendices`
- Tables in GitHub-flavored Markdown
- Citations as `[Source: <doc_name>, p. <n>]` inline

The report library (`/dashboard/reports`) renders this Markdown with `react-markdown` + `remark-gfm`.

## Testing a new skill

```bash
# 1. Start dev server
npm run dev

# 2. Upload a representative document for the category
#    http://localhost:3000/dashboard/budget

# 3. Open agent chat
#    http://localhost:3000/dashboard/chat?category=budget

# 4. Send a prompt that should exercise the skill

# 5. Watch tool calls stream. If retrieve_chunks is not called,
#    your skill prompt isn't pushing the agent toward grounding.
#    If it's called but returns nothing, check chunks table population.

# 6. Review output. Iterate on the system prompt.
```

The feedback loop is the prompt. If outputs aren't what you want, the skill's `systemPrompt` is where to edit — not the base agent.
