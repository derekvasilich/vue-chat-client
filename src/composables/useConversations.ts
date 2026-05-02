import { ref } from 'vue'
import { api } from './useApi'
import type { ConversationResponse } from '../types/api'

export function useConversations() {
  const conversations = ref<ConversationResponse[]>([])
  const total = ref(0)
  const page = ref(1)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function load(reset = false) {
    if (reset) {
      page.value = 1
      conversations.value = []
    }
    isLoading.value = true
    error.value = null
    try {
      const result = await api.listConversations(page.value, 20)
      if (reset) {
        conversations.value = result.items
      } else {
        conversations.value.push(...result.items)
      }
      total.value = result.total
    } catch (e: any) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  async function loadMore() {
    page.value++
    await load()
  }

  async function deleteConversation(id: string) {
    await api.deleteConversation(id)
    conversations.value = conversations.value.filter((c) => c.id !== id)
    total.value--
  }

  return { conversations, total, page, isLoading, error, load, loadMore, deleteConversation }
}
