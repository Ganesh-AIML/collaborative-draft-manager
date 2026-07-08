import { useQuery } from '@tanstack/react-query';
import { getDraft, draftKeys } from '../services/draft.api';

// Single-draft query — keyed by id, disabled in create mode (no id yet).
export function useDraft(id) {
  return useQuery({
    queryKey: draftKeys.detail(id),
    queryFn: () => getDraft(id),
    enabled: Boolean(id),
  });
}