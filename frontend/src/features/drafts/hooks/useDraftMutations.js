import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDraft, updateDraft, deleteDraft, draftKeys } from '../services/draft.api';

// Snapshots every cached list query (all page/limit/search variants) so it can be restored on rollback.
function snapshotLists(queryClient) {
  return queryClient.getQueriesData({ queryKey: draftKeys.lists() });
}

function restoreLists(queryClient, previousLists) {
  previousLists?.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
}

export function useCreateDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDraft,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: draftKeys.lists() });
      const previousLists = snapshotLists(queryClient);

      const optimisticDraft = {
        id: `optimistic-${Date.now()}`,
        title: payload.title,
        content: payload.content,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __optimistic: true,
      };

      // Only splice the optimistic row into cached list data — pagination meta
      // (total/totalPages) stays server-owned and is corrected by the invalidate below.
      queryClient.setQueriesData({ queryKey: draftKeys.lists() }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: [optimisticDraft, ...(old.data || [])],
        };
      });

      return { previousLists };
    },
    onError: (_err, _payload, context) => {
      restoreLists(queryClient, context?.previousLists);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: draftKeys.lists() });
    },
  });
}

export function useUpdateDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDraft,
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: draftKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: draftKeys.lists() });

      const previousDetail = queryClient.getQueryData(draftKeys.detail(id));
      const previousLists = snapshotLists(queryClient);

      queryClient.setQueryData(draftKeys.detail(id), (old) =>
        old ? { ...old, data: { ...old.data, ...data } } : old
      );

      queryClient.setQueriesData({ queryKey: draftKeys.lists() }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: (old.data || []).map((draft) =>
            draft.id === id ? { ...draft, ...data } : draft
          ),
        };
      });

      return { previousDetail, previousLists };
    },
    // Covers both regular failures and 409 conflicts: restore pre-mutation cache
    // so the optimistic edit never lingers as if it had been saved.
    onError: (_err, variables, context) => {
      if (context?.previousDetail !== undefined) {
        queryClient.setQueryData(draftKeys.detail(variables.id), context.previousDetail);
      }
      restoreLists(queryClient, context?.previousLists);
    },
    // Always refetch the authoritative record — on success to pick up the new
    // version/updatedAt, on conflict to pull the latest server state for the user to see.
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: draftKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: draftKeys.lists() });
    },
  });
}

export function useDeleteDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDraft,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: draftKeys.lists() });
      const previousLists = snapshotLists(queryClient);

      // Remove row from cached list data only — meta stays server-owned,
      // corrected by the invalidate below.
      queryClient.setQueriesData({ queryKey: draftKeys.lists() }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: (old.data || []).filter((draft) => draft.id !== id),
        };
      });

      return { previousLists };
    },
    onError: (_err, _id, context) => {
      restoreLists(queryClient, context?.previousLists);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: draftKeys.lists() });
    },
  });
}