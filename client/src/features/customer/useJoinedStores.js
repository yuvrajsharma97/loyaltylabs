import { useAuth } from '../../shared/hooks/useAuth';

// GET /customers/me returns each membership with a small `store` summary
// (name, address, logo, category, status), so this needs no extra request.
// `store` is null if the shop has since been deleted - callers handle that.
export function useJoinedStores() {
  const { user } = useAuth();
  const joinedStores = user?.memberships || [];
  return { joinedStores, isLoading: false };
}
