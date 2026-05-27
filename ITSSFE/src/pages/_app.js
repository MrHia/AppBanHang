import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from 'src/contexts/auth-context';
import { LanguageProvider } from 'src/i18n/LanguageContext';
import theme from 'src/theme';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Component {...pageProps} />
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
