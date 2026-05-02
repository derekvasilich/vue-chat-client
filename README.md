# Vue AI Chat Widget

A production-ready, embeddable Vue 3 AI chat widget. Works as a standalone dev app and as a `<script>` tag widget in any host page.

---

## Quick Start

```bash
npm install
cp .env.example .env
# edit .env to set VITE_AGENT_API_ENDPOINT
npm run dev
```

Open http://localhost:5173 for the example app. The chat bubble appears in the bottom-right corner.

---

## Script Tag Integration

Add one `<script>` tag to any page:

```html
<script
  src="https://your-cdn.example.com/ai-chat-widget.js"
  data-api-endpoint="https://api.example.com"
  data-token="eyJhbGciOiJIUzI1NiJ9..."
  data-welcome-message="Hi! How can I assist you?"
></script>
```

| Attribute | Required | Description |
|-----------|----------|-------------|
| `data-api-endpoint` | Yes | Base URL of the backend API |
| `data-token` | No | JWT bearer token |
| `data-welcome-message` | No | Empty-state welcome text (default: "Hello! How can I help you today?") |

The widget auto-mounts on `DOMContentLoaded`.

---

## Token Injection

Three ways to provide/update the auth token:

**1. data attribute (page load)**
```html
<script src="..." data-token="eyJ..."></script>
```

**2. JavaScript API (runtime refresh)**
```js
window.AIChatWidget.setToken('new-jwt-token')
```

**3. postMessage (cross-frame)**
```js
window.postMessage({ type: 'AI_CHAT_SET_TOKEN', token: 'new-jwt-token' }, '*')
```

**Token refresh pattern** (e.g. before expiry):
```js
async function refreshAndUpdate() {
  const newToken = await yourAuthClient.refreshToken()
  window.AIChatWidget.setToken(newToken)
}
// call refreshAndUpdate() before token expires
```

---

## JavaScript API

```js
// Initialize with config (if not using data-* attributes)
window.AIChatWidget.init({
  endpoint: 'https://api.example.com',
  token: 'eyJ...',
  welcomeMessage: 'Hello!',
})

window.AIChatWidget.setToken('new-token')   // update token
window.AIChatWidget.open()                  // open dialog
window.AIChatWidget.close()                 // close dialog
window.AIChatWidget.sendMessage('Hello!')   // send programmatically
```

---

## postMessage API

Send from any frame or script on the same page:

```js
// Send a chat message
window.postMessage({ type: 'AI_CHAT_SEND', message: 'Hello!' }, '*')

// Update the auth token
window.postMessage({ type: 'AI_CHAT_SET_TOKEN', token: 'eyJ...' }, '*')

// Open the chat dialog
window.postMessage({ type: 'AI_CHAT_OPEN' }, '*')

// Close the chat dialog
window.postMessage({ type: 'AI_CHAT_CLOSE' }, '*')
```

| Event type | Payload fields |
|------------|----------------|
| `AI_CHAT_SEND` | `message: string` |
| `AI_CHAT_SET_TOKEN` | `token: string` |
| `AI_CHAT_OPEN` | _(none)_ |
| `AI_CHAT_CLOSE` | _(none)_ |

---

## CSS Theming

Override any CSS custom property on `:root` or a parent element:

```css
:root {
  --ac-primary: #7c3aed;           /* bubble + send button color */
  --ac-primary-hover: #6d28d9;
  --ac-user-bubble-bg: #7c3aed;    /* user message background */
  --ac-user-bubble-text: #ffffff;
  --ac-agent-bubble-bg: #f3f4f6;   /* assistant message background */
  --ac-agent-bubble-text: #111827;
  --ac-dialog-bg: #ffffff;         /* dialog background */
  --ac-header-bg: #1e293b;         /* dialog header background */
  --ac-header-text: #ffffff;
  --ac-bubble-shadow: 0 4px 24px rgba(0,0,0,0.18);
  --ac-font-family: inherit;
  --ac-border-radius: 16px;
}
```

---

## Building for Production

```bash
npm run build
```

This runs two builds:

| Output | Description |
|--------|-------------|
| `dist/widget/ai-chat-widget.js` | Self-contained IIFE bundle — use with `<script src="...">` |
| `dist/example/` | Static example app |

Build only the widget:
```bash
npm run build:widget
```

---

## Running Tests

```bash
npm test
```

Tests use Jest + `@vue/test-utils`. Each component has a test file under `tests/components/`.

---

## Architecture Overview

### State (`useChatStore.ts`)
Module-level reactive refs — no Pinia. Singleton state shared across all component instances. Persists the active conversation ID to `localStorage` (`ac_conversation_id`).

### API Layer (`useApi.ts`)
Typed `fetch` wrapper. All requests inject `Authorization: Bearer <token>`. Streaming uses `ReadableStream` + `TextDecoder` to parse SSE `data:` lines.

### Composables
| File | Purpose |
|------|---------|
| `useApi.ts` | HTTP + SSE client |
| `useChatStore.ts` | Singleton reactive state |
| `useConversation.ts` | Send message, load/create conversation, paginated older messages |
| `useConversations.ts` | Paginated conversation list for history view |
| `useModels.ts` | Model list for settings |

### Streaming Flow
1. User submits → optimistic user message appended
2. `TypingIndicator` shown while waiting for first SSE byte
3. Streaming assistant bubble replaces indicator as tokens arrive
4. On complete, final `MessageResponse` pushed to `messages`
5. Falls back to non-streaming `POST` if stream fails

### Component Tree
```
ChatWidget
├── ChatBubble          (fixed bottom-right button)
└── ChatDialog          (slide-up dialog)
    ├── ConversationView
    │   ├── MessageBubble (×n)
    │   ├── TypingIndicator
    │   └── [ChatInput — inline]
    ├── ConversationHistory
    └── ConversationSettings
```
