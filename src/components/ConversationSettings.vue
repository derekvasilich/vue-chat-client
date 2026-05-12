<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { api } from '../composables/useApi'
import { useModels } from '../composables/useModels'
import { currentConversation, currentView } from '../composables/useChatStore'
import {
  AVAILABLE_TOOLS,
  type ConversationConfigResponse,
  type ConversationConfigUpdate,
  type SpecSourceResponse,
} from '../types/api'

const { models, providers, modelsForProvider, load: loadModels } = useModels()

const config = ref<ConversationConfigResponse | null>(null)
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)
const validationErrors = ref<Record<string, string>>({})
const specSources = ref<SpecSourceResponse[]>([])

// Form state
const systemPrompt = ref('')
const selectedProvider = ref('')
const selectedModel = ref('')
const maxHistory = ref<number | null>(null)
const enabledTools = ref<string[]>([])
const enabledSpecs = ref<string[]>([])

const availableTools = AVAILABLE_TOOLS

const filteredModels = computed(() => {
  if (!selectedProvider.value) return []
  return modelsForProvider(selectedProvider.value)
})

watch(selectedProvider, (newProvider) => {
  const available = modelsForProvider(newProvider)
  if (available.length > 0 && !available.find((m) => m.id === selectedModel.value)) {
    selectedModel.value = available[0].id
  }
})

onMounted(async () => {
  if (!currentConversation.value) return
  isLoading.value = true
  try {
    await loadModels()
    const cfg = await api.getConfig(currentConversation.value.id)
    config.value = cfg
    systemPrompt.value = cfg.system_prompt ?? ''
    selectedProvider.value = cfg.provider
    selectedModel.value = cfg.model
    maxHistory.value = cfg.max_history_messages
    enabledTools.value = [...(cfg.enabled_tools ?? [])]
    enabledSpecs.value = [...(cfg.enabled_specs ?? [])]
    try {
      const specs = await api.listSpecSources()
      specSources.value = specs.items
    } catch {
      specSources.value = []
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
})

const openapiToolEnabled = computed(() => enabledTools.value.includes('openapi_discovery'))

function validate(): boolean {
  validationErrors.value = {}
  if (maxHistory.value !== null && (maxHistory.value < 1 || maxHistory.value > 500)) {
    validationErrors.value.maxHistory = 'Must be between 1 and 500'
  }
  return Object.keys(validationErrors.value).length === 0
}

async function save() {
  if (!currentConversation.value || !validate()) return
  isSaving.value = true
  error.value = null
  try {
    const update: ConversationConfigUpdate = {
      system_prompt: systemPrompt.value || null,
      provider: selectedProvider.value || null,
      model: selectedModel.value || null,
      max_history_messages: maxHistory.value,
      enabled_tools: [...enabledTools.value],
      enabled_specs: openapiToolEnabled.value ? [...enabledSpecs.value] : [],
    }
    await api.updateConfig(currentConversation.value.id, update)
    currentView.value = 'chat'
  } catch (e: any) {
    error.value = e.message
  } finally {
    isSaving.value = false
  }
}

function cancel() {
  currentView.value = 'chat'
}
</script>

<template>
  <div class="ac-settings">
    <div v-if="isLoading" class="ac-settings__loading">Loading settings…</div>

    <template v-else>
      <div v-if="error" class="ac-settings__error">{{ error }}</div>

      <div class="ac-settings__field">
        <label class="ac-settings__label">Provider</label>
        <select v-model="selectedProvider" class="ac-settings__select">
          <option v-for="p in providers" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>

      <div class="ac-settings__field">
        <label class="ac-settings__label">Model</label>
        <select v-model="selectedModel" class="ac-settings__select">
          <option v-for="m in filteredModels" :key="m.id" :value="m.id">{{ m.name || m.id }}</option>
        </select>
      </div>

      <div class="ac-settings__field">
        <label class="ac-settings__label">System Prompt</label>
        <textarea
          v-model="systemPrompt"
          class="ac-settings__textarea"
          placeholder="Optional system instructions…"
          rows="4"
        />
      </div>

      <div class="ac-settings__field">
        <label class="ac-settings__label">Max History Messages</label>
        <input
          v-model.number="maxHistory"
          type="number"
          min="1"
          max="500"
          class="ac-settings__input"
          placeholder="Leave blank for default"
        />
        <span v-if="validationErrors.maxHistory" class="ac-settings__validation">
          {{ validationErrors.maxHistory }}
        </span>
      </div>

      <div class="ac-settings__field">
        <label class="ac-settings__label">Enabled Tools</label>
        <div class="ac-settings__checklist">
          <label v-for="tool in availableTools" :key="tool" class="ac-settings__check">
            <input
              type="checkbox"
              :value="tool"
              v-model="enabledTools"
            />
            <span>{{ tool }}</span>
          </label>
        </div>
      </div>

      <div v-if="openapiToolEnabled" class="ac-settings__field">
        <label class="ac-settings__label">Enabled Specs</label>
        <div v-if="!specSources.length" class="ac-settings__empty">
          No spec sources registered.
        </div>
        <div v-else class="ac-settings__checklist">
          <label
            v-for="spec in specSources"
            :key="spec.id"
            class="ac-settings__check"
          >
            <input
              type="checkbox"
              :value="spec.id"
              v-model="enabledSpecs"
            />
            <span>
              <strong>{{ spec.id }}</strong>
              <span v-if="spec.description" class="ac-settings__check-desc">
                — {{ spec.description }}
              </span>
            </span>
          </label>
        </div>
      </div>

      <div class="ac-settings__actions">
        <button class="ac-btn ac-btn--ghost" @click="cancel">Cancel</button>
        <button class="ac-btn ac-btn--primary" :disabled="isSaving" @click="save">
          {{ isSaving ? 'Saving…' : 'Apply' }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.ac-settings {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  gap: 14px;
  overflow-y: auto;
}

.ac-settings__loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 13px;
}

.ac-settings__error {
  background: #fee2e2;
  color: #dc2626;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
}

.ac-settings__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ac-settings__label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ac-settings__select,
.ac-settings__input {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
  background: #fff;
}

.ac-settings__select:focus,
.ac-settings__input:focus {
  border-color: var(--ac-primary, #2563eb);
}

.ac-settings__textarea {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
}

.ac-settings__textarea:focus {
  border-color: var(--ac-primary, #2563eb);
}

.ac-settings__validation {
  font-size: 12px;
  color: #ef4444;
}

.ac-settings__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ac-settings__chip {
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 12px;
}

.ac-settings__checklist {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ac-settings__check {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}

.ac-settings__check input {
  margin-top: 3px;
}

.ac-settings__check-desc {
  color: #6b7280;
  font-size: 13px;
}

.ac-settings__empty {
  font-size: 13px;
  color: #6b7280;
  font-style: italic;
}

.ac-settings__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
}

.ac-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  font-family: inherit;
  font-weight: 500;
}

.ac-btn--ghost {
  background: none;
  color: #374151;
  border: 1px solid #d1d5db;
}

.ac-btn--ghost:hover {
  background: #f3f4f6;
}

.ac-btn--primary {
  background: var(--ac-primary, #2563eb);
  color: #fff;
}

.ac-btn--primary:hover:not(:disabled) {
  background: var(--ac-primary-hover, #1d4ed8);
}

.ac-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
