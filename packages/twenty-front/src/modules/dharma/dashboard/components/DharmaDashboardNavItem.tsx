import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { useLocation } from 'react-router-dom';
import { IconLayoutDashboard } from 'twenty-ui/display';

// Path is hardcoded here on purpose: AppPath enum is owned by the router
// integration step (see DHARMA_DASHBOARD_INTEGRATION.md). Once that lands,
// swap this for AppPath.DharmaDashboard.
const DHARMA_DASHBOARD_PATH = '/dharma/dashboard';

export const DharmaDashboardNavItem = () => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(DHARMA_DASHBOARD_PATH);

  return (
    <NavigationDrawerItem
      label="Mattina Dharma"
      to={DHARMA_DASHBOARD_PATH}
      Icon={IconLayoutDashboard}
      active={isActive}
    />
  );
};
