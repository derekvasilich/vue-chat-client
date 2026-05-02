import { ref } from 'vue'
import type { ConversationResponse, MessageResponse } from '../types/api'

const STORAGE_KEY = 'ac_conversation_id'

export function hasConversationId(): boolean {
  return !!localStorage.getItem(STORAGE_KEY)
}

// Singleton module-level state
export const token = ref<string>('')
export const isOpen = ref<boolean>(hasConversationId())
export const currentView = ref<'chat' | 'history' | 'settings'>('chat')
export const currentConversation = ref<ConversationResponse | null>(null)
export const messages = ref<MessageResponse[]>([])
export const isStreaming = ref<boolean>(false)
export const streamingContent = ref<string>('')
export const hasUnread = ref<boolean>(false)
export const welcomeMessage = ref<string>('Hello! How can I help you today?')

export function saveConversationId(id: string | null) {
  if (id) {
    localStorage.setItem(STORAGE_KEY, id)
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function getSavedConversationId(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function openWidget() {
  isOpen.value = true
  hasUnread.value = false
}

export function closeWidget() {
  isOpen.value = false
}

export function clearConversation() {
  currentConversation.value = null
  messages.value = []
  streamingContent.value = ''
  isStreaming.value = false
  saveConversationId(null)
}
