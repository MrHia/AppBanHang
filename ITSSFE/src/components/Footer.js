import * as React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { useLanguage } from 'src/i18n/LanguageContext';

export default function Footer() {
  const { t, locale, setLocale } = useLanguage();

  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        bgcolor: 'primary.dark',
        color: '#fff',
        py: 1.5,
        px: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      {/* Left: System info */}
      <Typography variant="caption" sx={{ opacity: 0.85 }}>
        {t('footer.systemName')} — {t('footer.copyright')}
      </Typography>

      {/* Right: Language switcher */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title={t('common.langSwitch')} arrow>
          <IconButton
            size="small"
            onClick={() => setLocale(locale === 'vi' ? 'en' : 'vi')}
            sx={{
              color: 'primary.contrastText',
              bgcolor: locale === 'vi' ? 'rgba(255,255,255,0.15)' : 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 1,
              px: 1.5,
              py: 0.5,
              minWidth: 52,
              fontSize: '0.75rem',
              fontWeight: 700,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.25)',
              },
            }}
          >
            {locale === 'vi' ? 'EN' : 'VI'}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
