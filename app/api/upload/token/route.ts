import { handleUpload, type HandleUploadBody } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/upload/token
 *
 * Called by @vercel/blob/client's upload() function automatically.
 * Two calls happen internally:
 *   1. Generate upload token (before the upload)
 *   2. Completion callback (after the upload finishes)
 *
 * We only use this for auth/size validation.
 * Text extraction happens separately via /api/upload after the client has the blob URL.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, _clientPayload) => ({
        access: 'public',
        allowedContentTypes: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
          'text/plain',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        maximumSizeInBytes: 50 * 1024 * 1024, // 50 MB
      }),
      onUploadCompleted: async () => {
        // Nothing here — processing triggered separately by the client
      },
    })
    return NextResponse.json(jsonResponse)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
