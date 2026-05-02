export interface ConversationCreate {
  title?: string
  system_prompt?: string | null
  provider?: string | null
  model?: string | null
}

export interface ConversationResponse {
  id: string
  user_id: string
  title: string
  system_prompt: string | null
  provider: string
  model: string
  first_message: MessageResponse | null;
  enabled_tools: string[]
  created_at: string
  updated_at: string
}

export interface ConversationListResponse {
  items: ConversationResponse[]
  total: number
  page: number
  page_size: number
}

export interface SendMessageRequest {
  content: string
}

export interface MessageResponse {
  id: string
  conversation_id: string
  role: string
  content: string | null
  tool_calls: ToolCall[] | null
  tool_call_id: string | null
  model_used: string | null
  token_count: number | null
  created_at: string
}

export interface ToolCall {
  id?: string
  type?: string
  function?: {
    name: string
    arguments?: string
  }
}

export interface MessageListResponse {
  items: MessageResponse[]
  has_more: boolean
  next_cursor: string | null
}

export interface ConversationConfigResponse {
  conversation_id: string
  system_prompt: string | null
  provider: string
  model: string
  max_history_messages: number | null
  enabled_tools: string[]
}

export interface ConversationConfigUpdate {
  system_prompt?: string | null
  provider?: string | null
  model?: string | null
  max_history_messages?: number | null
  enabled_tools?: string[] | null
}

export interface ModelResponse {
  id: string
  provider: string
  name: string
  description?: string
}

export interface WidgetConfig {
  endpoint: string
  token: string
  welcomeMessage: string
}
