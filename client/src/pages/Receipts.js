import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import { receiptsAPI, contactsAPI } from '../services/api';

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  gap: 8px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 16px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td { text-align: left; padding: 8px; }
  thead tr { border-bottom: 1px solid ${({ theme }) => theme.colors.border}; }
`;

const MultiSelect = styled.select`
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 8px;
`;

export default function Receipts() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedDonors, setSelectedDonors] = useState([]);

  const { data: res, isLoading } = useQuery(['receipts', { page: 1, limit: 100 }], () =>
    receiptsAPI.getReceipts({ page: 1, limit: 100 }).then(r => r.data)
  );
  const rows = res?.data || [];

  const { data: contactsRes } = useQuery(['contacts', { page: 1, limit: 500 }], () =>
    contactsAPI.getContacts({ page: 1, limit: 500 }).then(r => r.data)
  );
  const contacts = contactsRes?.data || [];

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const onChangeDonors = (e) => {
    const options = Array.from(e.target.options);
    const vals = options.filter(o => o.selected).map(o => o.value);
    setSelectedDonors(vals);
  };

  const generateSelectedMutation = useMutation((ids) => receiptsAPI.generateReceipts({ ids }).then(r => r.data), {
    onSuccess: (data) => {
      toast.success(data?.message || 'Receipt generated');
      queryClient.invalidateQueries(['receipts']);
      setSelectedIds([]);
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Failed to generate receipt')
  });

  const generateBulkMutation = useMutation((body) => receiptsAPI.generateReceipts(body).then(r => r.data), {
    onSuccess: (data) => {
      toast.success(data?.message || 'Receipts generated');
      queryClient.invalidateQueries(['receipts']);
      setSelectedIds([]);
      setSelectedDonors([]);
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Failed to generate receipts')
  });

  const exportMutation = useMutation(({ format, ids }) => receiptsAPI.exportReceipts({ format, ids: ids.join(',') }), {
    onSuccess: (response, vars) => {
      const blob = new Blob([response.data], { type: vars.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = vars.format === 'pdf' ? 'receipts.pdf' : 'receipts.xlsx';
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    },
    onError: () => toast.error('Export failed')
  });

  const onGenerateSelected = () => {
    if (selectedIds.length !== 1) return;
    generateSelectedMutation.mutate(selectedIds);
  };

  const onGenerateBulk = () => {
    const body = {};
    if (selectedIds.length > 1) body.ids = selectedIds;
    if (selectedDonors.length) body.donors = selectedDonors;
    if (!body.ids && !body.donors) {
      toast.error('Select multiple donations or choose donors for bulk generation');
      return;
    }
    generateBulkMutation.mutate(body);
  };

  return (
    <div>
      <h2>80G Receipts</h2>
      <Toolbar>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label>Donors (bulk):</label>
          <MultiSelect multiple size={3} value={selectedDonors} onChange={onChangeDonors}>
            {contacts.map(c => (
              <option key={c._id} value={c._id}>{[c.title, c.firstName, c.lastName].filter(Boolean).join(' ') || c.name}</option>
            ))}
          </MultiSelect>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button disabled={selectedIds.length !== 1} onClick={onGenerateSelected}>
            <i className="fas fa-file-invoice"></i> Generate Selected
          </Button>
          <Button disabled={selectedIds.length <= 1 && selectedDonors.length === 0} onClick={onGenerateBulk}>
            <i className="fas fa-layer-group"></i> Generate Bulk
          </Button>
          <Button disabled={!selectedIds.length} onClick={() => exportMutation.mutate({ format: 'pdf', ids: selectedIds })}>
            <i className="fas fa-file-pdf"></i> Export PDF
          </Button>
          <Button disabled={!selectedIds.length} onClick={() => exportMutation.mutate({ format: 'excel', ids: selectedIds })}>
            <i className="fas fa-file-excel"></i> Export XLS
          </Button>
        </div>
      </Toolbar>

      <section style={{ marginTop: 16 }}>
        <Card>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <div className="table-responsive">
            <Table className="table-sm table-sticky">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={(e) => { if (e.target.checked) setSelectedIds(rows.map(r => r._id)); else setSelectedIds([]); }}
                      checked={selectedIds.length && selectedIds.length === rows.length}
                      aria-checked={selectedIds.length > 0 && selectedIds.length < rows.length}
                    />
                  </th>
                  <th>Donor</th>
                  <th className="hide-sm">Date</th>
                  <th className="hide-xs">Organization</th>
                  <th className="hide-xs">Agency</th>
                  <th className="hide-sm">Type</th>
                  <th>Amount</th>
                  <th className="hide-sm">80G Receipt</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r._id}>
                    <td><input type="checkbox" checked={selectedIds.includes(r._id)} onChange={() => toggleSelect(r._id)} /></td>
                    <td>{r.donor?.firstName ? `${r.donor.firstName} ${r.donor.lastName || ''}`.trim() : (r.donor?.name || '-')}</td>
                    <td className="hide-sm">{r.donationDate ? new Date(r.donationDate).toLocaleDateString('en-IN') : '-'}</td>
                    <td className="hide-xs">{r.organization?.name || '-'}</td>
                    <td className="hide-xs">{r.agency?.name || '-'}</td>
                    <td className="hide-sm">{r.type}</td>
                    <td>{r.amount}</td>
                    <td className="hide-sm">{r.receiptNumber || '-'}</td>
                    <td>{r.receiptStatus || 'pending'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
