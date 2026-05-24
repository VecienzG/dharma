import { useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';

import { tokenPairState } from '@/auth/states/tokenPairState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

export const useClerkExchange = () => {
  const { getToken, isSignedIn, isLoaded } = useClerkAuth();
  const setTokenPair = useSetAtomState(tokenPairState);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    (async () => {
      const clerkJwt = await getToken();
      if (!clerkJwt) return;
      const res = await fetch('/auth/clerk/exchange', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${clerkJwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) return;
      const { tokens } = await res.json();
      setTokenPair(tokens);
    })();
  }, [isLoaded, isSignedIn, getToken, setTokenPair]);
};
