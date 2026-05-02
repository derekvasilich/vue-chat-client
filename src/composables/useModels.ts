import { ref, computed } from 'vue'
import { api } from './useApi'
import type { ModelResponse } from '../types/api'

export function useModels() {
  const models = ref<ModelResponse[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const providers = computed(() => [...new Set(models.value.map((m) => m.provider))])

  function modelsForProvider(provider: string) {
    return models.value.filter((m) => m.provider === provider)
  }

  async function load() {
    isLoading.value = true
    error.value = null
    try {
      models.value = await api.listModels()
    } catch (e: any) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  return { models, providers, modelsForProvider, isLoading, error, load }
}
