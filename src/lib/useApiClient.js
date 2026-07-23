import { useMemo } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { createApiClient } from './api';

export function useApiClient() {
  const { getToken } = useAuth();
  return useMemo(() => createApiClient(getToken), [getToken]);
}
