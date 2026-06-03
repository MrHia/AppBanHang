import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, CircularProgress, Typography } from '@mui/material';

/**
 * Pattern: Compound Component — reusable data table.
 *
 * Usage:
 *   <DataTable
 *     columns={[
 *       { key: 'email', label: 'Email' },
 *       { key: 'role', label: 'Role', render: row => row.roleName },
 *       { key: 'actions', label: 'Actions', align: 'right', render: row => <Button>Edit</Button> },
 *     ]}
 *     rows={accounts}
 *     loading={loading}
 *     emptyMessage="No accounts"
 *   />
 */
export default function DataTable({ columns, rows = [], loading = false, emptyMessage = 'No data' }) {
  if (loading) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  }
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map(col => (
              <TableCell key={col.key} align={col.align || 'left'} sx={col.headerSx}>{col.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">{emptyMessage}</Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => (
              <TableRow key={row.id ?? idx} hover>
                {columns.map(col => (
                  <TableCell key={col.key} align={col.align || 'left'}>
                    {col.render ? col.render(row) : row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
