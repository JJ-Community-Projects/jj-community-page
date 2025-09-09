// Channel ID helpers for Schedule Editing WS Durable Object
// Deterministic IDs route to stable DO instances per schedule

export const scheduleEditingChannels = {
  edit: (scheduleId: number) => `schedule:edit:${scheduleId}`,
} as const;
