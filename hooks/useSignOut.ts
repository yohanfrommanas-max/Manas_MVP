import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { queryClient } from '@/lib/query-client';

export function useSignOut() {
  const { signOut: authSignOut } = useAuth();
  const { clearAllData } = useApp();

  return async () => {
    await clearAllData();
    queryClient.clear();
    await authSignOut();
  };
}
