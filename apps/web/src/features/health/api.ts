import type { HealthStatus } from '@quiz-nest/shared';
import { apiClient } from '@/lib/api-client';

export const getHealth = () => apiClient.get<HealthStatus>('/health');
