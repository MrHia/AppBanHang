// ============================================================================
//  Process Request — thin container/orchestrator.
//  Two-step wizard (after the stock-inquiry removal):
//    Step 1 — Assign one site per merchandise
//    Step 2 — Review site stock + create PO batch
// ============================================================================
import * as React from 'react';
import {
  Container, Typography, Card, CardContent, Box, Button, Chip, Alert,
  LinearProgress, Collapse, Stepper, Step, StepLabel,
} from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { useRouter } from 'next/router';
import { requestApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';
import SyncIcon from '@mui/icons-material/Sync';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Step1AssignSites from 'src/components/overseas/processrequest/Step1AssignSites';
import Step2CreatePOs from 'src/components/overseas/processrequest/Step2CreatePOs';

const STEP_ICONS = [FactCheckIcon, ShoppingCartIcon];

function ProcessRequestContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = router.query;
  const [request, setRequest] = React.useState(null);
  const [items, setItems] = React.useState([]);
  const [assignments, setAssignments] = React.useState([]);
  const [sites, setSites] = React.useState([]);
  const [activeStep, setActiveStep] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [alert, setAlert] = React.useState('');

  const stepLabels = [
    t('overseas.processRequest.stepLabels.step1'),
    t('overseas.processRequest.stepLabels.step2'),
  ];

  React.useEffect(() => {
    if (!id) return;
    const load = (isAutoRefresh = false) => {
      if (isAutoRefresh) setRefreshing(true);
      else setLoading(true);
      Promise.all([
        requestApi.getById(id).catch(() => null),
        requestApi.getItems(id).catch(() => []),
        requestApi.getMerchandiseAssignments(id).catch(() => []),
      ]).then(([r, it, asg]) => {
        setRequest(r);
        setItems(Array.isArray(it) ? it : []);
        setAssignments(Array.isArray(asg) ? asg : []);
      }).catch(err => {
        if (!isAutoRefresh) setAlert(typeof err === 'string' ? err : (err?.message || t('common.error')));
      }).finally(() => {
        if (isAutoRefresh) setRefreshing(false);
        else setLoading(false);
      });
    };
    load(false);
    const interval = setInterval(() => load(true), 15000);
    return () => clearInterval(interval);
  }, [id]);

  React.useEffect(() => {
    import('src/api').then(m => {
      m.siteApi.getAll().then(s => setSites(Array.isArray(s) ? s : [])).catch(() => {});
    }).catch(() => {});
  }, []);

  if (loading) return React.createElement(LinearProgress);
  if (!request) return React.createElement(Container, { maxWidth: 'xl' },
    React.createElement(Typography, { variant: 'h6', color: 'text.secondary' }, t('overseas.processRequest.notFound'))
  );

  const isProcessing = request.status === 'PROCESSING';
  const handleNext = () => setActiveStep(s => Math.min(s + 1, stepLabels.length - 1));
  const handleBack = () => setActiveStep(s => Math.max(s - 1, 0));
  const statusLabel = request.status === 'PROCESSING' ? t('overseas.processRequest.processing') : request.status === 'DONE' ? t('overseas.processRequest.completed') : request.status;
  const statusColor = request.status === 'PROCESSING' ? 'info' : request.status === 'DONE' ? 'success' : request.status === 'CANCELLED' ? 'error' : 'warning';

  return React.createElement(Container, { maxWidth: 'xl', sx: { pb: 4 } },
    React.createElement('style', null, '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'),
    React.createElement(Box, { sx: { mb: 3 } },
      React.createElement(Box, { sx: { display: 'flex', alignItems: 'center', gap: 2, mb: 1 } },
        refreshing && React.createElement(SyncIcon, { sx: { fontSize: 20, animation: 'spin 1s linear infinite', color: 'text.secondary' } }),
        React.createElement(Typography, { variant: 'h5', fontWeight: 800, color: 'primary.main', children: t('overseas.processRequest.title') }),
        React.createElement(Chip, { label: request.code, sx: { fontFamily: 'monospace', fontWeight: 700, bgcolor: '#EEF2FF', color: '#4338CA' } }),
        React.createElement(Chip, { label: statusLabel, size: 'small', color: statusColor })
      ),
      React.createElement(Box, { sx: { display: 'flex', gap: 3, flexWrap: 'wrap' } },
        React.createElement(Typography, { variant: 'body2', color: 'text.secondary', children: t('overseas.processRequest.desiredDeliveryDate') + ': ' + request.desiredDate }),
        request.createdAt && React.createElement(Typography, { variant: 'body2', color: 'text.secondary', children: t('overseas.processRequest.createdAt') + ': ' + new Date(request.createdAt).toLocaleString('vi-VN') }),
        request.createdByName && React.createElement(Typography, { variant: 'body2', color: 'text.secondary', children: t('overseas.processRequest.createdBy') + ': ' + request.createdByName })
      ),
      request.notes && React.createElement(Typography, { variant: 'body2', color: 'text.secondary', sx: { mt: 0.5, fontStyle: 'italic' }, children: t('overseas.processRequest.notes') + ': ' + request.notes })
    ),
    alert && React.createElement(Collapse, { in: !!alert },
      React.createElement(Alert, { severity: 'info', sx: { mb: 2 }, onClose: () => setAlert('') }, alert)
    ),
    items.length > 0 && React.createElement(Card, { sx: { mb: 3, border: '1px solid #E2E8F0' }, elevation: 0 },
      React.createElement(Box, { sx: { px: 3, py: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' } },
        React.createElement(Typography, { variant: 'subtitle1', fontWeight: 700, children: t('overseas.processRequest.merchandiseList') + ' (' + items.length + ')' })
      ),
      React.createElement(Box, { sx: { px: 3, py: 1 } },
        items.map((item, idx) =>
          React.createElement(Box, { key: item.merchandiseId, sx: { display: 'flex', alignItems: 'center', gap: 2, py: 1 } },
            React.createElement(Typography, { variant: 'body2', sx: { minWidth: 30, fontWeight: 700, color: 'text.secondary' }, children: (idx + 1) + '.' }),
            React.createElement(Typography, { variant: 'body2', fontWeight: 600, sx: { fontFamily: 'monospace' }, children: item.merchandiseCode }),
            React.createElement(Typography, { variant: 'body2', color: 'text.secondary', children: '-' }),
            React.createElement(Typography, { variant: 'body2', children: item.merchandiseName }),
            React.createElement(Chip, { size: 'small', label: item.quantity + ' ' + item.unit, variant: 'outlined', sx: { height: 20, fontSize: '0.7rem' } })
          )
        )
      )
    ),
    isProcessing
      ? React.createElement(Box, null,
          React.createElement(Card, { sx: { mb: 3, border: '1px solid #E2E8F0' }, elevation: 0 },
            React.createElement(CardContent, null,
              React.createElement(Stepper, { activeStep: activeStep, alternativeLabel: true, sx: { mb: 1 } },
                stepLabels.map((label, idx) =>
                  React.createElement(Step, { key: label },
                    React.createElement(StepLabel, {
                      StepIconComponent: () => React.createElement(Box, {
                        sx: { width: 32, height: 32, borderRadius: '50%', bgcolor: idx <= activeStep ? 'primary.main' : '#E5E7EB', color: idx <= activeStep ? 'white' : 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' },
                        children: React.createElement(STEP_ICONS[idx], { sx: { fontSize: 16 } })
                      }),
                      children: React.createElement(Typography, { variant: 'caption', fontWeight: 600, children: label })
                    })
                  )
                )
              )
            )
          ),
          React.createElement(Card, { sx: { border: '1px solid #E2E8F0' }, elevation: 0 },
            React.createElement(CardContent, null,
              activeStep === 0 && React.createElement(Step1AssignSites, { requestId: request.id, items, assignments, sites, onBack: handleBack, onNext: handleNext }),
              activeStep === 1 && React.createElement(Step2CreatePOs, { requestId: request.id, items, sites, onBack: handleBack })
            )
          )
        )
      : React.createElement(Card, { sx: { border: '1px solid #E2E8F0', textAlign: 'center', py: 4 }, elevation: 0 },
          React.createElement(Typography, { variant: 'h6', color: 'text.secondary', sx: { mb: 2 }, children: t('overseas.processRequest.title') + ' - ' + request.status }),
          request.status === 'PENDING' && React.createElement(Button, {
            variant: 'contained', color: 'primary', size: 'large', startIcon: React.createElement(FactCheckIcon),
            onClick: async () => {
              try {
                await requestApi.submit(request.id);
                setAlert(t('overseas.processRequest.startProcessing'));
                setRequest(prev => prev ? { ...prev, status: 'PROCESSING' } : prev);
              } catch (err) {
                setAlert(typeof err === 'string' ? err : (err?.message || t('common.error')));
              }
            },
            children: t('overseas.processRequest.startProcessing')
          }),
          request.status === 'DONE' && React.createElement(Typography, { variant: 'body2', color: 'success.main', fontWeight: 600, children: t('overseas.processRequest.requestCompleted') }),
          request.status === 'CANCELLED' && React.createElement(Typography, { variant: 'body2', color: 'error.main', fontWeight: 600, children: t('overseas.processRequest.requestCancelled') })
        ),
    React.createElement(Box, { sx: { mt: 3 } }, React.createElement(Button, { onClick: () => router.back(), children: t('overseas.processRequest.backToList') }))
  );
}

export default function ProcessRequestPage() {
  return React.createElement(ProtectedRoute, { allowedRoles: ['OVERSEAS'] },
    React.createElement(DashboardLayout, null, React.createElement(ProcessRequestContent))
  );
}
