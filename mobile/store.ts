export const store = {
    token: null as string | null,
    user: null as any,
    completedTasks: new Set<number>(),
    inProgressTasks: new Set<number>()
};
