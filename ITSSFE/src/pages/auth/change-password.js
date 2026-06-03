import * as React from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, CircularProgress, Stack } from '@mui/material';
import { useAuth } from 'src/contexts/auth-context';
import { useRouter } from 'next/router';
import { useTranslation } from 'src/i18n/useTranslation';
import AuthLayout from 'src/layouts/auth';
import { authApi } from 'src/api';

const DASHBOARD_ROUTES = {
  ADMIN: '/admin/dashboard',
  OVERSEAS: '/overseas/dashboard',
  SITE: '/site/dashboard',
  WAREHOUSE: '/warehouse/dashboard',
  SALES: '/sales/dashboard',
};

/**
 * Đổi mật khẩu cho MỌI role (UC1 ext).
 * - Truy cập tự nguyện từ menu: nút "Huỷ" quay lại.
 * - First-login (mustChangePassword=true, mật khẩu tự sinh): hiện cảnh báo + chỉ cho "Đăng xuất".
 *
 * Trang KHÔNG bọc trong ProtectedRoute để tránh redirect loop với enforce ở ProtectedRoute.
 */
export default function ChangePasswordPage() {
  const { user, isLoading, updateUser, signOut } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const firstLogin = Boolean(user?.mustChangePassword);

  React.useEffect(() => {
    if (!isLoading && !user) router.replace('/auth/login');
  }, [isLoading, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) { setError(t('changePassword.tooShort', 'Mật khẩu mới phải có ít nhất 8 ký tự')); return; }
    if (newPassword !== confirm) { setError(t('changePassword.mismatch', 'Mật khẩu xác nhận không khớp')); return; }
    if (newPassword === oldPassword) { setError(t('changePassword.sameAsOld', 'Mật khẩu mới phải khác mật khẩu cũ')); return; }
    setLoading(true);
    try {
      await authApi.changePassword(user.id, oldPassword, newPassword);
      updateUser({ mustChangePassword: false });
      setSuccess(true);
      setTimeout(() => router.replace(DASHBOARD_ROUTES[user.roleName] || '/'), 1200);
    } catch (err) {
      setError(typeof err === 'string' ? err : (err?.message || t('changePassword.failed', 'Đổi mật khẩu thất bại')));
    } finally { setLoading(false); }
  };

  if (isLoading || !user) {
    return (
      <AuthLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><CircularProgress /></Box>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <Paper sx={{ p: 4, width: 420, maxWidth: '90vw' }} elevation={3}>
          <Typography variant="h5" align="center" gutterBottom color="primary">
            {t('changePassword.title', 'Đổi mật khẩu')}
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 2 }}>
            {user.email}
          </Typography>

          {firstLogin && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t('changePassword.firstLoginWarning', 'Bạn đang dùng mật khẩu tạm thời. Vui lòng đổi mật khẩu để tiếp tục.')}
            </Alert>
          )}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{t('changePassword.success', 'Đổi mật khẩu thành công!')}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField fullWidth type="password" label={t('changePassword.oldPassword', 'Mật khẩu hiện tại')}
              value={oldPassword} onChange={e => setOldPassword(e.target.value)} margin="normal" required autoComplete="current-password" />
            <TextField fullWidth type="password" label={t('changePassword.newPassword', 'Mật khẩu mới')}
              value={newPassword} onChange={e => setNewPassword(e.target.value)} margin="normal" required autoComplete="new-password" />
            <TextField fullWidth type="password" label={t('changePassword.confirmPassword', 'Xác nhận mật khẩu mới')}
              value={confirm} onChange={e => setConfirm(e.target.value)} margin="normal" required autoComplete="new-password" />

            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              {firstLogin ? (
                <Button fullWidth variant="outlined" color="inherit"
                  onClick={() => { signOut(); router.replace('/auth/login'); }} disabled={loading}>
                  {t('common.logout', 'Đăng xuất')}
                </Button>
              ) : (
                <Button fullWidth variant="outlined" onClick={() => router.back()} disabled={loading}>
                  {t('common.cancel', 'Huỷ')}
                </Button>
              )}
              <Button fullWidth variant="contained" type="submit" disabled={loading || success}>
                {loading ? <CircularProgress size={24} /> : t('changePassword.submit', 'Đổi mật khẩu')}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Box>
    </AuthLayout>
  );
}
