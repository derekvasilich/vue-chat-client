import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from '@jest/globals'
import ChatDialog from '../../src/components/ChatDialog.vue'
import { isOpen, currentView } from '../../src/composables/useChatStore'

// Stub child components
const stubs = {
  ConversationView: { template: '<div class="stub-conv-view" />' },
  ConversationHistory: { template: '<div class="stub-conv-history" />' },
  ConversationSettings: { template: '<div class="stub-conv-settings" />' },
}

describe('ChatDialog', () => {
  beforeEach(() => {
    isOpen.value = false
    currentView.value = 'chat'
  })

  it('is not rendered when closed', () => {
    const wrapper = mount(ChatDialog, { global: { stubs } })
    expect(wrapper.find('.ac-dialog').exists()).toBe(false)
  })

  it('renders when open', async () => {
    isOpen.value = true
    const wrapper = mount(ChatDialog, { global: { stubs } })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ac-dialog').exists()).toBe(true)
  })

  it('shows ConversationView by default', async () => {
    isOpen.value = true
    currentView.value = 'chat'
    const wrapper = mount(ChatDialog, { global: { stubs } })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.stub-conv-view').exists()).toBe(true)
  })

  it('shows ConversationHistory when currentView is history', async () => {
    isOpen.value = true
    currentView.value = 'history'
    const wrapper = mount(ChatDialog, { global: { stubs } })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.stub-conv-history').exists()).toBe(true)
  })

  it('closes on X button click', async () => {
    isOpen.value = true
    const wrapper = mount(ChatDialog, { global: { stubs } })
    await wrapper.vm.$nextTick()
    await wrapper.find('.ac-dialog__close').trigger('click')
    expect(isOpen.value).toBe(false)
  })

  it('closes on Escape keydown', async () => {
    isOpen.value = true
    const wrapper = mount(ChatDialog, { global: { stubs } })
    await wrapper.vm.$nextTick()
    await wrapper.find('.ac-dialog').trigger('keydown', { key: 'Escape' })
    expect(isOpen.value).toBe(false)
  })
})
