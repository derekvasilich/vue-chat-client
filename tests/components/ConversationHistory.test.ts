import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from '@jest/globals'
import ConversationHistory from '../../src/components/ConversationHistory.vue'
import { currentConversation, currentView } from '../../src/composables/useChatStore'
import type { ConversationResponse } from '../../src/types/api'

const mockConv: ConversationResponse = {
  id: 'c1',
  user_id: 'u1',
  title: 'Test Conversation',
  system_prompt: null,
  provider: 'openai',
  model: 'gpt-4',
  enabled_tools: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

function mockListResponse(items: ConversationResponse[] = [mockConv]) {
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ items, total: items.length, page: 1, page_size: 20 }),
  })
}

describe('ConversationHistory', () => {
  beforeEach(() => {
    currentConversation.value = null
    currentView.value = 'chat'
  })

  it('shows loading then renders conversations', async () => {
    mockListResponse()
    const wrapper = mount(ConversationHistory)
    await flushPromises()
    expect(wrapper.text()).toContain('Test Conversation')
  })

  it('shows empty state when no conversations', async () => {
    mockListResponse([])
    const wrapper = mount(ConversationHistory)
    await flushPromises()
    expect(wrapper.text()).toContain('No conversations found')
  })

  it('filters by search input', async () => {
    mockListResponse([
      mockConv,
      { ...mockConv, id: 'c2', title: 'Another Chat' },
    ])
    const wrapper = mount(ConversationHistory)
    await flushPromises()
    await wrapper.find('.ac-history__input').setValue('Another')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Another Chat')
    expect(wrapper.text()).not.toContain('Test Conversation')
  })

  it('shows delete confirmation on trash click', async () => {
    mockListResponse()
    const wrapper = mount(ConversationHistory)
    await flushPromises()
    await wrapper.find('.ac-history__delete').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Delete this conversation?')
  })

  it('back button returns to chat view', async () => {
    mockListResponse()
    currentView.value = 'history'
    const wrapper = mount(ConversationHistory)
    await flushPromises()
    await wrapper.find('.ac-history__footer .ac-btn').trigger('click')
    expect(currentView.value).toBe('chat')
  })
})
