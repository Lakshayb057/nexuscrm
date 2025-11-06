import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import { paymentsAPI, donationsAPI } from '../services/api';

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

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;

const ModalContent = styled.div`
  width: 800px;
  max-width: 95vw;
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  padding: 20px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.muted};
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 8px;
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 8px;
`;

export default function Payments() {
  const queryClient = useQueryClient();
  const [openEdit, setOpenEdit] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editDonation, setEditDonation] = useState(null);

  const { data: res, isLoading } = useQuery(['payments', { page: 1, limit: 50 }], () =>
    paymentsAPI.getPayments({ page: 1, limit: 50 }).then(r => r.data)
  );
  const payments = res?.data || [];

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit } = useForm({
    defaultValues: {
      donationDate: '',
      amount: '',
      status: 'completed',
      paymentMethod: 'upi',
      paymentReference: ''
    }
  });

  const updateMutation = useMutation(({ id, data }) => donationsAPI.updateDonation(id, data).then(r => r.data), {
    onSuccess: () => {
      toast.success('Payment updated successfully');
      queryClient.invalidateQueries(['payments']);
      setOpenEdit(false);
      setEditDonation(null);
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Failed to update payment')
  });

  const onOpenEdit = () => {
    if (selectedIds.length !== 1) return;
    const p = payments.find(x => x._id === selectedIds[0]);
    if (!p) return;
    setEditDonation(p);
    resetEdit({
      donationDate: p.donationDate ? p.donationDate.substring(0,10) : '',
      amount: p.amount,
      status: p.status || 'completed',
      paymentMethod: p.paymentMethod || 'upi',
      paymentReference: p.paymentReference || ''
    });
    setOpenEdit(true);
  };

  const onUpdate = (values) => {
    const id = editDonation._id;
    const payload = {
      donationDate: values.donationDate,
      amount: Number(values.amount),
      status: values.status,
      paymentMethod: values.paymentMethod,
      paymentReference: values.paymentReference || undefined,
    };
    updateMutation.mutate({ id, data: payload });
  };

  const deleteMutation = useMutation((id) => donationsAPI.deleteDonation(id), {
    onError: () => toast.error('Failed to delete a payment')
  });

  const onDelete = async () => {
    try {
      await Promise.all(selectedIds.map(id => deleteMutation.mutateAsync(id)));
      toast.success('Deleted selected payments');
      setSelectedIds([]);
      queryClient.invalidateQueries(['payments']);
      setConfirmDelete(false);
    } catch {}
  };

  const exportMutation = useMutation(({ format, ids }) => donationsAPI.exportDonations({ format, ids: ids.join(',') }), {
    onSuccess: (response, vars) => {
      const blob = new Blob([response.data], { type: vars.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = vars.format === 'pdf' ? 'payments.pdf' : 'payments.xlsx';
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
      setOpenExport(false);
    },
    onError: () => toast.error('Export failed')
  });

  const toggleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div>
      <h2>Payments</h2>
      <Toolbar>
        <div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button disabled={!selectedIds.length} onClick={() => setOpenExport(true)}>
            <i className="fas fa-file-export"></i> Export
          </Button>
          <Button disabled={selectedIds.length !== 1} onClick={onOpenEdit}>
            <i className="fas fa-edit"></i> Edit
          </Button>
          <Button disabled={!selectedIds.length} onClick={() => setConfirmDelete(true)}>
            <i className="fas fa-trash"></i> Delete
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
                  <th><input type="checkbox" onChange={(e) => { if (e.target.checked) setSelectedIds(payments.map(p => p._id)); else setSelectedIds([]); }} checked={selectedIds.length && selectedIds.length === payments.length} aria-checked={selectedIds.length > 0 && selectedIds.length < payments.length} /></th>
                  <th>Donor</th>
                  <th className="hide-sm">Date</th>
                  <th className="hide-xs">Organization</th>
                  <th className="hide-xs">Agency</th>
                  <th className="hide-sm">Channel</th>
                  <th className="hide-sm">Campaign</th>
                  <th>Amount</th>
                  <th className="hide-sm">Type</th>
                  <th className="hide-sm">Method</th>
                  <th className="hide-sm">Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p._id}>
                    <td><input type="checkbox" checked={selectedIds.includes(p._id)} onChange={() => toggleSelect(p._id)} /></td>
                    <td>{p.donor?.firstName ? `${p.donor.firstName} ${p.donor.lastName || ''}`.trim() : (p.donor?.name || '-')}</td>
                    <td className="hide-sm">{p.donationDate ? new Date(p.donationDate).toLocaleDateString('en-IN') : '-'}</td>
                    <td className="hide-xs">{p.organization?.name || '-'}</td>
                    <td className="hide-xs">{p.agency?.name || '-'}</td>
                    <td className="hide-sm">{p.channel?.name || '-'}</td>
                    <td className="hide-sm">{p.campaign?.name || '-'}</td>
                    <td>{p.amount}</td>
                    <td className="hide-sm">{p.type}</td>
                    <td className="hide-sm">{p.paymentMethod}</td>
                    <td className="hide-sm">{p.paymentReference || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            </div>
          )}
        </Card>
      </section>

      {openEdit && editDonation && (
        <ModalBackdrop onClick={() => setOpenEdit(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Edit Payment</h3>
              <button className="btn" onClick={() => setOpenEdit(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmitEdit(onUpdate)} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <FormGrid>
                <Field>
                  <Label>Date</Label>
                  <Input type="date" {...registerEdit('donationDate', { required: true })} />
                </Field>
                <Field>
                  <Label>Amount</Label>
                  <Input type="number" step="0.01" min="1" {...registerEdit('amount', { required: true })} placeholder="Amount" />
                </Field>
                <Field>
                  <Label>Status</Label>
                  <Select {...registerEdit('status', { required: true })}>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </Field>
                <Field>
                  <Label>Payment Method</Label>
                  <Select {...registerEdit('paymentMethod', { required: true })}>
                    <option value="upi">UPI</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="net_banking">Net Banking</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                  </Select>
                </Field>
                <Field>
                  <Label>Payment Reference</Label>
                  <Input {...registerEdit('paymentReference')} placeholder="Reference" />
                </Field>
              </FormGrid>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setOpenEdit(false)}>Cancel</button>
                <Button type="submit" disabled={updateMutation.isLoading}>
                  {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </ModalContent>
        </ModalBackdrop>
      )}

      {openExport && (
        <ModalBackdrop onClick={() => setOpenExport(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3>Export Payments</h3>
            <p>Select export format:</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn" onClick={() => setOpenExport(false)}>Cancel</button>
              <Button onClick={() => exportMutation.mutate({ format: 'pdf', ids: selectedIds })}>Export PDF</Button>
              <Button onClick={() => exportMutation.mutate({ format: 'excel', ids: selectedIds })}>Export XLS</Button>
            </div>
          </ModalContent>
        </ModalBackdrop>
      )}

      {confirmDelete && (
        <ModalBackdrop onClick={() => setConfirmDelete(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3>Delete Payments</h3>
            <p>Are you sure you want to delete {selectedIds.length} selected payment(s)? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <Button onClick={onDelete}>Delete</Button>
            </div>
          </ModalContent>
        </ModalBackdrop>
      )}
    </div>
  );
}
