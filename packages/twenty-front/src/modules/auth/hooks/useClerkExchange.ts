import { useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useSetRecoilState } from 'recoil';

import { tokenPairState } from '@/auth/states/tokenPairState';

export const useClerkExchange = () => {
  const { getToken, isSignedIn, isLoaded } = useClerkAuth();
  const setTokenPair = useSetRecoilState(tokenPairState);

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
