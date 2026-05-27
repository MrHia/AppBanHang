import * as React from 'react';
import { Box } from '@mui/material';
import Footer from 'src/components/Footer';

export default function AuthLayout({ children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</Box>
      <Footer />
    </Box>
  );
}
