<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '../src/composables/useApi'
import type {
  SpecSourceResponse,
  SpecAuth,
  SpecAuthType,
  SpecSourceCreate,
} from '../src/types/api'

const sources = ref<SpecSourceResponse[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const formError = ref<string | null>(null)
const showForm = ref(false)

interface StaticHeader {
  key: string
  value: string
}

const form = reactive({
  id: '',
  url: '',
  description: '',
  authType: 'none' as SpecAuthType,
  // passthrough_jwt
  headerName: '',
  // bearer_env
  bearerEnv: '',
  // api_key_env
  apiKeyEnv: '',
  apiKeyHeader: '',
  // basic_env
  usernameEnv: '',
  passwordEnv: '',
  // static
  staticHeaders: [{ key: '', value: '' }] as StaticHeader[],
})

const ID_PATTERN = /^[a-z][a-z0-9_]{0,31}$/

const idValid = computed(() => !form.id || ID_PATTERN.test(form.id))

async function load() {
  isLoading.value = true
  error.value = null
  try {
    const res = await api.listSpecSources()
    sources.value = res.items
  } catch (e: any) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

function resetForm() {
  form.id = ''
  form.url = ''
  form.description = ''
  form.authType = 'none'
  form.headerName = ''
  form.bearerEnv = ''
  form.apiKeyEnv = ''
  form.apiKeyHeader = ''
  form.usernameEnv = ''
  form.passwordEnv = ''
  form.staticHeaders = [{ key: '', value: '' }]
  formError.value = null
  }

function openForm() {
  resetForm()
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  resetForm()
}

function addStaticHeader() {
  form.staticHeaders.push({ key: '', value: '' })
}

function removeStaticHeader(index: number) {
  form.staticHeaders.splice(index, 1)
  if (form.staticHeaders.length === 0) {
    form.staticHeaders.push({ key: '', value: '' })
  }
}

function buildAuth(): SpecAuth | null {
  switch (form.authType) {
    case 'none':
      return { type: 'none' }
    case 'passthrough_jwt':
      return {
        type: 'passthrough_jwt',
        header_name: form.headerName.trim() || null,
      }
    case 'bearer_env':
      if (!form.bearerEnv.trim()) {
        formError.value = 'Env var is required for bearer_env'
        return null
      }
      return { type: 'bearer_env', env_var: form.bearerEnv.trim() }
    case 'api_key_env':
      if (!form.apiKeyEnv.trim() || !form.apiKeyHeader.trim()) {
        formError.value = 'Env var and header are required for api_key_env'
        return null
      }
      return {
        type: 'api_key_env',
        env_var: form.apiKeyEnv.trim(),
        header: form.apiKeyHeader.trim(),
      }
    case 'basic_env':
      if (!form.usernameEnv.trim() || !form.passwordEnv.trim()) {
        formError.value = 'Username and password env vars are required for basic_env'
        return null
      }
      return {
        type: 'basic_env',
        username_env: form.usernameEnv.trim(),
        password_env: form.passwordEnv.trim(),
      }
    case 'static': {
      const headers: Record<string, string> = {}
      for (const h of form.staticHeaders) {
        const k = h.key.trim()
        if (!k) continue
        headers[k] = h.value
      }
      if (Object.keys(headers).length === 0) {
        formError.value = 'At least one static header is required'
        return null
      }
      return { type: 'static', headers }
    }
  }
}

async function submit() {
  formError.value = null
  if (!form.id.trim()) {
    formError.value = 'ID is required'
    return
  }
  if (!ID_PATTERN.test(form.id)) {
    formError.value = 'ID must match ^[a-z][a-z0-9_]{0,31}$'
    return
  }
  if (!form.url.trim()) {
    formError.value = 'URL is required'
    return
  }
  if (!form.description.trim()) {
    formError.value = 'Description is required'
    return
  }
  const auth = buildAuth()
  if (!auth) return

  const payload: SpecSourceCreate = {
    id: form.id.trim(),
    url: form.url.trim(),
    description: form.description.trim(),
    auth,
  }

  isSubmitting.value = true
  try {
    const created = await api.createSpecSource(payload)
    sources.value.push(created)
    closeForm()
  } catch (e: any) {
    formError.value = e.message
  } finally {
    isSubmitting.value = false
  }
}

async function remove(spec: SpecSourceResponse) {
  if (!window.confirm(`Delete spec source "${spec.id}"?`)) return
  try {
    await api.deleteSpecSource(spec.id)
    sources.value = sources.value.filter((s) => s.id !== spec.id)
  } catch (e: any) {
    error.value = e.message
  }
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function authSummary(auth: SpecAuth): string {
  switch (auth.type) {
    case 'none':
      return 'none'
    case 'passthrough_jwt':
      return `passthrough_jwt${auth.header_name ? ` (${auth.header_name})` : ''}`
    case 'bearer_env':
      return `bearer_env (${auth.env_var})`
    case 'api_key_env':
      return `api_key_env (${auth.header}: $${auth.env_var})`
    case 'basic_env':
      return `basic_env ($${auth.username_env} / $${auth.password_env})`
    case 'static':
      return `static (${Object.keys(auth.headers).length} header${Object.keys(auth.headers).length === 1 ? '' : 's'})`
  }
}
</script>

<template>
  <div class="spec-mgr">
    <div v-if="error" class="spec-mgr__error">{{ error }}</div>

    <div v-if="isLoading" class="spec-mgr__loading">Loading spec sources…</div>

    <template v-else>
      <div v-if="!sources.length" class="spec-mgr__empty">
        No OpenAPI spec sources registered yet.
      </div>

      <table v-else class="spec-mgr__table">
        <thead>
          <tr>
            <th>ID</th>
            <th>URL</th>
            <th>Description</th>
            <th>Auth</th>
            <th>Ops</th>
            <th>Last fetched</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in sources" :key="s.id">
            <td><code>{{ s.id }}</code></td>
            <td class="spec-mgr__url" :title="s.url"><a :href="s.url">{{ s.url }}</a></td>
            <td>{{ s.description }}</td>
            <td><code>{{ authSummary(s.auth) }}</code></td>
            <td>{{ s.operation_count ?? '—' }}</td>
            <td>{{ formatDate(s.last_fetched_at) }}</td>
            <td>
              <button class="secondary spec-mgr__delete" @click="remove(s)">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="spec-mgr__actions">
        <button v-if="!showForm" @click="openForm">+ Add spec source</button>
      </div>

      <div v-if="showForm" class="spec-mgr__form">
        <h3>Register a new spec source</h3>

        <div class="spec-mgr__field">
          <label for="spec-id">ID</label>
          <input
            id="spec-id"
            v-model="form.id"
            placeholder="billing"
            :class="{ 'spec-mgr__input--invalid': !idValid }"
          />
          <small v-if="!idValid" class="spec-mgr__validation">
            Must match <code>^[a-z][a-z0-9_]{0,31}$</code>
          </small>
        </div>

        <div class="spec-mgr__field">
          <label for="spec-url">URL</label>
          <input
            id="spec-url"
            v-model="form.url"
            placeholder="https://billing.internal/openapi.json"
          />
        </div>

        <div class="spec-mgr__field">
          <label for="spec-description">Description</label>
          <textarea
            id="spec-description"
            v-model="form.description"
            rows="2"
            placeholder="Invoices, refunds, subscriptions, payment methods."
          />
        </div>

        <div class="spec-mgr__field">
          <label for="spec-auth-type">Auth type</label>
          <select id="spec-auth-type" v-model="form.authType" class="spec-mgr__select">
            <option value="none">None</option>
            <option value="passthrough_jwt">Passthrough JWT</option>
            <option value="bearer_env">Bearer token (env)</option>
            <option value="api_key_env">API key (env)</option>
            <option value="basic_env">Basic auth (env)</option>
            <option value="static">Static headers</option>
          </select>
        </div>

        <div v-if="form.authType === 'passthrough_jwt'" class="spec-mgr__field">
          <label for="spec-header-name">Header name (optional)</label>
          <input id="spec-header-name" v-model="form.headerName" placeholder="Authorization" />
        </div>

        <div v-if="form.authType === 'bearer_env'" class="spec-mgr__field">
          <label for="spec-bearer-env">Env var</label>
          <input id="spec-bearer-env" v-model="form.bearerEnv" placeholder="BILLING_API_TOKEN" />
        </div>

        <template v-if="form.authType === 'api_key_env'">
          <div class="spec-mgr__field">
            <label for="spec-apikey-env">Env var</label>
            <input id="spec-apikey-env" v-model="form.apiKeyEnv" placeholder="INVENTORY_API_KEY" />
          </div>
          <div class="spec-mgr__field">
            <label for="spec-apikey-header">Header</label>
            <input id="spec-apikey-header" v-model="form.apiKeyHeader" placeholder="X-API-Key" />
          </div>
        </template>

        <template v-if="form.authType === 'basic_env'">
          <div class="spec-mgr__field">
            <label for="spec-username-env">Username env var</label>
            <input id="spec-username-env" v-model="form.usernameEnv" placeholder="SERVICE_USER" />
          </div>
          <div class="spec-mgr__field">
            <label for="spec-password-env">Password env var</label>
            <input id="spec-password-env" v-model="form.passwordEnv" placeholder="SERVICE_PASS" />
          </div>
        </template>

        <div v-if="form.authType === 'static'" class="spec-mgr__field">
          <label>Static headers</label>
          <div
            v-for="(h, i) in form.staticHeaders"
            :key="i"
            class="spec-mgr__header-row"
          >
            <input v-model="h.key" placeholder="Header name" />
            <input v-model="h.value" placeholder="Header value" />
            <button
              type="button"
              class="secondary spec-mgr__header-remove"
              @click="removeStaticHeader(i)"
            >×</button>
          </div>
          <button type="button" class="secondary spec-mgr__add-header" @click="addStaticHeader">
            + Add header
          </button>
        </div>

        <div v-if="formError" class="spec-mgr__error">{{ formError }}</div>

        <div class="spec-mgr__form-actions">
          <button class="secondary" @click="closeForm">Cancel</button>
          <button :disabled="isSubmitting" @click="submit">
            {{ isSubmitting ? 'Saving…' : 'Register spec' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.spec-mgr {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.spec-mgr__error {
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
}

.spec-mgr__loading,
.spec-mgr__empty {
  color: #6b7280;
  font-size: 13px;
}

.spec-mgr__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.spec-mgr__table th,
.spec-mgr__table td {
  text-align: left;
  padding: 8px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}

.spec-mgr__table th {
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
  font-size: 12px;
}

.spec-mgr__url {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spec-mgr__delete {
  padding: 4px 10px;
  font-size: 12px;
}

.spec-mgr__actions {
  display: flex;
  justify-content: flex-start;
}

.spec-mgr__form {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.spec-mgr__form h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.spec-mgr__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.spec-mgr__select {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
  background: #fff;
}

.spec-mgr__input--invalid {
  border-color: #ef4444 !important;
}

.spec-mgr__validation {
  font-size: 12px;
  color: #ef4444;
}

.spec-mgr__header-row {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}

.spec-mgr__header-row input {
  flex: 1;
}

.spec-mgr__header-remove {
  padding: 4px 10px;
}

.spec-mgr__add-header {
  align-self: flex-start;
  padding: 4px 10px;
  font-size: 12px;
}

.spec-mgr__form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
