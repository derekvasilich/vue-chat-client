import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from '@jest/globals'
import ConversationView from '../../src/components/ConversationView.vue'
import {
  messages,
  isStreaming,
  streamingContent,
  currentConversation,
  welcomeMessage,
} from '../../src/composables/useChatStore'
import type { MessageResponse, ConversationResponse } from '../../src/types/api'

const stubs = {
  MessageBubble: { template: '<div class="stub-msg" />', props: ['message', 'isStreamingBubble'] },
  TypingIndicator: { template: '<div class="stub-typing" />' },
}

const mockConv: ConversationResponse = {
  id: 'c1',
  user_id: 'u1',
  title: 'Test',
  system_prompt: null,
  provider: 'openai',
  model: 'gpt-4',
  enabled_tools: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('ConversationView', () => {
  beforeEach(() => {
    messages.value = []
    isStreaming.value = false
    streamingContent.value = ''
    currentConversation.value = mockConv
    welcomeMessage.value = 'Hello!'
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], has_more: false, next_cursor: null }),
    })
  })

  it('shows welcome message when no messages', async () => {
    const wrapper = mount(ConversationView, { global: { stubs } })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ac-conv__empty').exists()).toBe(true)
    expect(wrapper.find('.ac-conv__welcome').text()).toBe('Hello!')
  })

  it('renders message bubbles for each message', async () => {
    const msg: MessageResponse = {
      id: '1',
      conversation_id: 'c1',
      role: 'user',
      content: 'hi',
      tool_calls: null,
      tool_call_id: null,
      model_used: null,
      token_count: null,
      created_at: new Date().toISOString(),
    }
    messages.value = [msg]
    const wrapper = mount(ConversationView, { global: { stubs } })
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.stub-msg').length).toBeGreaterThan(0)
  })

  it('shows TypingIndicator when streaming with no content yet', async () => {
    isStreaming.value = true
    streamingContent.value = ''
    const wrapper = mount(ConversationView, { global: { stubs } })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.stub-typing').exists()).toBe(true)
  })

  it('filters out tool messages', async () => {
    const toolMsg: MessageResponse = {
      id: '2',
      conversation_id: 'c1',
      role: 'tool',
      content: 'tool result',
      tool_calls: null,
      tool_call_id: 'tc1',
      model_used: null,
      token_count: null,
      created_at: new Date().toISOString(),
    }
    messages.value = [toolMsg]
    const wrapper = mount(ConversationView, { global: { stubs } })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ac-conv__empty').exists()).toBe(true)
  })
})
