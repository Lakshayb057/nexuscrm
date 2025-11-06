import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import { donationsAPI, contactsAPI, organizationsAPI, agenciesAPI, channelsAPI, campaignsAPI } from '../services/api';

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

export default function MonthlyDonations() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editDonation, setEditDonation] = useState(null);

  useEffect(() => {
    if (location.state?.openAddForm) {
      setOpenAdd(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const { data: res, isLoading } = useQuery(['donations', { page: 1, limit: 50, type: 'monthly' }], () =>
    donationsAPI.getDonations({ page: 1, limit: 50, type: 'monthly' }).then(r => r.data)
  );
  const donations = res?.data || [];

  const { data: contactsRes } = useQuery(['contacts', { page: 1, limit: 100 }], () => contactsAPI.getContacts({ page: 1, limit: 100 }).then(r => r.data));
  const contacts = contactsRes?.data || [];
  const { data: orgsRes } = useQuery(['organizations', { page: 1, limit: 100 }], () => organizationsAPI.getOrganizations({ page: 1, limit: 100 }).then(r => r.data));
  const organizations = orgsRes?.data || [];
  const { data: agenciesRes } = useQuery(['agencies', { page: 1, limit: 100 }], () => agenciesAPI.getAgencies({ page: 1, limit: 100 }).then(r => r.data));
  const agencies = agenciesRes?.data || [];
  const { data: channelsRes } = useQuery(['channels', { page: 1, limit: 100 }], () => channelsAPI.getChannels({ page: 1, limit: 100 }).then(r => r.data));
  const channels = channelsRes?.data || [];
  
  const { data: campaignsRes } = useQuery(['campaigns', { page: 1, limit: 100 }], () => campaignsAPI.getCampaigns({ page: 1, limit: 100 }).then(r => r.data));
  const campaigns = campaignsRes?.data || [];

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      donor: '',
      donationDate: new Date().toISOString().substring(0,10),
      organization: '',
      agency: '',
      channel: '',
      campaign: '',
      amount: '',
      status: 'pending',
      paymentMethod: 'upi',
      paymentReference: '',
    }
  });
  

  const createMutation = useMutation((payload) => donationsAPI.createDonation(payload).then(r => r.data), {
    onSuccess: () => {
      toast.success('Monthly donation created successfully');
      queryClient.invalidateQueries(['donations']);
      reset();
      setOpenAdd(false);
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Failed to create donation')
  });

  const onCreate = (values) => {
    const payload = {
      donor: values.donor,
      organization: values.organization,
      type: 'monthly',
      amount: Number(values.amount),
      currency: 'INR',
      campaign: values.campaign || undefined,
      agency: values.agency || undefined,
      channel: values.channel || undefined,
      donationDate: values.donationDate,
      status: values.status,
      paymentMethod: values.paymentMethod,
      paymentReference: values.paymentReference || undefined,
    };
    if (!payload.donor || !payload.organization || !payload.amount || !payload.paymentMethod) {
      toast.error('Donor, Organization, Amount and Payment Method are required');
      return;
    }
    createMutation.mutate(payload);
  };

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit } = useForm({
    defaultValues: {
      donor: '', donationDate: '', organization: '', agency: '', channel: '', campaign: '', amount: '', status: 'pending', paymentMethod: 'upi', paymentReference: ''
    }
  });

  

  const updateMutation = useMutation(({ id, data }) => donationsAPI.updateDonation(id, data).then(r => r.data), {
    onSuccess: () => {
      toast.success('Monthly donation updated successfully');
      queryClient.invalidateQueries(['donations']);
      setOpenEdit(false);
      setEditDonation(null);
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Failed to update donation')
  });

  const onOpenEdit = () => {
    if (selectedIds.length !== 1) return;
    const d = donations.find(x => x._id === selectedIds[0]);
    if (!d) return;
    setEditDonation(d);
    resetEdit({
      donor: d.donor?._id || d.donor || '',
      donationDate: d.donationDate ? d.donationDate.substring(0,10) : '',
      organization: d.organization?._id || d.organization || '',
      agency: d.agency?._id || d.agency || '',
      channel: d.channel?._id || d.channel || '',
      campaign: d.campaign?._id || d.campaign || '',
      amount: d.amount,
      status: d.status || 'pending',
      paymentMethod: d.paymentMethod || 'upi',
      paymentReference: d.paymentReference || '',
    });
    setOpenEdit(true);
  };

  const onUpdate = (values) => {
    const id = editDonation._id;
    const payload = {
      donor: values.donor,
      organization: values.organization,
      type: 'monthly',
      amount: Number(values.amount),
      currency: 'INR',
      campaign: values.campaign || undefined,
      agency: values.agency || undefined,
      channel: values.channel || undefined,
      donationDate: values.donationDate,
      status: values.status,
      paymentMethod: values.paymentMethod,
      paymentReference: values.paymentReference || undefined,
    };
    updateMutation.mutate({ id, data: payload });
  };

  const deleteMutation = useMutation((id) => donationsAPI.deleteDonation(id), {
    onError: () => toast.error('Failed to delete a donation')
  });

  const onDelete = async () => {
    try {
      await Promise.all(selectedIds.map(id => deleteMutation.mutateAsync(id)));
      toast.success('Deleted selected donations');
      setSelectedIds([]);
      queryClient.invalidateQueries(['donations']);
      setConfirmDelete(false);
    } catch {}
  };

  const exportMutation = useMutation(({ format, ids }) => donationsAPI.exportDonations({ format, ids: ids.join(',') }), {
    onSuccess: (response, vars) => {
      const blob = new Blob([response.data], { type: vars.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = vars.format === 'pdf' ? 'monthly-donations.pdf' : 'monthly-donations.xlsx';
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
      setOpenExport(false);
    },
    onError: () => toast.error('Export failed')
  });

  const toggleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div>
      <h2>Monthly Donations</h2>
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
          <Button onClick={() => setOpenAdd(true)}>
            <i className="fas fa-plus"></i> New Monthly Donation
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
                  <th><input type="checkbox" onChange={(e) => { if (e.target.checked) setSelectedIds(donations.map(d => d._id)); else setSelectedIds([]); }} checked={selectedIds.length && selectedIds.length === donations.length} aria-checked={selectedIds.length > 0 && selectedIds.length < donations.length} /></th>
                  <th>Donor ID</th>
                  <th>Donor</th>
                  <th className="hide-sm">Date</th>
                  <th className="hide-xs">Organization</th>
                  <th className="hide-xs">Agency</th>
                  <th className="hide-sm">Campaign</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {donations.map(d => (
                  <tr key={d._id}>
                    <td><input type="checkbox" checked={selectedIds.includes(d._id)} onChange={() => toggleSelect(d._id)} /></td>
                    <td><code>{d.donorId || 'N/A'}</code></td>
                    <td>{d.donor?.firstName ? `${d.donor.firstName} ${d.donor.lastName || ''}`.trim() : (d.donor?.name || '-')}</td>
                    <td className="hide-sm">{d.donationDate ? new Date(d.donationDate).toLocaleDateString('en-IN') : '-'}</td>
                    <td className="hide-xs">{d.organization?.name || '-'}</td>
                    <td className="hide-xs">{d.agency?.name || '-'}</td>
                    <td className="hide-sm">{d.campaign?.name || '-'}</td>
                    <td>₹{d.amount?.toLocaleString() || '0'}</td>
                    <td><span className={`badge badge-${d.status === 'active' ? 'success' : d.status === 'paused' ? 'warning' : 'danger'}`}>{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </Table>
            </div>
          )}
        </Card>
      </section>

      {openAdd && (
        <ModalBackdrop onClick={() => setOpenAdd(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>New Monthly Donation</h3>
              <button className="btn" onClick={() => setOpenAdd(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit(onCreate)} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <FormGrid>
                <Field>
                  <Label>Donor</Label>
                  <Select {...register('donor', { required: true })}>
                    <option value="">Select Donor</option>
                    {contacts.map(c => (
                      <option key={c._id} value={c._id}>{[c.title, c.firstName, c.lastName].filter(Boolean).join(' ')}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>Date</Label>
                  <Input type="date" {...register('donationDate', { required: true })} />
                </Field>
                <Field>
                  <Label>Organization</Label>
                  <Select {...register('organization', { required: true })}>
                    <option value="">Select Organization</option>
                    {organizations.map(o => (
                      <option key={o._id} value={o._id}>{o.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>Agency</Label>
                  <Select {...register('agency')}>
                    <option value="">Select Agency</option>
                    {agencies.map(a => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>Channel</Label>
                  <Select {...register('channel')}>
                    <option value="">Select Channel</option>
                    {channels.map(ch => (
                      <option key={ch._id} value={ch._id}>{ch.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>Campaign (optional ID)</Label>
                  <Input {...register('campaign')} placeholder="Campaign ID (optional)" />
                </Field>
                <Field>
                  <Label>Amount</Label>
                  <Input type="number" step="0.01" min="1" {...register('amount', { required: true })} placeholder="Amount" />
                </Field>
                <Field>
                  <Label>Status</Label>
                  <Select {...register('status', { required: true })}>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </Field>
                <Field>
                  <Label>Payment Method</Label>
                  <Select {...register('paymentMethod', { required: true })}>
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
                  <Input {...register('paymentReference')} placeholder="Reference" />
                </Field>
              </FormGrid>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setOpenAdd(false)}>Cancel</button>
                <Button type="submit" disabled={createMutation.isLoading}>
                  {createMutation.isLoading ? 'Creating...' : 'Create Donation'}
                </Button>
              </div>
            </form>
          </ModalContent>
        </ModalBackdrop>
      )}

      {openEdit && editDonation && (
      <ModalBackdrop onClick={() => setOpenEdit(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Edit Monthly Donation</h3>
            <button className="btn" onClick={() => setOpenEdit(false)}><i className="fas fa-times"></i></button>
          </div>
          <form onSubmit={handleSubmitEdit(onUpdate)} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            <FormGrid>
              <Field>
                <Label>Donor</Label>
                <Select {...registerEdit('donor', { required: true })}>
                  <option value="">Select Donor</option>
                  {contacts.map(c => (
                    <option key={c._id} value={c._id}>{[c.title, c.firstName, c.lastName].filter(Boolean).join(' ')}</option>
                  ))}
                </Select>
              </Field>
              <Field>
                <Label>Date</Label>
                <Input type="date" {...registerEdit('donationDate', { required: true })} />
              </Field>
              <Field>
                <Label>Organization</Label>
                <Select {...registerEdit('organization', { required: true })}>
                  <option value="">Select Organization</option>
                  {organizations.map(o => (
                    <option key={o._id} value={o._id}>{o.name}</option>
                  ))}
                </Select>
              </Field>
              <Field>
                <Label>Agency</Label>
                <Select {...registerEdit('agency')}>
                  <option value="">Select Agency</option>
                  {agencies.map(a => (
                    <option key={a._id} value={a._id}>{a.name}</option>
                  ))}
                </Select>
              </Field>
              <Field>
                <Label>Channel</Label>
                <Select {...registerEdit('channel')}>
                  <option value="">Select Channel</option>
                  {channels.map(ch => (
                    <option key={ch._id} value={ch._id}>{ch.name}</option>
                  ))}
                </Select>
              </Field>
              <Field>
                <Label>Campaign</Label>
                <Select {...registerEdit('campaign')}>
                  <option value="">Select Campaign</option>
                  {campaigns.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </Select>
              </Field>
              <Field>
                <Label>Amount</Label>
                <Input type="number" step="0.01" min="1" {...registerEdit('amount', { required: true })} placeholder="Amount" />
              </Field>
              <Field>
                <Label>Status</Label>
                <Select {...registerEdit('status', { required: true })}>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
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
            <h3>Export Monthly Donations</h3>
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
            <h3>Delete Donations</h3>
            <p>Are you sure you want to delete {selectedIds.length} selected donation(s)? This action cannot be undone.</p>
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
