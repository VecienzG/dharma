import { useLocation } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { IconCoins, IconLayoutDashboard } from 'twenty-ui/display';

import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { NavigationDrawerSectionTitle } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSectionTitle';

export const DharmaNavigationSection = () => {
  const location = useLocation();

  return (
    <NavigationDrawerSection>
      <NavigationDrawerSectionTitle label="Dharma" />
      <NavigationDrawerItem
        label="Mattina"
        Icon={IconLayoutDashboard}
        to={AppPath.DharmaDashboard}
        active={location.pathname.startsWith(AppPath.DharmaDashboard)}
      />
      <NavigationDrawerItem
        label="Finance"
        Icon={IconCoins}
        to={AppPath.DharmaFinance}
        active={location.pathname.startsWith(AppPath.DharmaFinance)}
      />
    </NavigationDrawerSection>
  );
};
