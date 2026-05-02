import { createApp } from 'vue'
import ChatWidget from './ChatWidget.vue'
import { setApiConfig, setApiToken } from './composables/useApi'
import {
  token,
  welcomeMessage,
  openWidget,
  closeWidget,
  getSavedConversationId,
} from './composables/useChatStore'
import { useConversation } from './composables/useConversation'

let app: ReturnType<typeof createApp> | null = null

function getScriptDataAttrs() {
  const scripts = document.querySelectorAll('script[data-api-endpoint]')
  const script = scripts[scripts.length - 1] as HTMLScriptElement | null
  return {
    endpoint: script?.dataset.apiEndpoint ?? import.meta.env.VITE_AGENT_API_ENDPOINT ?? 'http://localhost:8080',
    token: script?.dataset.token ?? '',
    welcomeMessage: script?.dataset.welcomeMessage ?? import.meta.env.VITE_WELCOME_MESSAGE ?? 'Hello! How can I help you today?',
  }
}

function mount(config: { endpoint: string; token: string; welcomeMessage: string }) {
  if (app) return

  setApiConfig(config.endpoint, config.token)
  token.value = config.token
  welcomeMessage.value = config.welcomeMessage

  const container = document.createElement('div')
  container.id = 'ai-chat-widget'
  document.body.appendChild(container)

  app = createApp(ChatWidget)
  app.mount(container)

  // Init conversation from localStorage
  const { loadOrCreateConversation } = useConversation()
  const savedId = getSavedConversationId()
  if (savedId) {
    loadOrCreateConversation(savedId).catch(console.error)
  }
}

function init(config: { endpoint?: string; token?: string; welcomeMessage?: string } = {}) {
  const defaults = getScriptDataAttrs()
  mount({
    endpoint: config.endpoint ?? defaults.endpoint,
    token: config.token ?? defaults.token,
    welcomeMessage: config.welcomeMessage ?? defaults.welcomeMessage,
  })
}

function sendMessage(text: string) {
  const { sendMessage: doSend } = useConversation()
  doSend(text).catch(console.error)
}

window.AIChatWidget = {
  init,
  setToken(jwt: string) {
    setApiToken(jwt)
    token.value = jwt
  },
  open: openWidget,
  close: closeWidget,
  sendMessage,
}

// Listen for postMessage events
window.addEventListener('message', (event: MessageEvent) => {
  const data = event.data
  if (!data || typeof data !== 'object') return
  switch (data.type) {
    case 'AI_CHAT_SEND':
      sendMessage(data.message)
      break
    case 'AI_CHAT_SET_TOKEN':
      window.AIChatWidget.setToken(data.token)
      break
    case 'AI_CHAT_OPEN':
      openWidget()
      break
    case 'AI_CHAT_CLOSE':
      closeWidget()
      break
  }
})

// Auto-mount on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const attrs = getScriptDataAttrs()
    if (attrs.endpoint) {
      mount(attrs)
    }
  })
} else {
  const attrs = getScriptDataAttrs()
  if (attrs.endpoint) {
    mount(attrs)
  }
}

// Type declaration for window
declare global {
  interface Window {
    AIChatWidget: {
      init(config?: { endpoint?: string; token?: string; welcomeMessage?: string }): void
      setToken(jwt: string): void
      open(): void
      close(): void
      sendMessage(text: string): void
    }
  }
}
