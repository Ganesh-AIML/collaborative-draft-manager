import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getDrafts, draftKeys } from '../services/draft.api';

// List query — page/limit/search keyed, smooth pagination via keepPreviousData.
export function useDrafts({ page, limit, search }) {
  return useQuery({
    queryKey: draftKeys.list({ page, limit, search }),
    queryFn: () => getDrafts({ page, limit, search }),
    placeholderData: keepPreviousData,
  });
}