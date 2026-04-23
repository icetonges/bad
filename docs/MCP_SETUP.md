# MCP Setup

MCP (Model Context Protocol) lets the agent call tools on external servers. Use it when you want specialized capability without baking it into the main codebase.

## How this app talks to MCP

`lib/agent/mcp/client.ts` uses `@modelcontextprotocol/sdk` with a stdio transport. The `mcp_call` tool on the agent routes `{server, tool, arguments}` through it.

Set `MCP_SERVERS` env var to a comma-separated list of server invocation commands:

```bash
MCP_SERVERS=python /var/task/mcp/sam_gov.py,node /var/task/mcp/usaspending.js
```

Each entry is the full command to launch the server. The client caches the connection per command string.

## Federal-domain MCP servers worth building

None of these ship with this scaffold — they are the natural extensions for a federal analyst workflow.

### SAM.gov contract opportunities

```python
# mcp/sam_gov.py
from mcp.server import Server
import httpx

app = Server("sam-gov")

@app.list_tools()
async def tools():
    return [
        {
            "name": "search_opportunities",
            "description": "Search SAM.gov contract opportunities",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "keywords": {"type": "string"},
                    "naics": {"type": "string"},
                    "setaside": {"type": "string"},
                    "posted_from": {"type": "string"},
                },
                "required": ["keywords"],
            },
        },
    ]

@app.call_tool()
async def call(name, arguments):
    if name == "search_opportunities":
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://api.sam.gov/opportunities/v2/search",
                params={
                    "api_key": os.environ["SAM_API_KEY"],
                    "q": arguments["keywords"],
                    "naicsCode": arguments.get("naics"),
                    "typeOfSetAside": arguments.get("setaside"),
                    "postedFrom": arguments.get("posted_from"),
                },
            )
            return r.json()
```

Register a free API key at api.sam.gov. Rate limit is 1,000 requests/hour.

### USASpending.gov

```python
# mcp/usaspending.py
# Exposes award search, agency spending, recipient lookup
# API docs: https://api.usaspending.gov
```

Useful tools to expose:
- `search_awards(keywords, agency, fiscal_year)` — POST `/api/v2/search/spending_by_award`
- `agency_overview(toptier_code, fiscal_year)` — GET `/api/v2/agency/{code}/`
- `recipient_lookup(uei, duns)` — GET `/api/v2/recipient/duns/{uei}`

### FPDS-NG

FPDS-NG has an ATOM feed, not a modern REST API. Wrap it:

```python
# mcp/fpds.py
# Searches FPDS-NG contract actions, returns parsed XML
```

### CRS Reports (via CRSReports.congress.gov)

```python
# mcp/crs_reports.py
# Fetches CRS reports by product number or keyword
```

### Federal Register

Has a clean JSON API:

```python
# mcp/federal_register.py
# Document search, notice of proposed rulemaking tracking
```

## Remote MCP (SSE transport)

For servers that should be deployed separately (e.g. on Railway or Render), use SSE transport:

```ts
// lib/agent/mcp/client.ts — alternative transport
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'

const transport = new SSEClientTransport(new URL('https://mcp-sam-gov.yourapp.com/sse'))
const client = new Client({ name: 'fedfmmatter', version: '0.1.0' }, { capabilities: {} })
await client.connect(transport)
```

Change `MCP_SERVERS` to URLs and update `connectMcpServer` in `lib/agent/mcp/client.ts` to parse URL vs command.

## Using MCP tools as first-class agent tools

Right now the agent invokes MCP through the single `mcp_call` tool with server+tool+arguments. This works but requires the agent to know the MCP tool schemas out-of-band.

A better pattern: dynamically enumerate MCP tools at startup and register them as top-level tools. The Anthropic SDK supports this directly via the `mcp_servers` parameter in `messages.create`:

```ts
const response = await client.messages.create({
  model: 'claude-opus-4-7',
  mcp_servers: [
    { type: 'url', url: 'https://mcp-sam-gov.yourapp.com', name: 'sam-gov' },
  ],
  // ...
})
```

When this lands in production use-cases, refactor `lib/agent/agent.ts` to pass `mcp_servers` through rather than wrapping MCP behind a single tool.

## Security

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to an MCP server unless it is on the same trust boundary
- MCP servers that hit external APIs should have their own API keys, not your Anthropic key
- Rate-limit MCP calls per user session — the agent can loop and burn requests quickly
- Log every MCP call to an audit table: `{user_id, server, tool, arguments, output, duration_ms, created_at}`

## Testing MCP locally

```bash
# In one terminal
python mcp/sam_gov.py

# In .env.local
MCP_SERVERS=python /absolute/path/to/mcp/sam_gov.py

# Restart next dev
npm run dev
```

Send a chat message that would trigger SAM.gov lookup. Watch for `mcp_call` in the tool call UI.
