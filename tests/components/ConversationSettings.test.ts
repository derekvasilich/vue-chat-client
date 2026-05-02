import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from '@jest/globals'
import ConversationSettings from '../../src/components/ConversationSettings.vue'
import { currentConversation, currentView } from '../../src/composables/useChatStore'
import type { ConversationResponse } from '../../src/types/api'

const mockConv: ConversationResponse = {
  id: 'c1',
  user_id: 'u1',
  title: 'Test',
  system_prompt: null,
  provider: 'openai',
  model: 'gpt-4',
  enabled_tools: ['web_search'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockConfig = {
  conversation_id: 'c1',
  system_prompt: 'Be helpful',
  provider: 'openai',
  model: 'gpt-4',
  max_history_messages: 50,
  enabled_tools: ['web_search'],
}

const mockModels = [
  { id: 'gpt-4', provider: 'openai', name: 'GPT-4' },
  { id: 'gpt-3.5-turbo', provider: 'openai', name: 'GPT-3.5 Turbo' },
  { id: 'claude-3', provider: 'anthropic', name: 'Claude 3' },
]

describe('ConversationSettings', () => {
  beforeEach(() => {
    currentConversation.value = mockConv
    currentView.value = 'settings'
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockModels,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      })
  })

  it('loads and displays config', async () => {
    const wrapper = mount(ConversationSettings)
    await flushPromises()
    const textarea = wrapper.find('.ac-settings__textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Be helpful')
  })

  it('shows tool chips', async () => {
    const wrapper = mount(ConversationSettings)
    await flushPromises()
    expect(wrapper.find('.ac-settings__chip').text()).toBe('web_search')
  })

  it('cancel returns to chat view', async () => {
    const wrapper = mount(ConversationSettings)
    await flushPromises()
    await wrapper.find('.ac-btn--ghost').trigger('click')
    expect(currentView.value).toBe('chat')
  })

  it('shows validation error for out-of-range max history', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockModels })
      .mockResolvedValueOnce({ ok: true, json: async () => mockConfig })
    const wrapper = mount(ConversationSettings)
    await flushPromises()
    const input = wrapper.find('.ac-settings__input')
    await input.setValue('999')
    await wrapper.find('.ac-btn--primary').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ac-settings__validation').exists()).toBe(true)
  })
})
