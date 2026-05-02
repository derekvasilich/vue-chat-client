import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from '@jest/globals'
import MessageBubble from '../../src/components/MessageBubble.vue'
import { isStreaming, streamingContent } from '../../src/composables/useChatStore'
import type { MessageResponse } from '../../src/types/api'

const userMessage: MessageResponse = {
  id: '1',
  conversation_id: 'c1',
  role: 'user',
  content: 'Hello world',
  tool_calls: null,
  tool_call_id: null,
  model_used: null,
  token_count: null,
  created_at: new Date().toISOString(),
}

const assistantMessage: MessageResponse = {
  ...userMessage,
  id: '2',
  role: 'assistant',
  content: '**Bold** response',
  token_count: 42,
}

const toolMessage: MessageResponse = {
  ...userMessage,
  id: '3',
  role: 'user',
  content: 'Result',
  tool_calls: [{ function: { name: 'search_web' } }],
}

describe('MessageBubble', () => {
  beforeEach(() => {
    isStreaming.value = false
    streamingContent.value = ''
  })

  it('renders user message right-aligned', () => {
    const wrapper = mount(MessageBubble, { props: { message: userMessage } })
    expect(wrapper.find('.ac-message--user').exists()).toBe(true)
    expect(wrapper.find('.ac-message__content').text()).toBe('Hello world')
  })

  it('renders assistant message with markdown', () => {
    const wrapper = mount(MessageBubble, { props: { message: assistantMessage } })
    expect(wrapper.find('.ac-message--assistant').exists()).toBe(true)
    expect(wrapper.find('.ac-message__content--md').html()).toContain('<strong>')
  })

  it('shows token count badge for assistant message', () => {
    const wrapper = mount(MessageBubble, { props: { message: assistantMessage } })
    expect(wrapper.text()).toContain('42 tok')
  })

  it('shows tool chip when tool_calls present', () => {
    const wrapper = mount(MessageBubble, { props: { message: toolMessage } })
    expect(wrapper.find('.ac-message__tool-chip').text()).toContain('search_web')
  })

  it('shows streaming cursor when isStreamingBubble and isStreaming', async () => {
    isStreaming.value = true
    streamingContent.value = 'Hello'
    const wrapper = mount(MessageBubble, {
      props: { message: assistantMessage, isStreamingBubble: true },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ac-message__cursor').exists()).toBe(true)
  })
})
