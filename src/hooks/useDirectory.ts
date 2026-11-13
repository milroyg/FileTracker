import { useQuery } from '@tanstack/react-query';
import { fetchDirectory, type DirectoryData } from '../services/directoryService';
import fallbackDirectoryJson from '../config/fallbackDirectory.json';

export const DIRECTORY_QUERY_KEY = ['employeeDirectory'] as const;

const fallbackDirectory = fallbackDirectoryJson as DirectoryData;

/**
 * Office/employee directory. Order of preference:
 * 1. fresh download,
 * 2. last successful download (persisted across launches, see App.tsx),
 * 3. the snapshot bundled with the app — only when nothing was ever downloaded.
 */
export function useDirectory() {
  const query = useQuery({
    queryKey: DIRECTORY_QUERY_KEY,
    queryFn: fetchDirectory,
    staleTime: 1000 * 60 * 60 * 6, // revalidate in the background after 6 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // keep for 7 days offline
    meta: { persist: true },
  });

  return {
    directory: query.data ?? fallbackDirectory,
    isUsingFallback: !query.data,
    isLoading: query.isLoading,
  };
}
