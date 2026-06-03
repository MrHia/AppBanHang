// ============================================================================
//  Step3Track — Poll inquiry status per site and let the user move on once
//  any site has responded (or timed out).
// ============================================================================
import * as React from 'react';
import {
  Box, Card, CardContent, Button, Chip, Alert, Typography, Grid, LinearProgress,
} from '@mui/material';
import { requestApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';
import StatusBadge from './StatusBadge';

export default function Step3Track({ requestId, assignments, sites, hasSentInquiries, onBack, onNext }) {
  const { t } = useTranslation();
  const [statusMap, setStatusMap] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadStatus = React.useCallback(async () => {
    try {
      const r = await requestApi.getInquiryStatus(requestId);
      setStatusMap((typeof r === 'object' && !Array.isArray(r)) ? r : {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [requestId]);

  React.useEffect(() => { loadStatus(); }, [loadStatus]);
  const handleRefresh = () => { setRefreshing(true); loadStatus(); };

  const inquiryAssignments = assignments.filter(a => a.status === 'INQUIRY_SENT' || a.status === 'RESPONDED' || a.status === 'TIMEOUT');
  const bySite = inquiryAssignments.reduce((acc, a) => {
    if (!a.assignedSiteId) return acc;
    if (!acc[a.assignedSiteId]) acc[a.assignedSiteId] = [];
    acc[a.assignedSiteId].push(a);
    return acc;
  }, {});
  const anyResponded = Object.values(statusMap).some(s => s?.status === 'RESPONDED' || s?.status === 'TIMEOUT');

  return React.createElement(Box, null,
    React.createElement(Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 } },
      React.createElement(Alert, { severity: 'info', sx: { mb: 0, flex: 1 } },
        t('overseas.processRequest.step3Alert1'), ' ', React.createElement('strong', null, '48'),
        ' ', t('overseas.processRequest.step3Alert2'),
        anyResponded && ' ' + t('overseas.processRequest.step3Alert3')
      ),
      React.createElement(Button, { size: 'small', onClick: handleRefresh, disabled: refreshing, sx: { ml: 2 }, children: refreshing ? t('overseas.processRequest.refreshing') : t('overseas.processRequest.refresh') })
    ),
    loading
      ? React.createElement(LinearProgress)
      : React.createElement(Grid, { container: true, spacing: 2 },
          Object.entries(bySite).map(([siteId, items]) => {
            const site = sites.find(s => s.id == siteId) || {};
            const s = statusMap[siteId];
            const status = s?.status || 'PENDING';
            const colors = { PENDING: '#D97706', PARTIAL: '#2563EB', RESPONDED: '#059669', TIMEOUT: '#DC2626' };
            const col = colors[status] || '#6B7280';
            return React.createElement(Grid, { item: true, xs: 12, sm: 6, md: 4, key: siteId },
              React.createElement(Card, { variant: 'outlined', sx: { border: '2px solid ' + col } },
                React.createElement(CardContent, null,
                  React.createElement(Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 } },
                    React.createElement(Box, null,
                      React.createElement(Typography, { variant: 'subtitle2', fontWeight: 700, children: site.name }),
                      React.createElement(Typography, { variant: 'caption', color: 'text.secondary', children: site.code + ' - ' + site.country })
                    ),
                    React.createElement(StatusBadge, { status: status })
                  ),
                  React.createElement(Typography, { variant: 'caption', color: 'text.secondary', display: 'block', mb: 1, children: items.length + ' ' + t('overseas.processRequest.merchandiseAssigned') }),
                  React.createElement(Chip, { size: 'small', label: (s?.respondedCount || 0) + '/' + (s?.totalItems || items.length) + ' ' + t('overseas.processRequest.itemsResponded'), variant: 'outlined', sx: { mb: 0.5 } }),
                  s?.timeoutAt && React.createElement(Typography, { variant: 'caption', color: 'text.secondary', display: 'block', children: t('overseas.processRequest.timeout') + ' ' + new Date(s.timeoutAt).toLocaleString('vi-VN') }),
                  status === 'PENDING' && React.createElement(Typography, { variant: 'caption', color: 'warning.main', children: t('overseas.processRequest.waitingResponse') }),
                  status === 'RESPONDED' && React.createElement(Typography, { variant: 'caption', color: 'success.main', children: t('overseas.processRequest.respondedFully') }),
                  status === 'TIMEOUT' && React.createElement(Typography, { variant: 'caption', color: 'error.main', children: t('overseas.processRequest.timeoutNote') })
                )
              )
            );
          })
        ),
    React.createElement(Box, { sx: { mt: 3, display: 'flex', justifyContent: 'space-between' } },
      React.createElement(Button, { onClick: onBack, disabled: hasSentInquiries, children: t('overseas.processRequest.back') }),
      React.createElement(Button, { variant: 'contained', onClick: onNext, disabled: loading || !anyResponded },
        anyResponded ? t('overseas.processRequest.continueMatrix') : t('overseas.processRequest.waitingForResponse')
      )
    )
  );
}
