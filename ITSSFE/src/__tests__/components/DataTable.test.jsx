import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DataTable from 'src/components/DataTable';

describe('DataTable', () => {
  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (r) => r.roleName.toUpperCase() },
  ];

  it('renders column headers', () => {
    render(<DataTable columns={columns} rows={[]} emptyMessage="No data" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('renders empty message when no rows', () => {
    render(<DataTable columns={columns} rows={[]} emptyMessage="No data here" />);
    expect(screen.getByText('No data here')).toBeInTheDocument();
  });

  it('renders rows via key extraction', () => {
    const rows = [{ id: 1, email: 'a@b.com', roleName: 'admin' }];
    render(<DataTable columns={columns} rows={rows} />);
    expect(screen.getByText('a@b.com')).toBeInTheDocument();
  });

  it('renders rows via render function', () => {
    const rows = [{ id: 1, email: 'a@b.com', roleName: 'admin' }];
    render(<DataTable columns={columns} rows={rows} />);
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    const { container } = render(<DataTable columns={columns} rows={[]} loading />);
    expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
  });
});
