import type { QueryClient, QueryKey } from '@tanstack/react-query';
/**
 * The optimistic-update recipe every mutation in the app uses: patch the cache
 * before the request goes out, put it back if the request fails, and refetch
 * once it settles so the server's answer wins.
 */

export interface CachePatch<TVariables> {
  queryKey: QueryKey;
  update: (old: unknown, variables: TVariables) => unknown;
}

export interface OptimisticContext {
  snapshots: Array<[QueryKey, unknown]>;
}

/** A patch for every cached query under `queryKey`. Queries that never loaded are left alone. */
export function patch<TData, TVariables>(
  queryKey: QueryKey,
  update: (old: TData, variables: TVariables) => TData,
): CachePatch<TVariables> {
  return {
    queryKey,
    update: (old, variables) => (old === undefined ? old : update(old as TData, variables)),
  };
}

export function optimistic<TVariables>(queryClient: QueryClient, patches: CachePatch<TVariables>[]) {
  return {
    onMutate: async (variables: TVariables): Promise<OptimisticContext> => {
      // A refetch landing after the patch would overwrite it with stale data.
      await Promise.all(patches.map(({ queryKey }) => queryClient.cancelQueries({ queryKey })));
      const snapshots: Array<[QueryKey, unknown]> = [];
      for (const { queryKey, update } of patches) {
        for (const [key, data] of queryClient.getQueriesData({ queryKey })) {
          snapshots.push([key, data]);
          queryClient.setQueryData(key, update(data, variables));
        }
      }
      return { snapshots };
    },
    onError: (_error: unknown, _variables: TVariables, context: OptimisticContext | undefined) => {
      // Reverse order, so overlapping patches unwind to the original data.
      for (const [key, data] of [...(context?.snapshots ?? [])].reverse()) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: () => Promise.all(patches.map(({ queryKey }) => queryClient.invalidateQueries({ queryKey }))),
  };
}
