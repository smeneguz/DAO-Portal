// lib/hooks/useDAOMetrics.ts
import { useQuery } from '@tanstack/react-query';

export function useDAOMetrics(id: number) {
  return useQuery({
    queryKey: ['dao', id, 'metrics'],
    queryFn: async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      console.log(`Fetching from: ${apiUrl}/daos/${id}/enhanced_metrics`);
      
      const response = await fetch(`${apiUrl}/daos/${id}/enhanced_metrics`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${await response.text()}`);
      }
      
      return response.json();
    },
    enabled: Boolean(id),
  });
}