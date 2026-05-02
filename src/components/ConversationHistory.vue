<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useConversations } from '../composables/useConversations'
import { useConversation } from '../composables/useConversation'
import {
  currentConversation,
  currentView,
  clearConversation,
} from '../composables/useChatStore'
import type { ConversationResponse } from '../types/api'

const { conversations, total, isLoading, load, loadMore, deleteConversation } = useConversations()
const { loadOrCreateConversation } = useConversation()

const search = ref('')
const confirmDeleteId = ref<string | null>(null)

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return conversations.value
  return conversations.value.filter((c) =>
    c.title.toLowerCase().includes(q)
  )
})

const hasMore = computed(() => total.value > conversations.value.length)

onMounted(() => load(true))

function relativeDate(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString()
}

async function selectConversation(conv: ConversationResponse) {
  await loadOrCreateConversation(conv.id)
  currentView.value = 'chat'
}

function confirmDelete(id: string) {
  confirmDeleteId.value = id
}

function conversationTitle(conv: ConversationResponse) {
  if (conv.first_message) {
    return conv.first_message.content?.substring(0, 100);
  }
  return conv.title;
}

async function executeDelete(id: string) {
  const isActive = currentConversation.value?.id === id
  await deleteConversation(id)
  confirmDeleteId.value = null
  if (isActive) {
    clearConversation()
    currentView.value = 'chat'
  }
}

function cancelDelete() {
  confirmDeleteId.value = null
}
</script>

<template>
  <div class="ac-history">
    <div class="ac-history__search">
      <input
        v-model="search"
        type="text"
        placeholder="Search conversations…"
        class="ac-history__input"
      />
    </div>

    <div v-if="isLoading && conversations.length === 0" class="ac-history__loading">
      Loading…
    </div>

    <div v-else-if="filtered.length === 0" class="ac-history__empty">
      No conversations found
    </div>

    <ul v-else class="ac-history__list">
      <li
        v-for="conv in filtered"
        :key="conv.id"
        class="ac-history__item"
        :class="{ 'ac-history__item--active': currentConversation?.id === conv.id }"
      >
        <template v-if="confirmDeleteId === conv.id">
          <span class="ac-history__confirm-text">Delete this conversation?</span>
          <div class="ac-history__confirm-actions">
            <button class="ac-btn ac-btn--danger-sm" @click="executeDelete(conv.id)">Yes</button>
            <button class="ac-btn ac-btn--ghost-sm" @click="cancelDelete">No</button>
          </div>
        </template>
        <template v-else>
          <button class="ac-history__row" @click="selectConversation(conv)">
            <span class="ac-history__title">{{ conversationTitle(conv) }}</span>
            <span class="ac-history__date">{{ relativeDate(conv.updated_at) }}</span>
          </button>
          <button
            class="ac-history__delete"
            aria-label="Delete conversation"
            @click.stop="confirmDelete(conv.id)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </template>
      </li>
    </ul>

    <button
      v-if="hasMore"
      class="ac-btn ac-btn--ghost ac-history__load-more"
      :disabled="isLoading"
      @click="loadMore"
    >
      {{ isLoading ? 'Loading…' : 'Load more' }}
    </button>

    <div class="ac-history__footer">
      <button class="ac-btn ac-btn--ghost" @click="currentView = 'chat'">
        ← Back to chat
      </button>
    </div>
  </div>
</template>

<style scoped>
.ac-history {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;
  gap: 8px;
  overflow: hidden;
}

.ac-history__search {
  flex-shrink: 0;
}

.ac-history__input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  outline: none;
}

.ac-history__input:focus {
  border-color: var(--ac-primary, #2563eb);
}

.ac-history__loading,
.ac-history__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 13px;
}

.ac-history__list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ac-history__item {
  display: flex;
  align-items: center;
  border-radius: 8px;
  padding: 2px 4px;
  gap: 4px;
  transition: background 0.1s;
  min-height: 44px;
}

.ac-history__item:hover {
  background: #f3f4f6;
}

.ac-history__item--active {
  background: #eff6ff;
}

.ac-history__row {
  flex: 1;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ac-history__title {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ac-history__date {
  font-size: 11px;
  color: #9ca3af;
}

.ac-history__delete {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  padding: 6px;
  border-radius: 6px;
  line-height: 0;
  opacity: 0;
  transition: opacity 0.1s, color 0.1s;
}

.ac-history__item:hover .ac-history__delete {
  opacity: 1;
}

.ac-history__delete:hover {
  color: #ef4444;
  background: #fee2e2;
}

.ac-history__confirm-text {
  flex: 1;
  font-size: 12px;
  color: #374151;
  padding: 0 6px;
}

.ac-history__confirm-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.ac-history__load-more {
  flex-shrink: 0;
  align-self: center;
}

.ac-history__footer {
  flex-shrink: 0;
  border-top: 1px solid #e5e7eb;
  padding-top: 8px;
}

.ac-btn {
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  border: none;
  font-family: inherit;
}

.ac-btn--ghost {
  background: none;
  color: #374151;
  border: 1px solid #d1d5db;
}

.ac-btn--ghost:hover {
  background: #f3f4f6;
}

.ac-btn--ghost-sm {
  background: none;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
}

.ac-btn--danger-sm {
  background: #ef4444;
  color: #fff;
  border: none;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
}

.ac-btn--danger-sm:hover {
  background: #dc2626;
}

.ac-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
