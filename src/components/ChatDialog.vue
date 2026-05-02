<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ConversationView from './ConversationView.vue'
import ConversationHistory from './ConversationHistory.vue'
import ConversationSettings from './ConversationSettings.vue'
import {
  isOpen,
  currentView,
  getSavedConversationId,
  clearConversation,
  closeWidget,
} from '../composables/useChatStore'
import { useConversation } from '../composables/useConversation'

const { startNewConversation, loadOrCreateConversation } = useConversation()

const menuOpen = ref(false)
const confirmDelete = ref(false)
const isFullscreen = ref(false)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
  confirmDelete.value = false
}

function closeMenu() {
  menuOpen.value = false
  confirmDelete.value = false
}

async function newChat() {
  closeMenu()
  await startNewConversation()
  currentView.value = 'chat'
}

function showHistory() {
  closeMenu()
  currentView.value = 'history'
}

function showSettings() {
  closeMenu()
  currentView.value = 'settings'
}

function promptDelete() {
  confirmDelete.value = true
}

async function executeDelete() {
  closeMenu()
  clearConversation()
  await startNewConversation()
  currentView.value = 'chat'
}

function cancelDelete() {
  confirmDelete.value = false
}

function handleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

function handleClose() {
  closeWidget()
  closeMenu()
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') handleClose()
}

onMounted(() => {
  // Init conversation from localStorage
  const { loadOrCreateConversation } = useConversation()
  const savedId = getSavedConversationId()
  loadOrCreateConversation(savedId).catch(console.error)
})
</script>

<template>
  <Transition name="ac-dialog">
    <div
      v-if="isOpen"
      class="ac-dialog"
      :class="{ 'ac-dialog--fullscreen': isFullscreen }"
      role="dialog"
      aria-modal="true"
      aria-label="AI Chat"
      @keydown="handleKeydown"
    >
      <div class="ac-dialog__header">
        <div class="ac-dialog__menu-wrap">
          <button
            class="ac-dialog__menu-btn"
            aria-label="Menu"
            @click="toggleMenu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10" style="margin-left:2px">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <div v-if="menuOpen" class="ac-menu" @click.stop>
            <button class="ac-menu__item" @click="newChat">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 5v14M5 12h14"/></svg>
              New Chat
            </button>
            <button class="ac-menu__item" @click="showHistory">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Conversation History
            </button>
            <button class="ac-menu__item" @click="showSettings">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Chat Settings
            </button>
            <div class="ac-menu__divider" />
            <template v-if="!confirmDelete">
              <button class="ac-menu__item ac-menu__item--danger" @click="promptDelete">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                Delete Conversation
              </button>
            </template>
            <template v-else>
              <div class="ac-menu__confirm">
                <span>Are you sure?</span>
                <div style="display:flex;gap:6px;margin-top:6px">
                  <button class="ac-btn-danger-xs" @click="executeDelete">Yes, delete</button>
                  <button class="ac-btn-ghost-xs" @click="cancelDelete">Cancel</button>
                </div>
              </div>
            </template>
          </div>
        </div>

        <span class="ac-dialog__title">AI Chat Agent</span>

        <button class="ac-dialog__full" :aria-label="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'" @click="handleFullscreen">
          <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
          </svg>
        </button>
        <button class="ac-dialog__close" aria-label="Close" @click="handleClose">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Backdrop for menu close -->
      <div v-if="menuOpen" class="ac-dialog__backdrop" @click="closeMenu" />

      <div class="ac-dialog__body">
        <Transition name="ac-view" mode="out-in">
          <ConversationView v-if="currentView === 'chat'" key="chat" />
          <ConversationHistory v-else-if="currentView === 'history'" key="history" />
          <ConversationSettings v-else-if="currentView === 'settings'" key="settings" />
        </Transition>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.ac-dialog {
  position: fixed;
  bottom: 20px;
  right: 24px;
  z-index: 9998;
  width: 400px;
  height: 600px;
  background: var(--ac-dialog-bg, #ffffff);
  border-radius: var(--ac-border-radius, 16px);
  box-shadow: var(--ac-bubble-shadow, 0 4px 24px rgba(0,0,0,0.18));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: var(--ac-font-family, inherit);
}

@media (max-width: 640px) {
  .ac-dialog {
    bottom: 0;
    right: 0;
    width: 100%;
    height: 100%;
    border-radius: 0;
  }
}

.ac-dialog__header {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 52px;
  background: var(--ac-header-bg, #1e293b);
  color: var(--ac-header-text, #ffffff);
  flex-shrink: 0;
  gap: 8px;
  position: relative;
}

.ac-dialog__menu-wrap {
  position: relative;
  flex-shrink: 0;
}

.ac-dialog__menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  display: flex;
  align-items: center;
  padding: 6px;
  border-radius: 6px;
  opacity: 0.85;
}

.ac-dialog__menu-btn:hover {
  background: rgba(255,255,255,0.1);
  opacity: 1;
}

.ac-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  min-width: 200px;
  z-index: 10000;
  padding: 6px;
  overflow: hidden;
}

.ac-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: none;
  border: none;
  text-align: left;
  padding: 9px 10px;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  font-family: inherit;
}

.ac-menu__item:hover {
  background: #f3f4f6;
}

.ac-menu__item--danger {
  color: #ef4444;
}

.ac-menu__item--danger:hover {
  background: #fee2e2;
}

.ac-menu__divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 0;
}

.ac-menu__confirm {
  padding: 10px 10px 6px;
  font-size: 13px;
  color: #374151;
}

.ac-btn-danger-xs {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}

.ac-btn-ghost-xs {
  background: none;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}

.ac-dialog__title {
  flex: 1;
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ac-dialog--fullscreen {
  bottom: 0;
  right: 0;
  width: 100%;
  height: 100%;
  border-radius: 0;
}

.ac-dialog__full,
.ac-dialog__close {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  padding: 6px;
  border-radius: 6px;
  opacity: 0.85;
  line-height: 0;
  flex-shrink: 0;
}

.ac-dialog__full:hover,
.ac-dialog__close:hover {
  background: rgba(255,255,255,0.1);
  opacity: 1;
}

.ac-dialog__backdrop {
  position: fixed;
  inset: 0;
  z-index: 9997;
}

.ac-dialog__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* Dialog transition */
.ac-dialog-enter-active {
  animation: ac-slide-up 0.25s ease-out;
}
.ac-dialog-leave-active {
  animation: ac-slide-up 0.2s ease-in reverse;
}
.ac-dialog-enter-from,
.ac-dialog-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.96);
}

@keyframes ac-slide-up {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* View transition */
.ac-view-enter-active,
.ac-view-leave-active {
  transition: opacity 0.15s ease;
}
.ac-view-enter-from,
.ac-view-leave-to {
  opacity: 0;
}
</style>
