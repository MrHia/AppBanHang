import * as React from 'react';
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
  Box, Chip, List, ListItem, ListItemText, Divider, CircularProgress, Card, CardContent
} from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { discrepancyApi } from 'src/api';
import { useAuth } from 'src/contexts/auth-context';
import { useTranslation } from 'src/i18n/useTranslation';

function SiteDiscrepanciesContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [discrepancies, setDiscrepancies] = React.useState([]);
  const [selectedDisc, setSelectedDisc] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [msgLoading, setMsgLoading] = React.useState(false);
  const [newMessage, setNewMessage] = React.useState('');
  const [msgAlert, setMsgAlert] = React.useState('');
  const [msgDialogOpen, setMsgDialogOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    loadDiscrepancies();
  }, []);

  const loadDiscrepancies = async () => {
    setLoading(true);
    try {
      const data = await discrepancyApi.getBySite(user.siteId);
      setDiscrepancies(Array.isArray(data) ? data : []);
    } catch (err) {
      setDiscrepancies([]);
    }
    setLoading(false);
  };

  const openMessageDialog = async (disc) => {
    setSelectedDisc(disc);
    setMsgDialogOpen(true);
    setMsgAlert('');
    setNewMessage('');
    setMsgLoading(true);
    try {
      const msgs = await discrepancyApi.getMessages(disc.id);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (err) {
      setMessages([]);
    }
    setMsgLoading(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    setMsgAlert('');
    try {
      await discrepancyApi.sendMessage(selectedDisc.id, 'SITE', user.id, newMessage);
      const msgs = await discrepancyApi.getMessages(selectedDisc.id);
      setMessages(Array.isArray(msgs) ? msgs : []);
      setNewMessage('');
      setMsgAlert(t('site.discrepancies.messageSent'));
    } catch (err) {
      setMsgAlert(typeof err === 'string' ? err : (err?.message || 'Lỗi gửi phản hồi'));
    }
    setSending(false);
  };

  const getDiscrepancyAmount = (d) => {
    if (d.shortage > 0) return `Thiếu: ${d.shortage}`;
    if (d.excess > 0) return `Thừa: ${d.excess}`;
    return '-';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'error';
      case 'RESOLVING': return 'warning';
      case 'RESOLVED': return 'success';
      default: return 'default';
    }
  };

  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString();
    } catch { return isoStr; }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{t('site.discrepancies.title')}</Typography>
        <Button variant="outlined" onClick={loadDiscrepancies}>{t('common.refresh')}</Button>
      </Box>

      {discrepancies.length === 0 ? (
        <Card><CardContent>
          <Typography align="center" color="text.secondary">
            {t('site.discrepancies.noDiscrepancies')}
          </Typography>
        </CardContent></Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: '#F9FAFB' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('common.name')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('site.discrepancies.discrepancy')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('status.label')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('site.discrepancies.resolutionNotes')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('site.discrepancies.resolvedAt')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {discrepancies.map(d => (
                <TableRow key={d.id} hover>
                  <TableCell>{d.id}</TableCell>
                  <TableCell>{d.merchandiseName}</TableCell>
                  <TableCell>
                    <Chip
                      label={getDiscrepancyAmount(d)}
                      color={d.shortage > 0 ? 'error' : d.excess > 0 ? 'warning' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={d.status} color={getStatusColor(d.status)} size="small" />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography noWrap variant="body2">{d.resolutionNotes || '-'}</Typography>
                  </TableCell>
                  <TableCell>{d.resolvedAt ? formatTime(d.resolvedAt) : '-'}</TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" onClick={() => openMessageDialog(d)}>
                      {t('site.discrepancies.viewDetails')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Message dialog - UC19: Site responds to discrepancy */}
      <Dialog open={msgDialogOpen} onClose={() => setMsgDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {t('site.discrepancies.responseTitle')}
          {selectedDisc && (
            <Typography variant="body2" color="text.secondary">
              {selectedDisc.merchandiseName} — {getDiscrepancyAmount(selectedDisc)}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {msgAlert && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMsgAlert('')}>{msgAlert}</Alert>}

          {msgLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : messages.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
              {t('site.discrepancies.noMessages')}
            </Typography>
          ) : (
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {messages.map((msg, idx) => (
                <React.Fragment key={msg.id || idx}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={700}>
                            {msg.senderType === 'WAREHOUSE' ? 'Warehouse' : 'Site'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">{formatTime(msg.sentAt)}</Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5, p: 1.5, bgcolor: msg.senderType === 'WAREHOUSE' ? 'grey.100' : 'primary.light', borderRadius: 1 }}>
                          <Typography variant="body2">{msg.message}</Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {idx < messages.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}

          {selectedDisc && selectedDisc.status !== 'RESOLVED' && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('site.discrepancies.yourResponse')}
                placeholder="Nhập lý do và phương án giải quyết (gửi bù/hoàn tiền)..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMsgDialogOpen(false)}>{t('common.close')}</Button>
          {selectedDisc && selectedDisc.status !== 'RESOLVED' && (
            <Button variant="contained" onClick={sendMessage} disabled={sending || !newMessage.trim()}>
              {sending ? <CircularProgress size={20} /> : (t('site.discrepancies.sendResponse') || 'Gửi phản hồi')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default function SiteDiscrepanciesPage() {
  return <ProtectedRoute allowedRoles={['SITE']}><DashboardLayout><SiteDiscrepanciesContent /></DashboardLayout></ProtectedRoute>;
}
