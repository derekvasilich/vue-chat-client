import { createApp } from 'vue'
import { setApiConfig } from '../src/composables/useApi'
import { welcomeMessage } from '../src/composables/useChatStore'
import { useConversation } from '../src/composables/useConversation'

const endpoint = import.meta.env.VITE_AGENT_API_ENDPOINT || 'http://localhost:8080'
const welcome = import.meta.env.VITE_WELCOME_MESSAGE || 'Hello! How can I help you today?'
const API_TOKEN = 'ai-chat:token'
const token = sessionStorage.getItem(API_TOKEN) || ''

setApiConfig(endpoint, token)
welcomeMessage.value = welcome

// Set up window.AIChatWidget for the example page buttons
import { setApiToken } from '../src/composables/useApi'
import { openWidget, closeWidget } from '../src/composables/useChatStore'
import Login from './Login.vue'

const { sendMessage } = useConversation()

window.AIChatWidget = {
  init(_config?: { endpoint?: string; token?: string; welcomeMessage?: string }) {},
  setToken(jwt: string) {
    sessionStorage.setItem(API_TOKEN, jwt)
    setApiToken(jwt)
  },
  open: openWidget,
  close: closeWidget,
  sendMessage(text: string) {
    sendMessage(text).catch(console.error)
  },
}

window.addEventListener('message', (event: MessageEvent) => {
  const data = event.data
  if (!data || typeof data !== 'object') return
  switch (data.type) {
    case 'AI_CHAT_SEND':
      window.AIChatWidget.sendMessage(data.message)
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

const app = createApp(Login)
const container = document.createElement('div')
document.body.appendChild(container)
app.mount(container)

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
