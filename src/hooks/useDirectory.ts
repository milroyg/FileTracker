import { useQuery } from '@tanstack/react-query';
import { fetchAndIndexDirectory, DirectoryData } from '../services/directoryService';

export const DIRECTORY_QUERY_KEY = ['employeeDirectory'];

export function useDirectory() {
  return useQuery<DirectoryData>({
    queryKey: DIRECTORY_QUERY_KEY,
    queryFn: fetchAndIndexDirectory,
    staleTime: 1000 * 60 * 60 * 6, // 6 hours cache before background revalidation
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days offline retention
    refetchOnReconnect: true,
  });
}
