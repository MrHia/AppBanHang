import * as React from 'react';
import { Box, AppBar, Toolbar, Typography, Button, IconButton, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip, Badge, Card, CardContent } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import StoreIcon from '@mui/icons-material/Store';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useAuth } from 'src/contexts/auth-context';
import { useRouter } from 'next/router';
import { useLanguage } from 'src/i18n/LanguageContext';
import Footer from 'src/components/Footer';
import { notificationApi } from 'src/api';

const menuItems = {
  ADMIN: [
    { labelKey: 'nav.dashboard', icon: <DashboardIcon />, href: '/admin/dashboard' },
    { labelKey: 'nav.accountManagement', icon: <PeopleIcon />, href: '/admin/accounts' },
    { labelKey: 'nav.siteManagement', icon: <StoreIcon />, href: '/admin/sites' },
    { labelKey: 'nav.merchandiseManagement', icon: <InventoryIcon />, href: '/admin/merchandise' },
    { labelKey: 'nav.orderRequests', icon: <AssignmentIcon />, href: '/admin/order-requests' },
    { labelKey: 'nav.purchaseOrders', icon: <LocalShippingIcon />, href: '/admin/purchase-orders' },
  ],
  OVERSEAS: [
    { labelKey: 'nav.dashboard', icon: <DashboardIcon />, href: '/overseas/dashboard' },
    { labelKey: 'nav.orderRequests', icon: <AssignmentIcon />, href: '/overseas/requests' },
    { labelKey: 'nav.processRequests', icon: <ShoppingCartIcon />, href: '/overseas/process-request' },
    { labelKey: 'nav.purchaseOrders', icon: <LocalShippingIcon />, href: '/overseas/purchase-orders' },
  ],
  SITE: [
    { labelKey: 'nav.dashboard', icon: <DashboardIcon />, href: '/site/dashboard' },
    { labelKey: 'nav.businessMerchandise', icon: <InventoryIcon />, href: '/site/merchandise' },
    { labelKey: 'nav.purchaseOrders', icon: <LocalShippingIcon />, href: '/site/purchase-orders' },
    { labelKey: 'nav.handleDiscrepancies', icon: <AssignmentIcon />, href: '/site/discrepancies' },
  ],
  WAREHOUSE: [
    { labelKey: 'nav.dashboard', icon: <DashboardIcon />, href: '/warehouse/dashboard' },
    { labelKey: 'nav.confirmedOrders', icon: <LocalShippingIcon />, href: '/warehouse/confirmed-pos' },
    { labelKey: 'nav.handleDiscrepancies', icon: <AssignmentIcon />, href: '/warehouse/discrepancies' },
  ],
  SALES: [
    { labelKey: 'nav.dashboard', icon: <DashboardIcon />, href: '/sales/dashboard' },
    { labelKey: 'nav.createOrderRequest', icon: <ShoppingCartIcon />, href: '/sales/create-request' },
    { labelKey: 'nav.requestHistory', icon: <AssignmentIcon />, href: '/sales/my-requests' },
  ],
};

const KONAMI_CODE = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
const SECRET_HOTKEY = 'devlang';

function SecretLangToggle({ onToggle }) {
  const [clicks, setClicks] = React.useState(0);
  const timerRef = React.useRef(null);
  const konamiRef = React.useRef([]);
  const hotkeyBuffer = React.useRef('');

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Konami code
      konamiRef.current.push(e.key);
      if (konamiRef.current.length > KONAMI_CODE.length) {
        konamiRef.current.shift();
      }
      if (konamiRef.current.join(',') === KONAMI_CODE.join(',')) {
        onToggle();
        konamiRef.current = [];
        return;
      }

      // devlang hotkey
      hotkeyBuffer.current += e.key.toLowerCase();
      if (hotkeyBuffer.current.length > SECRET_HOTKEY.length) {
        hotkeyBuffer.current = hotkeyBuffer.current.slice(-SECRET_HOTKEY.length);
      }
      if (hotkeyBuffer.current === SECRET_HOTKEY) {
        onToggle();
        hotkeyBuffer.current = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggle]);

  const handleSecretClick = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const next = clicks + 1;
    if (next >= 3) {
      onToggle();
      setClicks(0);
    } else {
      setClicks(next);
      timerRef.current = setTimeout(() => setClicks(0), 600);
    }
  };

  return (
    <Box
      onClick={handleSecretClick}
      sx={{
        position: 'fixed',
        bottom: 4,
        right: 4,
        width: 8,
        height: 8,
        opacity: 0,
        cursor: 'default',
        zIndex: 0,
        userSelect: 'none',
      }}
      title="."
    />
  );
}

export default function DashboardLayout({ children }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { t, locale, setLocale } = useLanguage();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [notifCount, setNotifCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState([]);
  const items = menuItems[user?.roleName] || [];

  React.useEffect(() => {
    if (user?.roleName) {
      // Pass siteId so SITE users only see their own site's notifications.
      // Other roles ignore the siteId (BE filters return null on it).
      notificationApi.getUnreadCount(user.roleName, user.siteId).then(c => setNotifCount(typeof c === 'number' ? c : 0)).catch(() => {});
    }
  }, [user]);

  const openNotifications = async () => {
    if (!notifOpen) {
      try {
        const data = await notificationApi.getUnread(user.roleName, user.siteId);
        setNotifications(Array.isArray(data) ? data : []);
      } catch { setNotifications([]); }
    }
    setNotifOpen(!notifOpen);
  };

  // Route a notification deep-link to the page that's actually meaningful for
  // the current role. Previously every purchase_order notification routed to
  // /warehouse/confirmed-pos, which Site users could not even view.
  const notificationDeepLink = (n) => {
    if (n.entityType !== 'purchase_order') return null;
    switch (user?.roleName) {
      case 'SITE': return '/site/purchase-orders';
      case 'WAREHOUSE': return '/warehouse/confirmed-pos';
      case 'OVERSEAS': return '/overseas/purchase-orders';
      case 'ADMIN': return '/admin/purchase-orders';
      default: return null;
    }
  };

  const markAllRead = async () => {
    try {
      for (const n of notifications) {
        await notificationApi.markAsRead(n.id);
      }
      setNotifications([]);
      setNotifCount(0);
    } catch {}
  };

  const handleLogout = () => { signOut(); router.push('/auth/login'); };

  const toggleLanguage = React.useCallback(() => {
    setLocale(locale === 'vi' ? 'en' : 'vi');
  }, [locale, setLocale]);

  const roleLabel = user?.roleName || '';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: 1200, bgcolor: 'primary.main' }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 2 }}><MenuIcon /></IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {t('nav.importOrderSystem')} - {roleLabel}
          </Typography>

          <Tooltip title={t('notifications.title') || 'Notifications'}>
            <IconButton color="inherit" onClick={openNotifications} sx={{ mr: 1 }}>
              <Badge badgeContent={notifCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {notifOpen && (
            <Box sx={{
              position: 'absolute', top: '100%', right: 16, mt: 1, width: 360, zIndex: 1300,
              bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3, maxHeight: 400, overflow: 'auto'
            }}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight={700}>{t('notifications.title') || 'Thông báo'}</Typography>
                {notifications.length > 0 && (
                  <Button size="small" onClick={markAllRead}>{t('notifications.markAllRead') || 'Đánh dấu đã đọc'}</Button>
                )}
              </Box>
              {notifications.length === 0 ? (
                <Box sx={{ p: 2 }}><Typography variant="body2" color="text.secondary">{t('notifications.noNotif') || 'Không có thông báo mới'}</Typography></Box>
              ) : notifications.map(n => (
                <Box key={n.id} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}
                  onClick={() => {
                    setNotifOpen(false);
                    const dest = notificationDeepLink(n);
                    if (dest) router.push(dest);
                  }}>
                  <Typography variant="subtitle2" fontWeight={700}>{n.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{n.message}</Typography>
                  {n.createdAt && <Typography variant="caption" color="text.disabled">{new Date(n.createdAt).toLocaleString()}</Typography>}
                </Box>
              ))}
            </Box>
          )}

          <Typography variant="body2" sx={{ mr: 2 }}>{user?.firstName} {user?.lastName}</Typography>

          <Tooltip title={t('changePassword.menuLabel', 'Đổi mật khẩu')}>
            <IconButton color="inherit" onClick={() => router.push('/auth/change-password')} sx={{ mr: 1 }}>
              <VpnKeyIcon />
            </IconButton>
          </Tooltip>

          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>{t('common.logout')}</Button>
        </Toolbar>
      </AppBar>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 240, pt: 8 } }}
      >
        <List>
          {items.map(item => (
            <ListItem key={item.href} disablePadding>
              <ListItemButton
                selected={router.pathname === item.href}
                onClick={() => { router.push(item.href); setDrawerOpen(false); }}
              >
                <ListItemIcon sx={{ color: router.pathname === item.href ? 'primary.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={t(item.labelKey)} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', mt: 8 }}>
        <Box sx={{ flexGrow: 1, p: 3, bgcolor: 'background.default', pb: 'calc(48px + 24px)' }}>
          {children}
        </Box>
        <Footer />
      </Box>

      {/* Secret language toggle triggers */}
      <SecretLangToggle onToggle={toggleLanguage} />
    </Box>
  );
}
