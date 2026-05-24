import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { NavigationDrawerSectionTitle } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSectionTitle';
import { IconBrain, IconSparkles } from 'twenty-ui/display';
import { useLocation } from 'react-router-dom';

export const DHARMA_AI_INBOX_PATH = '/dharma/ai/inbox';
export const DHARMA_AI_MEMORY_PATH = '/dharma/ai/memory';

// Drop this section into AppNavigationDrawer.tsx (or any navigation drawer
// container) — it renders the two Dharma AI entry points. We deliberately
// keep it isolated so the integration in AppPath/useCreateAppRouter stays
// minimal: just import + render.
export const DharmaAiNavItems = () => {
  const location = useLocation();

  return (
    <NavigationDrawerSection>
      <NavigationDrawerSectionTitle label="Dharma AI" />
      <NavigationDrawerItem
        label="Suggerimenti AI"
        Icon={IconSparkles}
        to={DHARMA_AI_INBOX_PATH}
        active={location.pathname.startsWith(DHARMA_AI_INBOX_PATH)}
      />
      <NavigationDrawerItem
        label="Memoria AI"
        Icon={IconBrain}
        to={DHARMA_AI_MEMORY_PATH}
        active={location.pathname.startsWith(DHARMA_AI_MEMORY_PATH)}
      />
    </NavigationDrawerSection>
  );
};
