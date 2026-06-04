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
  first_message: null,
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
  enabled_specs: [],
}

const mockModels = [
  { id: 'gpt-4', provider: 'openai', name: 'GPT-4' },
  { id: 'gpt-3.5-turbo', provider: 'openai', name: 'GPT-3.5 Turbo' },
  { id: 'claude-3', provider: 'anthropic', name: 'Claude 3' },
]

const mockSpecs = {
  items: [
    {
      id: 'petstore',
      url: 'https://example.com/petstore.json',
      description: 'Pets',
      auth: { type: 'none' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'weather',
      url: 'https://example.com/weather.json',
      description: 'Weather',
      auth: { type: 'none' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
}

function queueDefaultFetches() {
  ;(global.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => mockModels })
    .mockResolvedValueOnce({ ok: true, json: async () => mockConfig })
    .mockResolvedValueOnce({ ok: true, json: async () => mockSpecs })
}

describe('ConversationSettings', () => {
  beforeEach(() => {
    currentConversation.value = mockConv
    currentView.value = 'settings'
    queueDefaultFetches()
  })

  it('loads and displays config', async () => {
    const wrapper = mount(ConversationSettings)
    await flushPromises()
    const textarea = wrapper.find('.ac-settings__textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Be helpful')
  })

  it('renders tool checkboxes pre-selected from config', async () => {
    const wrapper = mount(ConversationSettings)
    await flushPromises()
    const checks = wrapper.findAll('.ac-settings__check input[type="checkbox"]')
    const checked = checks
      .filter((c) => (c.element as HTMLInputElement).checked)
      .map((c) => (c.element as HTMLInputElement).value)
    expect(checked).toContain('web_search')
  })

  it('shows spec list only when openapi_discovery is enabled', async () => {
    const wrapper = mount(ConversationSettings)
    await flushPromises()
    // openapi_discovery not enabled in mockConfig, so specs are hidden
    expect(wrapper.html()).not.toContain('Enabled Specs')

    const toolBoxes = wrapper.findAll('.ac-settings__check input[type="checkbox"]')
    const openapiBox = toolBoxes.find(
      (b) => (b.element as HTMLInputElement).value === 'openapi_discovery'
    )!
    await openapiBox.setValue(true)
    expect(wrapper.html()).toContain('Enabled Specs')
    expect(wrapper.html()).toContain('petstore')
    expect(wrapper.html()).toContain('weather')
  })

  it('sends enabled_tools and enabled_specs on save', async () => {
    const wrapper = mount(ConversationSettings)
    await flushPromises()

    const toolBoxes = wrapper.findAll('.ac-settings__check input[type="checkbox"]')
    const openapiBox = toolBoxes.find(
      (b) => (b.element as HTMLInputElement).value === 'openapi_discovery'
    )!
    await openapiBox.setValue(true)

    const specBoxes = wrapper.findAll('.ac-settings__check input[type="checkbox"]')
    const petstoreBox = specBoxes.find(
      (b) => (b.element as HTMLInputElement).value === 'petstore'
    )!
    await petstoreBox.setValue(true)

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfig,
    })

    await wrapper.find('.ac-btn--primary').trigger('click')
    await flushPromises()

    const patchCall = (global.fetch as jest.Mock).mock.calls.find(
      ([, opts]) => opts?.method === 'PATCH'
    )
    expect(patchCall).toBeDefined()
    const body = JSON.parse(patchCall![1].body)
    expect(body.enabled_tools).toEqual(expect.arrayContaining(['web_search', 'openapi_discovery']))
    expect(body.enabled_specs).toEqual(['petstore'])
  })

  it('cancel returns to chat view', async () => {
    const wrapper = mount(ConversationSettings)
    await flushPromises()
    await wrapper.find('.ac-btn--ghost').trigger('click')
    expect(currentView.value).toBe('chat')
  })

  it('shows validation error for out-of-range max history', async () => {
    const wrapper = mount(ConversationSettings)
    await flushPromises()
    const input = wrapper.find('.ac-settings__input')
    await input.setValue('999')
    await wrapper.find('.ac-btn--primary').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ac-settings__validation').exists()).toBe(true)
  })
})
