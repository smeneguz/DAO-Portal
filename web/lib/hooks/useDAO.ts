// web/lib/hooks/useDAO.ts
import { useQuery } from '@tanstack/react-query';

export function useDAO(id: number) {
  return useQuery({
    queryKey: ['dao', id],
    queryFn: async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        console.log(`Fetching from: ${apiUrl}/daos/${id}`);
        
        const response = await fetch(`${apiUrl}/daos/${id}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API Error (${response.status}): ${errorText}`);
          throw new Error(`API returned ${response.status}: ${errorText}`);
        }
        
        return response.json();
      } catch (error) {
        console.error("Error fetching DAO:", error);
        throw error;
      }
    },
    enabled: Boolean(id),
    retry: 1, // Only retry once to avoid flooding with requests
  });
}