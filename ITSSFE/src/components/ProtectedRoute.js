import * as React from 'react';
import { useAuth } from 'src/contexts/auth-context';
import { useRouter } from 'next/router';
import { Box, CircularProgress } from '@mui/material';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) { router.replace('/auth/login'); return; }
      // UC1 ext: buộc đổi mật khẩu tạm trước khi vào bất kỳ trang nào
      if (user?.mustChangePassword) { router.replace('/auth/change-password'); return; }
      if (allowedRoles && !allowedRoles.includes(user?.roleName)) { router.replace('/auth/login'); }
    }
  }, [isAuthenticated, isLoading, user, router, allowedRoles]);

  if (isLoading || !isAuthenticated || user?.mustChangePassword) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }
  return children;
}
