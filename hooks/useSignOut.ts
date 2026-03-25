import { useAuth } from '@/context/AuthContext';

export function useSignOut() {
  const { signOut } = useAuth();
  return signOut;
}
