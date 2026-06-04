import type {
  ConversationCreate,
  ConversationResponse,
  ConversationListResponse,
  MessageResponse,
  MessageListResponse,
  SendMessageRequest,
  ConversationConfigResponse,
  ConversationConfigUpdate,
  ModelResponse,
  SpecSourceCreate,
  SpecSourceResponse,
  SpecSourceListResponse,
  DocumentUploadResponse,
  DocumentStatusResponse,
} from '../types/api'

let _endpoint = import.meta.env.VITE_AGENT_API_ENDPOINT || 'http://localhost:8080'
let _token = ''

export function setApiConfig(endpoint: string, token: string) {
  _endpoint = endpoint
  _token = token
}

export function setApiToken(token: string) {
  _token = token
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  skipAuth = false
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (!skipAuth && _token) {
    headers['Authorization'] = `Bearer ${_token}`
  }

  const res = await fetch(`${_endpoint}${path}`, { ...options, headers })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text || res.statusText}`)
  }

  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

export const api = {
  health() {
    return request<{ status: string }>('/v1/health', {}, true)
  },

  listConversations(page = 1, pageSize = 20) {
    return request<ConversationListResponse>(
      `/v1/conversations?page=${page}&page_size=${pageSize}`
    )
  },

  createConversation(data: ConversationCreate) {
    return request<ConversationResponse>('/v1/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  deleteConversation(id: string) {
    return request<void>(`/v1/conversations/${id}`, { method: 'DELETE' })
  },

  listMessages(conversationId: string, limit = 50, before?: string) {
    const params = new URLSearchParams({ limit: String(limit) })
    if (before) params.set('before', before)
    return request<MessageListResponse>(
      `/v1/conversations/${conversationId}/messages?${params}`
    )
  },

  sendMessage(conversationId: string, data: SendMessageRequest) {
    return request<MessageResponse>(
      `/v1/conversations/${conversationId}/messages?stream=false`,
      { method: 'POST', body: JSON.stringify(data) }
    )
  },

  clearMessages(conversationId: string) {
    return request<void>(`/v1/conversations/${conversationId}/messages`, {
      method: 'DELETE',
    })
  },

  getConfig(conversationId: string) {
    return request<ConversationConfigResponse>(
      `/v1/conversations/${conversationId}/config`
    )
  },

  updateConfig(conversationId: string, data: ConversationConfigUpdate) {
    return request<ConversationConfigResponse>(
      `/v1/conversations/${conversationId}/config`,
      { method: 'PATCH', body: JSON.stringify(data) }
    )
  },

  listModels() {
    return request<ModelResponse[]>('/v1/models')
  },

  listSpecSources() {
    return request<SpecSourceListResponse>('/v1/spec-sources')
  },

  getSpecSource(id: string) {
    return request<SpecSourceResponse>(`/v1/spec-sources/${id}`)
  },

  createSpecSource(data: SpecSourceCreate) {
    return request<SpecSourceResponse>('/v1/spec-sources', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  deleteSpecSource(id: string) {
    return request<void>(`/v1/spec-sources/${id}`, { method: 'DELETE' })
  },

  refreshSpecSource(id: string) {
    return request<void>(`/v1/spec-sources/${id}/refresh`, { method: 'POST' })
  },

  getDocumentStatus(object_key: string) {
    return request<DocumentStatusResponse>(`/v1/documents/status?object_key=${encodeURIComponent(object_key)}`)
  },

  async *pollDocumentStatus(
    object_key: string,
    interval = 5000
  ): AsyncGenerator<DocumentStatusResponse, void, unknown> {
    while (true) {
      const response = await api.getDocumentStatus(object_key)
      yield response
      if (response.status === 'READY' || response.status === 'ERROR') break
      await new Promise((resolve) => setTimeout(resolve, interval))
    }
  },

  getUploadUrl(file_name: string, file_type: string) {
    return request<DocumentUploadResponse>(
      `/v1/documents/upload-url`,
      { 
        method: 'POST', 
        body: JSON.stringify({ file_name, file_type }),
      }
    )
  },

  async *streamMessage(
    conversationId: string,
    content: string
  ): AsyncGenerator<string, MessageResponse | null, unknown> {
    const res = await fetch(
      `${_endpoint}/v1/conversations/${conversationId}/messages?stream=true`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${_token}`,
        },
        body: JSON.stringify({ content }),
      }
    )

    if (!res.ok || !res.body) {
      throw new Error(`Stream failed: ${res.status}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let finalMessage: MessageResponse | null = null

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') {
              return finalMessage
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.content !== undefined) {
                yield parsed.content
              } else if (parsed.id) {
                finalMessage = parsed as MessageResponse
              }
            } catch {
              // raw text chunk
              yield data
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    return finalMessage
  },
}
