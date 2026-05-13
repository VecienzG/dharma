import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

import { AuthContext } from '@/auth/contexts/AuthContext';
import { currentWorkspaceDeletedMembersState } from '@/auth/states/currentWorkspaceDeletedMembersState';
import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export const AuthProvider = ({ children }: React.PropsWithChildren) => {
  const currentWorkspaceMembers = useAtomStateValue(
    currentWorkspaceMembersState,
  );
  const currentWorkspaceDeletedMembers = useAtomStateValue(
    currentWorkspaceDeletedMembersState,
  );

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <AuthContext.Provider
        value={{
          currentWorkspaceMembers,
          currentWorkspaceDeletedMembers,
        }}
      >
        {children}
      </AuthContext.Provider>
    </ClerkProvider>
  );
};
