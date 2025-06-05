import { z } from 'zod';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Helper function for HTTP requests
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API error: ${response.status}`);
  }
  
  return response.json() as Promise<T>;
}

// DAO Types
export const DAOSchema = z.object({
  id: z.number(),
  name: z.string(),
  chain_id: z.string(),
  description: z.string().nullable(),
  created_at: z.string(),
});

export const DAOListSchema = z.object({
  items: z.array(DAOSchema),
  total: z.number(),
  page: z.number(),
  size: z.number(),
  pages: z.number(),
});

export type DAO = z.infer<typeof DAOSchema>;
export type DAOList = z.infer<typeof DAOListSchema>;

// Metric Types
export const MetricResponseSchema = z.object({
  dao_id: z.number(),
  dao_name: z.string(),
  metrics: z.record(z.any()),
  run_timestamp: z.string().optional(),
});

export type MetricResponse = z.infer<typeof MetricResponseSchema>;

// Enhanced Metrics Types
export const EnhancedMetricsSchema = z.object({
  dao_id: z.number(),
  dao_name: z.string(),
  chain_id: z.string(),
  metrics: z.record(z.any()),
});

export type EnhancedMetrics = z.infer<typeof EnhancedMetricsSchema>;

// API Functions
export async function getDAOs(
  params: {
    name?: string;
    chain_id?: string;
    skip?: number;
    limit?: number;
  } = {}
): Promise<DAOList> {
  const queryParams = new URLSearchParams();
  
  if (params.name) queryParams.append('name', params.name);
  if (params.chain_id) queryParams.append('chain_id', params.chain_id);
  if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  const data = await fetchApi<DAOList>(`/daos${queryString}`);
  return DAOListSchema.parse(data);
}

export async function getDAO(id: number): Promise<DAO> {
  const data = await fetchApi<DAO>(`/daos/${id}`);
  return DAOSchema.parse(data);
}

export async function getDAOMetrics(
  id: number,
  params: {
    metric?: string;
    period?: string;
  } = {}
): Promise<MetricResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.metric) queryParams.append('metric', params.metric);
  if (params.period) queryParams.append('period', params.period);
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  const data = await fetchApi<MetricResponse>(`/daos/${id}/metrics${queryString}`);
  return MetricResponseSchema.parse(data);
}

export async function getEnhancedMetrics(id: number): Promise<EnhancedMetrics> {
  const data = await fetchApi<EnhancedMetrics>(`/daos/${id}/enhanced-metrics`);
  return EnhancedMetricsSchema.parse(data);
}

export async function getTokenDistribution(id: number): Promise<any> {
  return fetchApi<any>(`/daos/${id}/token-distribution`);
}

export async function pollDAOMetrics(id: number): Promise<{ task_id: string; status: string; message: string }> {
  return fetchApi<{ task_id: string; status: string; message: string }>(`/daos/${id}/poll`, {
    method: 'POST',
  });
}