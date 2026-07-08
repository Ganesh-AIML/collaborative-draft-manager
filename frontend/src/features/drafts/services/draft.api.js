import apiClient from '../../../services/apiClient';

// Centralized React Query key factory — single source of truth, no duplication.
export const draftKeys = {
  all: ['drafts'],
  lists: () => [...draftKeys.all, 'list'],
  list: (params) => [...draftKeys.lists(), params],
  details: () => [...draftKeys.all, 'detail'],
  detail: (id) => [...draftKeys.details(), id],
};

export async function getDrafts({ page, limit, search }) {
  const { data } = await apiClient.get('/drafts', {
    params: { page, limit, search: search || undefined },
  });
  return data; // { success, message, data: Draft[], meta }
}

export async function getDraft(id) {
  const { data } = await apiClient.get(`/drafts/${id}`);
  return data; // { success, message, data: Draft }
}

export async function createDraft(payload) {
  const { data } = await apiClient.post('/drafts', payload);
  return data;
}

export async function updateDraft({ id, data: payload, version }) {
  const { data } = await apiClient.put(`/drafts/${id}`, payload, {
    headers: { 'If-Match': `"${version}"` },
  });
  return data;
}

export async function deleteDraft(id) {
  const { data } = await apiClient.delete(`/drafts/${id}`);
  return data;
}