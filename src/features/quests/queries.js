import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../../lib/useApiClient';
import { newIdempotencyKey } from '../../lib/api';

export function useMe() {
  const api = useApiClient();
  return useQuery({ queryKey: ['me'], queryFn: ({ signal }) => api.getMe(signal) });
}

export function useUpdateMe() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch) => api.updateMe(patch),
    onSuccess: (data) => queryClient.setQueryData(['me'], data),
  });
}

export function useActiveQuests() {
  const api = useApiClient();
  return useQuery({ queryKey: ['quests', 'active'], queryFn: ({ signal }) => api.getActiveQuests(signal) });
}

export function useQuestHistory() {
  const api = useApiClient();
  return useQuery({ queryKey: ['quests', 'history'], queryFn: ({ signal }) => api.getQuestHistory(signal) });
}

export function useCollectibles() {
  const api = useApiClient();
  return useQuery({ queryKey: ['collectibles'], queryFn: ({ signal }) => api.getCollectibles(signal) });
}

export function useQuestDefinitions(filters = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['quests', 'definitions', filters],
    queryFn: ({ signal }) => api.getDefinitions(filters, signal),
  });
}

function useInvalidateQuestState() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['quests'] });
    queryClient.invalidateQueries({ queryKey: ['me'] });
    queryClient.invalidateQueries({ queryKey: ['collectibles'] });
  };
}

export function useGenerateDaily() {
  const api = useApiClient();
  const invalidate = useInvalidateQuestState();
  return useMutation({
    mutationFn: () => api.generateDaily(newIdempotencyKey()),
    onSuccess: invalidate,
  });
}

export function useGenerateWeekly() {
  const api = useApiClient();
  const invalidate = useInvalidateQuestState();
  return useMutation({
    mutationFn: () => api.generateWeekly(newIdempotencyKey()),
    onSuccess: invalidate,
  });
}

export function usePostProgress() {
  const api = useApiClient();
  const invalidate = useInvalidateQuestState();
  return useMutation({
    mutationFn: ({ assignmentId, value }) => api.postProgress(assignmentId, value, newIdempotencyKey()),
    onSuccess: invalidate,
  });
}

export function useSubmitProof() {
  const api = useApiClient();
  const invalidate = useInvalidateQuestState();
  return useMutation({
    mutationFn: ({ assignmentId, payload }) => api.submitProof(assignmentId, payload, newIdempotencyKey()),
    onSuccess: invalidate,
  });
}
