<script setup lang="ts">
import ChatBubble from './components/ChatBubble.vue'
import ChatDialog from './components/ChatDialog.vue'
import {
  isOpen
} from './composables/useChatStore'
</script>

<template>
  <div class="ac-widget-root">
    <ChatBubble v-if="!isOpen"/>
    <ChatDialog v-else />
  </div>
</template>

<style>
/* Global CSS custom property defaults — host page can override */
:root {
  --ac-primary: #2563eb;
  --ac-primary-hover: #1d4ed8;
  --ac-user-bubble-bg: #2563eb;
  --ac-user-bubble-text: #ffffff;
  --ac-agent-bubble-bg: #f3f4f6;
  --ac-agent-bubble-text: #111827;
  --ac-dialog-bg: #ffffff;
  --ac-header-bg: #1e293b;
  --ac-header-text: #ffffff;
  --ac-bubble-shadow: 0 4px 24px rgba(0,0,0,0.18);
  --ac-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --ac-border-radius: 16px;
}

.ac-widget-root {
  font-family: var(--ac-font-family);
}
</style>
