import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

interface ConnectedServer {
  name: string
  client: Client
}

const clients = new Map<string, ConnectedServer>()

export async function getMcpServers(): Promise<string[]> {
  const raw = process.env.MCP_SERVERS || ''
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

export async function connectMcpServer(serverSpec: string): Promise<Client> {
  const existing = clients.get(serverSpec)
  if (existing) return existing.client

  const [command, ...args] = serverSpec.split(' ')
  const transport = new StdioClientTransport({ command, args })
  const client = new Client(
    { name: 'fedanalyst', version: '0.1.0' },
    { capabilities: {} }
  )
  await client.connect(transport)
  clients.set(serverSpec, { name: serverSpec, client })
  return client
}

export async function callMcpTool(
  server: string,
  tool: string,
  args: Record<string, unknown>
): Promise<unknown> {
  try {
    const client = await connectMcpServer(server)
    const result = await client.callTool({ name: tool, arguments: args })
    return result
  } catch (e) {
    return { error: String(e), note: 'MCP stub — configure MCP_SERVERS env var. See docs/MCP_SETUP.md' }
  }
}

export async function listMcpTools(server: string) {
  try {
    const client = await connectMcpServer(server)
    return await client.listTools()
  } catch (e) {
    return { error: String(e) }
  }
}
