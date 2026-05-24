import { useLocation } from 'react-router-dom';
import { IconCoins } from 'twenty-ui/display';

import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';

export const DHARMA_FINANCE_PATH = '/dharma/finance';

export const DharmaFinanceNavItem = () => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(DHARMA_FINANCE_PATH);

  return (
    <NavigationDrawerItem
      label="Finance"
      to={DHARMA_FINANCE_PATH}
      Icon={IconCoins}
      active={isActive}
    />
  );
};
