// Derives up to 3 prioritized "what should I do right now" actions from real
// application state only. No fabricated counts or placeholder copy.

function questAction(quest) {
  const remaining = Math.max(0, (quest.targetValue || 0) - (quest.progressValue || 0));
  return {
    id: `quest:${quest.id}`,
    kind: 'quest',
    title: quest.title,
    detail: remaining > 0 ? `${remaining} ${quest.unit || 'more'} to go` : 'Ready to submit',
    xp: quest.xpReward,
    priority: quest.status === 'pending_verification' ? 0 : 1,
    to: '/app/quests',
    questId: quest.id,
  };
}

export function nextBestAction({ activeQuests = [], notifications = [], streakDays = 0 } = {}) {
  const actions = [];

  const unread = notifications.filter((n) => !n.readAt);
  const readyQuestNotice = unread.find((n) => n.kind === 'quests_ready');
  if (readyQuestNotice) {
    actions.push({
      id: `notification:${readyQuestNotice.id}`,
      kind: 'notification',
      title: 'New quests are ready',
      detail: 'Your board has been refreshed.',
      priority: 0,
      to: '/app/quests',
    });
  }

  const pendingReview = activeQuests.filter((q) => q.status === 'pending_verification');
  const inProgress = activeQuests
    .filter((q) => q.status === 'active')
    .sort((a, b) => questProgressRatio(b) - questProgressRatio(a));
  const almostDone = inProgress.filter((q) => questProgressRatio(q) >= 0.5);

  for (const quest of pendingReview.slice(0, 1)) actions.push(questAction(quest));
  for (const quest of almostDone.slice(0, 2)) actions.push(questAction(quest));

  if (actions.length < 3 && inProgress.length > 0) {
    const remaining = inProgress.filter((q) => !almostDone.includes(q));
    for (const quest of remaining.slice(0, 3 - actions.length)) actions.push(questAction(quest));
  }

  if (actions.length === 0 && activeQuests.length === 0) {
    actions.push({
      id: 'action:no-quests',
      kind: 'empty',
      title: 'No active quests',
      detail: 'Visit the quest board to start your next one.',
      priority: 2,
      to: '/app/quests',
    });
  }

  if (streakDays > 0 && actions.length < 3) {
    actions.push({
      id: 'action:streak',
      kind: 'streak',
      title: `${streakDays}-day streak`,
      detail: 'Complete a quest today to keep it going.',
      priority: 3,
      to: '/app/quests',
    });
  }

  return actions
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);
}

function questProgressRatio(quest) {
  if (!quest.targetValue) return 0;
  return quest.progressValue / quest.targetValue;
}
