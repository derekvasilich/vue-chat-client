<script setup lang="ts">
import { computed, ref } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import type { MessageResponse } from '../types/api'
import { isStreaming, streamingContent } from '../composables/useChatStore'

const props = defineProps<{
  message: MessageResponse
  isStreamingBubble?: boolean
}>()

// Configure marked with highlight.js
marked.setOptions({
  highlight(code: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true,
} as any)

const content = computed(() => {
  if (props.isStreamingBubble) return streamingContent.value
  return props.message.content ?? ''
})

const renderedHtml = computed(() => {
  if (props.message.role !== 'assistant' && !props.isStreamingBubble) return ''
  return marked(content.value) as string
})

const relativeTime = computed(() => {
  const d = new Date(props.message.created_at)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return d.toLocaleDateString()
})

const copied = ref(false)

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(content.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // ignore
  }
}

const isUser = computed(() => props.message.role === 'user')
const isAssistant = computed(() => props.message.role === 'assistant' || props.isStreamingBubble)

const toolName = computed(() => {
  const calls = props.message.tool_calls
  if (calls && calls.length > 0 && calls[0]?.function?.name) {
    return calls[0].function.name
  }
  return null
})
</script>

<template>
  <div
    class="ac-message"
    :class="{
      'ac-message--user': isUser,
      'ac-message--assistant': isAssistant,
    }"
  >
    <div v-if="toolName" class="ac-message__tool-chip">
      🔧 Used tool: {{ toolName }}
    </div>

    <div class="ac-message__bubble">
      <div
        v-if="isAssistant"
        class="ac-message__content ac-message__content--md"
        v-html="renderedHtml"
      />
      <span v-if="isStreamingBubble && isStreaming" class="ac-message__cursor" />

      <div v-if="isUser" class="ac-message__content">{{ content }}</div>

      <div class="ac-message__meta">
        <span class="ac-message__time">{{ relativeTime }}</span>
        <span
          v-if="message.token_count"
          class="ac-message__tokens"
        >{{ message.token_count }} tok</span>
      </div>

      <button
        v-if="isAssistant && !isStreamingBubble"
        class="ac-message__copy"
        :title="copied ? 'Copied!' : 'Copy'"
        @click="copyToClipboard"
      >
        <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.ac-message {
  display: flex;
  flex-direction: column;
  margin: 4px 0;
}

.ac-message--user {
  align-items: flex-end;
}

.ac-message--assistant {
  align-items: flex-start;
}

.ac-message__tool-chip {
  font-size: 11px;
  color: #6b7280;
  background: #e5e7eb;
  border-radius: 999px;
  padding: 2px 10px;
  margin-bottom: 4px;
  align-self: flex-start;
}

.ac-message__bubble {
  position: relative;
  max-width: 80%;
  padding: 10px 14px;
}

.ac-message--user .ac-message__bubble {
  background: var(--ac-user-bubble-bg, #2563eb);
  color: var(--ac-user-bubble-text, #ffffff);
  border-radius: 18px 18px 4px 18px;
}

.ac-message--assistant .ac-message__bubble {
  background: var(--ac-agent-bubble-bg, #f3f4f6);
  color: var(--ac-agent-bubble-text, #111827);
  border-radius: 18px 18px 18px 4px;
}

.ac-message__content {
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  max-width: 650px;
}

.ac-message__content--md :deep(p) { margin: 0 0 8px; }
.ac-message__content--md :deep(p:last-child) { margin-bottom: 0; }
.ac-message__content--md :deep(pre) {
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  overflow-x: auto;
  font-size: 13px;
  margin: 8px 0;
}
.ac-message__content--md :deep(code:not(pre code)) {
  background: rgba(0,0,0,0.08);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 13px;
}
.ac-message__content--md :deep(ul), .ac-message__content--md :deep(ol) {
  padding-left: 20px;
  margin: 4px 0;
}

.ac-message__cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: currentColor;
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: ac-blink 1s step-end infinite;
}

@keyframes ac-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.ac-message__meta {
  display: none;
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
  gap: 6px;
}

.ac-message__bubble:hover .ac-message__meta {
  display: flex;
}

.ac-message__copy {
  position: absolute;
  top: 6px;
  right: 6px;
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  line-height: 0;
}

.ac-message__copy:hover {
  background: rgba(0,0,0,0.08);
  color: #374151;
}

.ac-message__bubble:hover .ac-message__copy {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
