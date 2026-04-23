'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChatInterface } from '@/components/features/chat-interface'

function ChatContent() {
  const params = useSearchParams()
  const category = params.get('category') || undefined
  const initialPrompt = params.get('prompt') || undefined

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border flex items-center px-5">
        <div>
          <h1 className="text-sm font-medium">Ask the agent</h1>
          {category && <p className="text-xs text-muted-foreground">Context: {category}</p>}
        </div>
      </div>
      <ChatInterface category={category} initialPrompt={initialPrompt} />
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <ChatContent />
    </Suspense>
  )
}
