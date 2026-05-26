<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import MessageBubble from './MessageBubble.vue'
import TypingIndicator from './TypingIndicator.vue'
import {
  messages,
  isStreaming,
  streamingContent,
  currentConversation,
  welcomeMessage,
} from '../composables/useChatStore'
import { useConversation } from '../composables/useConversation'

const { sendMessage, loadOlderMessages, hasMore } = useConversation()

const scrollEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLTextAreaElement | null>(null)
const text = ref('')
const showScrollBtn = ref(false)
const isLoadingOlder = ref(false)
const atBottom = ref(true)

const MAX_CHARS = 5000
const SHOW_COUNT_THRESHOLD = 800

const charCount = computed(() => text.value.length)
const showCharCount = computed(() => charCount.value > SHOW_COUNT_THRESHOLD)
const visibleMessages = computed(() =>
  messages.value.filter(
    (m) => !(m.role === 'tool') && (m.content !== null || (m.tool_calls && m.tool_calls.length > 0))
  )
)

function isNearBottom(): boolean {
  const el = scrollEl.value
  if (!el) return true
  return el.scrollHeight - el.scrollTop - el.clientHeight < 100
}

function scrollToBottom(smooth = true) {
  const el = scrollEl.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' })
  showScrollBtn.value = false
}

function onScroll() {
  atBottom.value = isNearBottom()
  showScrollBtn.value = !atBottom.value

  // Infinite scroll up
  const el = scrollEl.value
  if (el && el.scrollTop < 60 && !isLoadingOlder.value && hasMore) {
    loadOlder()
  }
}

async function loadOlder() {
  if (isLoadingOlder.value) return
  isLoadingOlder.value = true
  const el = scrollEl.value
  const prevScrollHeight = el?.scrollHeight ?? 0
  try {
    await loadOlderMessages()
    await nextTick()
    if (el) {
      el.scrollTop = el.scrollHeight - prevScrollHeight
    }
  } finally {
    isLoadingOlder.value = false
  }
}

watch(
  () => messages.value.length,
  async () => {
    if (atBottom.value) {
      await nextTick()
      scrollToBottom(false)
    } else {
      showScrollBtn.value = true
    }
  }
)

watch(streamingContent, async () => {
  if (atBottom.value) {
    await nextTick()
    scrollToBottom(false)
  }
})

onMounted(() => {
  nextTick(() => scrollToBottom(false))
})

function autoResize() {
  const el = inputEl.value
  if (!el) return
  el.style.height = 'auto'
  const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 20
  const maxHeight = lineHeight * 5 + 24
  el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px'
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}

async function submit() {
  const content = text.value.trim()
  if (!content || isStreaming.value || content.length > MAX_CHARS) return
  text.value = ''
  await nextTick()
  autoResize()
  await sendMessage(content)
  await nextTick()
  scrollToBottom()
}
</script>

<template>
  <div class="ac-conv">
    <div class="ac-conv__messages" ref="scrollEl" @scroll="onScroll">
      <div v-if="isLoadingOlder" class="ac-conv__older-spinner">
        <svg class="ac-spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10" />
        </svg>
      </div>

      <div v-if="visibleMessages.length === 0 && !isStreaming" class="ac-conv__empty">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="56" height="56" fill="none" stroke="#9ca3af" stroke-width="2">
          <path d="M24 4C12.95 4 4 12.5 4 23c0 4.8 1.9 9.1 5 12.4L7 44l9.2-3.1C18.5 41.6 21.2 42 24 42c11.05 0 20-8.5 20-19S35.05 4 24 4z"/>
          <circle cx="17" cy="23" r="2.5" fill="#9ca3af" stroke="none"/>
          <circle cx="24" cy="23" r="2.5" fill="#9ca3af" stroke="none"/>
          <circle cx="31" cy="23" r="2.5" fill="#9ca3af" stroke="none"/>
        </svg>
        <p class="ac-conv__welcome">{{ welcomeMessage }}</p>
      </div>

      <template v-for="msg in visibleMessages" :key="msg.id">
        <MessageBubble :message="msg" />
      </template>

      <TypingIndicator v-if="isStreaming && !streamingContent" />

      <MessageBubble
        v-if="isStreaming && streamingContent"
        :message="{
          id: 'streaming',
          conversation_id: currentConversation?.id ?? '',
          role: 'assistant',
          content: streamingContent,
          tool_calls: null,
          tool_call_id: null,
          model_used: null,
          token_count: null,
          created_at: new Date().toISOString(),
        }"
        :is-streaming-bubble="true"
      />
    </div>

    <button
      v-if="showScrollBtn"
      class="ac-conv__scroll-btn"
      @click="scrollToBottom()"
    >
      ↓ New message
    </button>

    <div class="ac-input">
      <textarea
        ref="inputEl"
        v-model="text"
        class="ac-input__textarea"
        placeholder="Type a message…"
        rows="1"
        :maxlength="MAX_CHARS"
        :disabled="isStreaming"
        @input="autoResize"
        @keydown="onKeydown"
      />
      <div class="ac-input__footer">
        <span v-if="showCharCount" class="ac-input__count" :class="{ 'ac-input__count--warn': charCount > 950 }">
          {{ charCount }}/{{ MAX_CHARS }}
        </span>
        <button
          class="ac-input__send"
          :disabled="isStreaming || !text.trim()"
          @click="submit"
          aria-label="Send message"
        >
          <svg v-if="!isStreaming" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
          <svg v-else class="ac-spinner" viewBox="0 0 24 24" width="18" height="18">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ac-conv {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  position: relative;
}

.ac-conv__messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  scroll-behavior: smooth;
}

.ac-conv__older-spinner {
  display: flex;
  justify-content: center;
  padding: 8px;
}

.ac-conv__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #9ca3af;
  padding: 24px;
  text-align: center;
}

.ac-conv__welcome {
  font-size: 14px;
  color: #6b7280;
  max-width: 260px;
  line-height: 1.5;
}

.ac-conv__scroll-btn {
  position: absolute;
  bottom: 76px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--ac-primary, #2563eb);
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 2;
}

.ac-input {
  border-top: 1px solid #e5e7eb;
  padding: 8px 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ac-input__textarea {
  width: 100%;
  resize: none;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 14px;
  font-family: var(--ac-font-family, inherit);
  line-height: 1.5;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
  min-height: 42px;
  max-height: 130px;
  overflow-y: auto;
}

.ac-input__textarea:focus {
  border-color: var(--ac-primary, #2563eb);
}

.ac-input__textarea:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

.ac-input__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 6px;
  gap: 8px;
}

.ac-input__count {
  font-size: 11px;
  color: #9ca3af;
}

.ac-input__count--warn {
  color: #ef4444;
  font-weight: 600;
}

.ac-input__send {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--ac-primary, #2563eb);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  flex-shrink: 0;
  padding: 0;
}

.ac-input__send:hover:not(:disabled) {
  background: var(--ac-primary-hover, #1d4ed8);
}

.ac-input__send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ac-spinner {
  animation: ac-spin 0.8s linear infinite;
}

@keyframes ac-spin {
  to { transform: rotate(360deg); }
}
</style>
