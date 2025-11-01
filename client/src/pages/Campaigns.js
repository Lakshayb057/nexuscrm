import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import { campaignsAPI, organizationsAPI, channelsAPI, agenciesAPI } from '../services/api';

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
  width: 640px;
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

const Textarea = styled.textarea`
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 8px;
  min-height: 90px;
`;

export default function Campaigns() {
  const queryClient = useQueryClient();
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editCampaign, setEditCampaign] = useState(null);

  const { data: listRes, isLoading } = useQuery(['campaigns', { page: 1, limit: 50 }], () =>
    campaignsAPI.getCampaigns({ page: 1, limit: 50 }).then(r => r.data)
  );
  const campaigns = listRes?.data || [];

  const { data: orgRes } = useQuery(['organizations', 'options'], () =>
    organizationsAPI.getOrganizations({ page: 1, limit: 1000 }).then(r => r.data)
  );
  const orgOptions = (orgRes?.data || []).map(o => ({ value: o._id, label: o.name }));

  const { data: channelRes } = useQuery(['channels', 'options'], () =>
    channelsAPI.getChannels({ page: 1, limit: 1000 }).then(r => r.data)
  );
  const channelOptions = (channelRes?.data || []).map(c => ({ value: c._id, label: c.name }));

  const { data: agencyRes } = useQuery(['agencies', 'options'], () =>
    agenciesAPI.getAgencies({ page: 1, limit: 1000 }).then(r => r.data)
  );
  const agencyOptions = (agencyRes?.data || []).map(a => ({ value: a._id, label: a.name }));

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      organizationId: '',
      channelId: '',
      agencyId: '',
      startDate: '',
      endDate: '',
      targetAmount: '',
      status: 'Active',
      description: '',
    }
  });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit } = useForm({
    defaultValues: {
      name: '',
      organizationId: '',
      channelId: '',
      agencyId: '',
      startDate: '',
      endDate: '',
      targetAmount: '',
      status: 'Active',
      description: '',
    }
  });

  const createMutation = useMutation((payload) => campaignsAPI.createCampaign(payload).then(r => r.data), {
    onSuccess: () => {
      toast.success('Campaign created successfully');
      queryClient.invalidateQueries(['campaigns']);
      reset();
      setOpenAdd(false);
    },
    onError: (error) => {
      const message = error?.response?.data?.message || 'Failed to create campaign';
      toast.error(message);
    }
  });

  const updateMutation = useMutation(({ id, data }) => campaignsAPI.updateCampaign(id, data).then(r => r.data), {
    onSuccess: () => {
      toast.success('Campaign updated successfully');
      queryClient.invalidateQueries(['campaigns']);
      setOpenEdit(false);
      setEditCampaign(null);
    },
    onError: (error) => {
      const message = error?.response?.data?.message || 'Failed to update campaign';
      toast.error(message);
    }
  });

  const deleteMutation = useMutation((id) => campaignsAPI.deleteCampaign(id));

  const exportMutation = useMutation(({ format, ids }) => campaignsAPI.exportCampaigns({ format, ids: ids.join(',') }), {
    onSuccess: (response, vars) => {
      const blob = new Blob([response.data], { type: vars.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = vars.format === 'pdf' ? 'campaigns.pdf' : 'campaigns.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setOpenExport(false);
    },
    onError: () => toast.error('Export failed')
  });

  const onCreate = (values) => {
    const payload = {
      name: values.name,
      organization: values.organizationId,
      channel: values.channelId,
      agency: values.agencyId,
      startDate: values.startDate,
      endDate: values.endDate,
      targetAmount: Number(values.targetAmount || 0),
      status: values.status,
      description: values.description,
    };
    createMutation.mutate(payload);
  };

  const onOpenEdit = () => {
    if (selectedIds.length !== 1) return;
    const c = campaigns.find(x => x._id === selectedIds[0]);
    if (!c) return;
    setEditCampaign(c);
    resetEdit({
      name: c.name || '',
      organizationId: c.organization?._id || c.organization || '',
      channelId: c.channel?._id || c.channel || '',
      agencyId: c.agency?._id || c.agency || '',
      startDate: c.startDate ? String(c.startDate).slice(0,10) : '',
      endDate: c.endDate ? String(c.endDate).slice(0,10) : '',
      targetAmount: c.targetAmount || '',
      status: c.status || 'Active',
      description: c.description || '',
    });
    setOpenEdit(true);
  };

  const onUpdate = (values) => {
    const id = editCampaign._id;
    const payload = {
      name: values.name,
      organization: values.organizationId,
      channel: values.channelId,
      agency: values.agencyId,
      startDate: values.startDate,
      endDate: values.endDate,
      targetAmount: Number(values.targetAmount || 0),
      status: values.status,
      description: values.description,
    };
    updateMutation.mutate({ id, data: payload });
  };

  const onDelete = async () => {
    try {
      await Promise.all(selectedIds.map(id => deleteMutation.mutateAsync(id)));
      toast.success('Deleted selected campaigns');
      setSelectedIds([]);
      queryClient.invalidateQueries(['campaigns']);
      setConfirmDelete(false);
    } catch {}
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div>
      <h2>Campaigns</h2>
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
            <i className="fas fa-plus"></i> New Campaign
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
                  <th><input type="checkbox" onChange={(e) => { if (e.target.checked) setSelectedIds(campaigns.map(o => o._id)); else setSelectedIds([]); }} checked={selectedIds.length && selectedIds.length === campaigns.length} aria-checked={selectedIds.length > 0 && selectedIds.length < campaigns.length} /></th>
                  <th>Name</th>
                  <th className="hide-xs">Organization</th>
                  <th className="hide-xs">Channel</th>
                  <th className="hide-xs">Agency</th>
                  <th className="hide-sm">Start Date</th>
                  <th className="hide-sm">End Date</th>
                  <th>Target Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c._id}>
                    <td>
                      <input type="checkbox" checked={selectedIds.includes(c._id)} onChange={() => toggleSelect(c._id)} />
                    </td>
                    <td>{c.name}</td>
                    <td className="hide-xs">{c.organization?.name || '-'}</td>
                    <td className="hide-xs">{c.channel?.name || '-'}</td>
                    <td className="hide-xs">{c.agency?.name || '-'}</td>
                    <td className="hide-sm">{c.startDate ? String(c.startDate).slice(0,10) : '-'}</td>
                    <td className="hide-sm">{c.endDate ? String(c.endDate).slice(0,10) : '-'}</td>
                    <td>{typeof c.targetAmount === 'number' ? c.targetAmount.toLocaleString() : c.targetAmount || '-'}</td>
                    <td>{c.status}</td>
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
              <h3>New Campaign</h3>
              <button className="btn" onClick={() => setOpenAdd(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit(onCreate)} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <FormGrid>
                <Field>
                  <Label>Campaign Name</Label>
                  <Input {...register('name', { required: true })} placeholder="Campaign Name" />
                </Field>
                <Field>
                  <Label>Organization</Label>
                  <Select {...register('organizationId', { required: true })}>
                    <option value="">Select Organization</option>
                    {orgOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>Channel</Label>
                  <Select {...register('channelId', { required: true })}>
                    <option value="">Select Channel</option>
                    {channelOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>Agency</Label>
                  <Select {...register('agencyId', { required: true })}>
                    <option value="">Select Agency</option>
                    {agencyOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>Start Date</Label>
                  <Input type="date" {...register('startDate', { required: true })} />
                </Field>
                <Field>
                  <Label>End Date</Label>
                  <Input type="date" {...register('endDate', { required: true })} />
                </Field>
                <Field>
                  <Label>Target Amount</Label>
                  <Input type="number" step="0.01" {...register('targetAmount', { required: true })} placeholder="0" />
                </Field>
                <Field>
                  <Label>Status</Label>
                  <Select {...register('status', { required: true })}>
                    <option value="Active">Active</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                  </Select>
                </Field>
              </FormGrid>
              <Field>
                <Label>Description</Label>
                <Textarea {...register('description')} placeholder="Description" />
              </Field>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setOpenAdd(false)}>Cancel</button>
                <Button type="submit" disabled={createMutation.isLoading}>
                  {createMutation.isLoading ? 'Creating...' : 'Create Campaign'}
                </Button>
              </div>
            </form>
          </ModalContent>
        </ModalBackdrop>
      )}

      {openExport && (
        <ModalBackdrop onClick={() => setOpenExport(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3>Export Campaigns</h3>
            <p>Select export format:</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn" onClick={() => setOpenExport(false)}>Cancel</button>
              <Button onClick={() => exportMutation.mutate({ format: 'pdf', ids: selectedIds })}>Export PDF</Button>
              <Button onClick={() => exportMutation.mutate({ format: 'excel', ids: selectedIds })}>Export XLS</Button>
            </div>
          </ModalContent>
        </ModalBackdrop>
      )}

      {openEdit && editCampaign && (
        <ModalBackdrop onClick={() => setOpenEdit(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Edit Campaign</h3>
              <button className="btn" onClick={() => setOpenEdit(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmitEdit(onUpdate)} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <FormGrid>
                <Field>
                  <Label>Campaign Name</Label>
                  <Input {...registerEdit('name', { required: true })} placeholder="Campaign Name" />
                </Field>
                <Field>
                  <Label>Organization</Label>
                  <Select {...registerEdit('organizationId', { required: true })}>
                    <option value="">Select Organization</option>
                    {orgOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>Channel</Label>
                  <Select {...registerEdit('channelId', { required: true })}>
                    <option value="">Select Channel</option>
                    {channelOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>Agency</Label>
                  <Select {...registerEdit('agencyId', { required: true })}>
                    <option value="">Select Agency</option>
                    {agencyOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>Start Date</Label>
                  <Input type="date" {...registerEdit('startDate', { required: true })} />
                </Field>
                <Field>
                  <Label>End Date</Label>
                  <Input type="date" {...registerEdit('endDate', { required: true })} />
                </Field>
                <Field>
                  <Label>Target Amount</Label>
                  <Input type="number" step="0.01" {...registerEdit('targetAmount', { required: true })} placeholder="0" />
                </Field>
                <Field>
                  <Label>Status</Label>
                  <Select {...registerEdit('status', { required: true })}>
                    <option value="Active">Active</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                  </Select>
                </Field>
              </FormGrid>
              <Field>
                <Label>Description</Label>
                <Textarea {...registerEdit('description')} placeholder="Description" />
              </Field>
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

      {confirmDelete && (
        <ModalBackdrop onClick={() => setConfirmDelete(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3>Delete Campaigns</h3>
            <p>Are you sure you want to delete {selectedIds.length} selected campaign(s)? This action cannot be undone.</p>
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
