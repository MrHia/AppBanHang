import * as React from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { useAuth } from 'src/contexts/auth-context';
import { useRouter } from 'next/router';
import { useTranslation } from 'src/i18n/useTranslation';
import AuthLayout from 'src/layouts/auth';

export default function LoginPage() {
  const { signIn, user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (user) {
      const routes = { ADMIN: '/admin/dashboard', OVERSEAS: '/overseas/dashboard', SITE: '/site/dashboard', WAREHOUSE: '/warehouse/dashboard', SALES: '/sales/dashboard' };
      router.replace(routes[user.roleName] || '/');
    }
  }, [user, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(typeof err === 'string' ? err : (err?.message || t('login.loginFailed')));
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout>
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Paper sx={{ p: 4, width: 400, maxWidth: '90vw' }} elevation={3}>
          <Typography variant="h4" align="center" gutterBottom color="primary">
            {t('login.title')}
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            {t('login.signInSubtitle')}
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleLogin}>
            <TextField fullWidth label={t('common.email')} value={email} onChange={e => setEmail(e.target.value)} margin="normal" required autoComplete="email" />
            <TextField fullWidth label={t('login.password')} type="password" value={password} onChange={e => setPassword(e.target.value)} margin="normal" required autoComplete="current-password" />
            <Button fullWidth variant="contained" type="submit" disabled={loading} sx={{ mt: 2 }} size="large">
              {loading ? <CircularProgress size={24} /> : t('login.signIn')}
            </Button>
          </form>
        </Paper>
      </Box>
    </AuthLayout>
  );
}
