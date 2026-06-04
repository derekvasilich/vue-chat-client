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
  enabled_specs: string[]
}

export interface ConversationConfigUpdate {
  system_prompt?: string | null
  provider?: string | null
  model?: string | null
  max_history_messages?: number | null
  enabled_tools?: string[] | null
  enabled_specs?: string[] | null
}

export const AVAILABLE_TOOLS = ['calculator', 'web_search', 'openapi_discovery', 'read_attachment_content'] as const
export type AvailableTool = (typeof AVAILABLE_TOOLS)[number]

export interface ModelResponse {
  id: string
  provider: string
  name: string
  description?: string
}

export interface AuthNone {
  type: 'none'
}

export interface AuthPassthroughJWT {
  type: 'passthrough_jwt'
  header_name?: string | null
}

export interface AuthBearerEnv {
  type: 'bearer_env'
  env_var: string
}

export interface AuthApiKeyEnv {
  type: 'api_key_env'
  env_var: string
  header: string
}

export interface AuthBasicEnv {
  type: 'basic_env'
  username_env: string
  password_env: string
}

export interface AuthStatic {
  type: 'static'
  headers: Record<string, string>
}

export type SpecAuth =
  | AuthNone
  | AuthPassthroughJWT
  | AuthBearerEnv
  | AuthApiKeyEnv
  | AuthBasicEnv
  | AuthStatic

export type SpecAuthType = SpecAuth['type']

export interface SpecSourceCreate {
  id: string
  url: string
  description: string
  auth: SpecAuth
}

export interface SpecSourceResponse {
  id: string
  url: string
  description: string
  auth: SpecAuth
  cache_etag?: string | null
  last_fetched_at?: string | null
  operation_count?: number | null
  created_at: string
  updated_at: string
}

export interface SpecSourceListResponse {
  items: SpecSourceResponse[]
}

export interface WidgetConfig {
  endpoint: string
  token: string
  welcomeMessage: string
}

export interface DocumentUploadResponse { 
  upload_url: string; 
  object_key: string;
}
export interface DocumentStatusResponse { 
  object_key: string;
  user_id: string;
  status: 'PENDING' | 'PROCESSING' | 'ERROR' | 'READY'; 
  etag: string;
  extracted_data?: string;
  metadata?: Record<string, unknown>;
  last_fetched_at?: string;
  created_at: string;
  updated_at: string;
}