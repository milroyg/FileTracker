import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileTrackerApi } from '../api/fileTrackerApi';
import { OutboxService } from '../services/outboxService';
import { classifySearchQuery, type SearchMode } from '../utils/queryClassifier';
import { logger } from '../utils/logger';

export const searchQueryKey = (mode: SearchMode, term: string) =>
  ['search', mode, term.toLowerCase()] as const;

/**
 * Searches by file code or subject text (picked automatically from the term).
 * React Query de-duplicates identical in-flight requests and caches results
 * briefly, so double-taps/IME submits can't fire the same request twice.
 */
export function useFileSearch(term: string | null) {
  const trimmed = term?.trim() ?? '';
  const mode = classifySearchQuery(trimmed);

  const codeQuery = useQuery({
    queryKey: searchQueryKey('CODE', trimmed),
    queryFn: () => FileTrackerApi.searchByCode(trimmed),
    enabled: trimmed.length > 0 && mode === 'CODE',
  });

  const fileQuery = useQuery({
    queryKey: searchQueryKey('FILENAME', trimmed),
    queryFn: () => FileTrackerApi.searchByFileName(trimmed),
    enabled: trimmed.length > 0 && mode === 'FILENAME',
  });

  const active = mode === 'CODE' ? codeQuery : fileQuery;
  return {
    mode,
    movements: codeQuery.data ?? [],
    files: fileQuery.data ?? [],
    isLoading: active.isFetching,
    isSuccess: active.isSuccess,
    error: active.error,
    refetch: active.refetch,
  };
}

export function useMarkFileMutation() {
  return useMutation({
    mutationFn: (vars: { code: string; username: string; employee: string }) =>
      FileTrackerApi.markFileToEmployee(vars.code, vars.username, vars.employee),
  });
}

export function useRegisterFileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { code: string; filename: string }) =>
      FileTrackerApi.registerNewFile(vars.code, vars.filename),
    onSuccess: async (_data, { code }) => {
      queryClient.invalidateQueries({ queryKey: ['search'] });
      // Movements queued offline for this code were waiting on registration.
      try {
        await OutboxService.releaseRegistered(code);
        void OutboxService.sync();
      } catch (error) {
        logger.warn('[useRegisterFileMutation] Could not release queued movements:', error);
      }
    },
  });
}
