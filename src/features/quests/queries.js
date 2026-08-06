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

export function useCaptures() {
  const api = useApiClient();
  return useQuery({ queryKey: ['captures'], queryFn: ({ signal }) => api.getCaptures(signal) });
}

export function useCaptureItem() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bundle) => api.createCapture(bundle, newIdempotencyKey()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['captures'] }),
  });
}

export function useRenameCapture() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ captureId, cardTitle }) => api.renameCapture(captureId, cardTitle),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['captures'] }),
  });
}

export function useFeed() {
  const api = useApiClient();
  return useQuery({ queryKey: ['feed'], queryFn: ({ signal }) => api.getFeed(signal) });
}

export function useLeaderboard() {
  const api = useApiClient();
  return useQuery({ queryKey: ['leaderboard'], queryFn: ({ signal }) => api.getLeaderboard(signal) });
}

export function useRewards() {
  const api = useApiClient();
  return useQuery({ queryKey: ['rewards'], queryFn: ({ signal }) => api.getRewards(signal) });
}

export function useClaimRewards() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.claimRewards(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['collectibles'] });
    },
  });
}

export function useNotifications() {
  const api = useApiClient();
  return useQuery({ queryKey: ['notifications'], queryFn: ({ signal }) => api.getNotifications(signal) });
}

export function useMarkNotificationRead() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId) => api.markNotificationRead(notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
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

export function useGenerateMonthly() {
  const api = useApiClient();
  const invalidate = useInvalidateQuestState();
  return useMutation({
    mutationFn: () => api.generateMonthly(newIdempotencyKey()),
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
