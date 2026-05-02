import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from '@jest/globals'
import ChatBubble from '../../src/components/ChatBubble.vue'
import { isOpen, hasUnread } from '../../src/composables/useChatStore'

describe('ChatBubble', () => {
  beforeEach(() => {
    isOpen.value = false
    hasUnread.value = false
  })

  it('renders a button', () => {
    const wrapper = mount(ChatBubble)
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('shows no badge when hasUnread is false', () => {
    hasUnread.value = false
    const wrapper = mount(ChatBubble)
    expect(wrapper.find('.ac-bubble__badge').exists()).toBe(false)
  })

  it('shows badge when hasUnread is true', async () => {
    hasUnread.value = true
    const wrapper = mount(ChatBubble)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ac-bubble__badge').exists()).toBe(true)
  })

  it('opens widget and clears unread on click', async () => {
    hasUnread.value = true
    const wrapper = mount(ChatBubble)
    await wrapper.find('button').trigger('click')
    expect(isOpen.value).toBe(true)
    expect(hasUnread.value).toBe(false)
  })

  it('adds --open class when isOpen is true', async () => {
    isOpen.value = true
    const wrapper = mount(ChatBubble)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ac-bubble--open').exists()).toBe(true)
  })
})
