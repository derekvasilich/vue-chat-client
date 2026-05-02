import { api, setApiConfig } from './useApi'
import {
  currentConversation,
  messages,
  isStreaming,
  streamingContent,
  isOpen,
  hasUnread,
  saveConversationId,
} from './useChatStore'
import type { MessageResponse } from '../types/api'

let nextCursor: string | null = null
let hasMore = false

export function useConversation() {
  async function loadOrCreateConversation(savedId: string | null): Promise<void> {
    if (savedId) {
      try {
        const [msgResult, convList] = await Promise.all([
          api.listMessages(savedId, 50),
          api.listConversations(1, 100),
        ])
        const conv = convList.items.find((c) => c.id === savedId) ?? null
        if (conv) {
          currentConversation.value = conv
          messages.value = [...msgResult.items].reverse()
          hasMore = msgResult.has_more
          nextCursor = msgResult.next_cursor
          saveConversationId(savedId)
          return
        }
      } catch {
        // conversation gone — fall through to create fresh
      }
    }

    await startNewConversation()
  }

  async function startNewConversation(): Promise<void> {
    const conv = await api.createConversation({ title: 'New Conversation' })
    currentConversation.value = conv
    messages.value = []
    hasMore = false
    nextCursor = null
    saveConversationId(conv.id)
  }

  async function loadOlderMessages(): Promise<boolean> {
    if (!hasMore || !nextCursor || !currentConversation.value) return false

    const result = await api.listMessages(
      currentConversation.value.id,
      50,
      nextCursor
    )
    const older = [...result.items].reverse()
    messages.value = [...older, ...messages.value]
    hasMore = result.has_more
    nextCursor = result.next_cursor
    return older.length > 0
  }

  async function sendMessage(content: string): Promise<void> {
    if (!currentConversation.value) return
    const convId = currentConversation.value.id
    const isFirst = messages.value.length === 0

    // Optimistic user message
    const optimisticId = `local-${Date.now()}`
    const optimisticMsg: MessageResponse = {
      id: optimisticId,
      conversation_id: convId,
      role: 'user',
      content,
      tool_calls: null,
      tool_call_id: null,
      model_used: null,
      token_count: null,
      created_at: new Date().toISOString(),
    }
    messages.value.push(optimisticMsg)

    // Auto-title on first message (fire-and-forget)
    if (isFirst) {
      autoTitle(convId, truncateTitle(content))
    }

    isStreaming.value = true
    streamingContent.value = ''

    try {
      let gotFirstChunk = false

      const gen = api.streamMessage(convId, content)
      const iterator = gen[Symbol.asyncIterator]()

      // Drain the generator
      while (true) {
        const result = await iterator.next()
        if (result.done) break
        streamingContent.value += result.value
        gotFirstChunk = true
      }

      if (gotFirstChunk && streamingContent.value) {
        const assistantMsg: MessageResponse = {
          id: `streamed-${Date.now()}`,
          conversation_id: convId,
          role: 'assistant',
          content: streamingContent.value,
          tool_calls: null,
          tool_call_id: null,
          model_used: null,
          token_count: null,
          created_at: new Date().toISOString(),
        }
        messages.value.push(assistantMsg)
      } else {
        // Streaming yielded nothing — use non-streaming fallback
        const resp = await api.sendMessage(convId, { content })
        messages.value.push(resp)
      }

      if (!isOpen.value) {
        hasUnread.value = true
      }
    } catch {
      // Fallback to non-streaming
      try {
        const resp = await api.sendMessage(convId, { content })
        messages.value.push(resp)
        if (!isOpen.value) hasUnread.value = true
      } catch (fallbackErr) {
        console.error('Send failed:', fallbackErr)
        messages.value = messages.value.filter((m) => m.id !== optimisticId)
      }
    } finally {
      isStreaming.value = false
      streamingContent.value = ''
    }
  }

  return {
    loadOrCreateConversation,
    startNewConversation,
    loadOlderMessages,
    sendMessage,
    get hasMore() {
      return hasMore
    },
  }
}

function truncateTitle(text: string): string {
  if (text.length <= 60) return text
  const cut = text.slice(0, 60)
  const lastSpace = cut.lastIndexOf(' ')
  return lastSpace > 0 ? cut.slice(0, lastSpace) : cut
}

function autoTitle(convId: string, title: string): void {
  // Fire-and-forget: attempt PATCH on the conversation title endpoint
  // (not in spec but common; silently ignore if unsupported)
  fetch(`/v1/conversations/${convId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  }).catch(() => {})
}
