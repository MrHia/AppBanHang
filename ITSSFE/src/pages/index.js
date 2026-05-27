import { useEffect } from 'react';
import { useAuth } from 'src/contexts/auth-context';
import { useRouter } from 'next/router';

export default function IndexPage() {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (user) {
      const routes = { ADMIN: '/admin/dashboard', OVERSEAS: '/overseas/dashboard', SITE: '/site/dashboard', WAREHOUSE: '/warehouse/dashboard', SALES: '/sales/dashboard' };
      router.replace(routes[user.roleName] || '/auth/login');
    } else {
      router.replace('/auth/login');
    }
  }, [user, router]);
  return null;
}
