export const store = {
    token: null as string | null,
    user: null as any,           // Supabase auth user object
    userProfile: null as any,    // public.users profile row
    completedTasks: new Set<number>(),
    inProgressTasks: new Set<number>()
};
