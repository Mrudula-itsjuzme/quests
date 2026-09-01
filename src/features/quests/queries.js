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

export function useSpecies() {
  const api = useApiClient();
  return useQuery({ queryKey: ['species'], queryFn: ({ signal }) => api.getSpecies(signal), staleTime: 60 * 60 * 1000 });
}

export function useCaptureItem() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bundle) => api.createCapture(bundle, newIdempotencyKey()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['captures'] }),
  });
}

export function useAddCardToLibrary() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (captureId) => api.addCardToLibrary(captureId, newIdempotencyKey()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['captures'] }),
  });
}

export function useRenameCapture() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ captureId, cardTitle, notes }) => api.renameCapture(captureId, { cardTitle, notes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['captures'] }),
  });
}

export function useWorldHotspots(filters = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['world', 'hotspots', filters],
    queryFn: ({ signal }) => api.getWorldHotspots(filters, signal),
    // Curated content changes rarely; no need to refetch on every visit.
    staleTime: 60 * 60 * 1000,
  });
}

export function useCommunityPosts(scope = 'public') {
  const api = useApiClient();
  return useQuery({
    queryKey: ['community', 'posts', scope],
    queryFn: ({ signal }) => api.getCommunityPosts(scope, signal),
  });
}

export function useFriends() {
  const api = useApiClient();
  return useQuery({ queryKey: ['community', 'friends'], queryFn: ({ signal }) => api.getFriends(signal) });
}

export function useCommunityComments(postId) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['community', 'comments', postId],
    queryFn: ({ signal }) => api.getCommunityComments(postId, signal),
    enabled: Boolean(postId),
  });
}

export function useShareDiscovery() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.createCommunityPost(payload, newIdempotencyKey()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community', 'posts'] }),
  });
}

export function useToggleCommunityLike() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, liked }) => api.setCommunityPostLike(postId, liked),
    // The server returns the updated post, so patch it into every cached scope
    // rather than refetching the whole feed on each tap.
    onSuccess: (post) => {
      queryClient.setQueriesData({ queryKey: ['community', 'posts'] }, (previous) =>
        Array.isArray(previous) ? previous.map((item) => (item.id === post.id ? post : item)) : previous);
    },
  });
}

export function useAddCommunityComment() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, body }) => api.createCommunityComment(postId, body),
    onSuccess: (_comment, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
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
