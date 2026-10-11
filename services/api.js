const API = '/api'

async function request(path, options) {
  let response
  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    })
  } catch {
    throw new Error('Could not connect to EcoGen API. Make sure the Flask backend is running.')
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`)
  return body
}

export const api = {
  health: () => request('/health'),
  generate: (data) => request('/generations', { method: 'POST', body: JSON.stringify(data) }),
  history: (query = '', tier = '') => request(`/generations?q=${encodeURIComponent(query)}&tier=${tier}`),
  remove: (id) => request(`/generations/${id}`, { method: 'DELETE' }),
  analytics: () => request('/analytics'),
  settings: () => request('/settings'),
  saveSettings: (values) => request('/settings', { method: 'PUT', body: JSON.stringify(values) }),
}
