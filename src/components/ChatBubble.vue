<script setup lang="ts">
import { isOpen, hasUnread, openWidget } from '../composables/useChatStore'

function handleClick() {
  openWidget()
}
</script>

<template>
  <button
    class="ac-bubble"
    :class="{ 'ac-bubble--open': isOpen }"
    aria-label="Open AI Chat"
    @click="handleClick"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="ac-bubble__icon"
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.04 2 11c0 2.39.94 4.55 2.46 6.12L3 22l5.18-1.55C9.33 20.8 10.63 21 12 21c5.52 0 10-4.04 10-9s-4.48-9-10-9z" />
      <circle cx="8.5" cy="11" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="11" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="11" r="1.5" fill="currentColor" stroke="none" />
    </svg>
    <span v-if="hasUnread" class="ac-bubble__badge" aria-label="New messages" />
  </button>
</template>

<style scoped>
.ac-bubble {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--ac-primary, #2563eb);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--ac-bubble-shadow, 0 4px 24px rgba(0, 0, 0, 0.18));
  transition: transform 0.2s ease, background 0.2s ease;
  animation: ac-pulse 2s ease-out 0.5s 2;
}

.ac-bubble:hover {
  background: var(--ac-primary-hover, #1d4ed8);
  transform: scale(1.08);
}

.ac-bubble--open {
  transform: scale(0.92);
  animation: none;
}

.ac-bubble__icon {
  width: 26px;
  height: 26px;
}

.ac-bubble__badge {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ef4444;
  border: 2px solid #fff;
}

@keyframes ac-pulse {
  0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.6); }
  70% { box-shadow: 0 0 0 14px rgba(37, 99, 235, 0); }
  100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
}
</style>
