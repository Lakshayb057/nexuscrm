import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import { channelsAPI, organizationsAPI } from '../services/api';

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

export default function Channels() {
  const queryClient = useQueryClient();
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editChannel, setEditChannel] = useState(null);

  const { data: chRes, isLoading } = useQuery(['channels', { page: 1, limit: 50 }], () => channelsAPI.getChannels({ page: 1, limit: 50 }).then(r => r.data));
  const channels = chRes?.data || [];

  const { data: orgsRes } = useQuery(['organizations', { page: 1, limit: 100 }], () => organizationsAPI.getOrganizations({ page: 1, limit: 100 }).then(r => r.data));
  const organizations = orgsRes?.data || [];

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      organization: '',
      type: 'online',
      status: 'active',
      description: '',
    }
  });

  const createMutation = useMutation((payload) => channelsAPI.createChannel(payload).then(r => r.data), {
    onSuccess: () => {
      toast.success('Channel created successfully');
      queryClient.invalidateQueries(['channels']);
      reset();
      setOpenAdd(false);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create channel');
    }
  });

  const onCreate = (values) => {
    const payload = {
      name: values.name,
      organization: values.organization,
      type: values.type,
      status: values.status,
      description: values.description,
    };
    if (!payload.name || !payload.organization || !payload.type || !payload.status) {
      toast.error('Name, Organization, Channel Type and Status are required');
      return;
    }
    createMutation.mutate(payload);
  };

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit } = useForm({
    defaultValues: {
      name: '',
      organization: '',
      type: 'online',
      status: 'active',
      description: '',
      isActive: true,
    }
  });

  const updateMutation = useMutation(({ id, data }) => channelsAPI.updateChannel(id, data).then(r => r.data), {
    onSuccess: () => {
      toast.success('Channel updated successfully');
      queryClient.invalidateQueries(['channels']);
      setOpenEdit(false);
      setEditChannel(null);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update channel');
    }
  });

  const onOpenEdit = () => {
    if (selectedIds.length !== 1) return;
    const ch = channels.find(c => c._id === selectedIds[0]);
    if (!ch) return;
    setEditChannel(ch);
    resetEdit({
      name: ch.name || '',
      organization: ch.organization?._id || ch.organization || '',
      type: ch.type || 'online',
      status: ch.status || 'active',
      description: ch.description || '',
      isActive: ch.status === 'active',
    });
    setOpenEdit(true);
  };

  const onUpdate = (values) => {
    const id = editChannel._id;
    const payload = {
      name: values.name,
      organization: values.organization,
      type: values.type,
      status: values.status,
      description: values.description,
    };
    updateMutation.mutate({ id, data: payload });
  };

  const deleteMutation = useMutation((id) => channelsAPI.deleteChannel(id), {
    onError: () => toast.error('Failed to delete a channel')
  });

  const onDelete = async () => {
    try {
      await Promise.all(selectedIds.map(id => deleteMutation.mutateAsync(id)));
      toast.success('Deleted selected channels');
      setSelectedIds([]);
      queryClient.invalidateQueries(['channels']);
      setConfirmDelete(false);
    } catch {}
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const exportMutation = useMutation(({ format, ids }) => channelsAPI.exportChannels({ format, ids: ids.join(',') }), {
    onSuccess: (response, vars) => {
      const blob = new Blob([response.data], { type: vars.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = vars.format === 'pdf' ? 'channels.pdf' : 'channels.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setOpenExport(false);
    },
    onError: () => toast.error('Export failed')
  });

  return (
    <div>
      <h2>Channels</h2>
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
            <i className="fas fa-plus"></i> New Channel
          </Button>
        </div>
      </Toolbar>

      <section style={{ marginTop: 16 }}>
        <Card>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <Table className="table-sm table-sticky">
              <thead>
                <tr>
                  <th><input type="checkbox" onChange={(e) => {
                    if (e.target.checked) setSelectedIds(channels.map(c => c._id)); else setSelectedIds([]);
                  }} checked={selectedIds.length && selectedIds.length === channels.length} aria-checked={selectedIds.length > 0 && selectedIds.length < channels.length} /></th>
                  <th>Channel Name</th>
                  <th className="hide-xs">Organization</th>
                  <th>Channel Type</th>
                  <th>Status</th>
                  <th className="hide-sm">Description</th>
                </tr>
              </thead>
              <tbody>
                {channels.map(c => (
                  <tr key={c._id}>
                    <td>
                      <input type="checkbox" checked={selectedIds.includes(c._id)} onChange={() => toggleSelect(c._id)} />
                    </td>
                    <td>{c.name}</td>
                    <td className="hide-xs">{c.organization?.name || '-'}</td>
                    <td>{c.type}</td>
                    <td>{c.status}</td>
                    <td className="hide-sm">{c.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </section>

      {openAdd && (
        <ModalBackdrop onClick={() => setOpenAdd(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>New Channel</h3>
              <button className="btn" onClick={() => setOpenAdd(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit(onCreate)} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <FormGrid>
                <Field>
                  <Label>Channel Name</Label>
                  <Input {...register('name', { required: true })} placeholder="Channel Name" />
                </Field>
                <Field>
                  <Label>Organization</Label>
                  <Select {...register('organization', { required: true })}>
                    <option value="">Select Organization</option>
                    {organizations.map(org => (
                      <option key={org._id} value={org._id}>{org.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>Channel Type</Label>
                  <Select {...register('type', { required: true })}>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="corporate">Corporate</option>
                    <option value="events">Events</option>
                  </Select>
                </Field>
                <Field>
                  <Label>Status</Label>
                  <Select {...register('status', { required: true })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </Field>
                <Field style={{ gridColumn: '1 / -1' }}>
                  <Label>Description</Label>
                  <Input {...register('description')} placeholder="Description" />
                </Field>
              </FormGrid>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setOpenAdd(false)}>Cancel</button>
                <Button type="submit" disabled={createMutation.isLoading}>
                  {createMutation.isLoading ? 'Creating...' : 'Create Channel'}
                </Button>
              </div>
            </form>
          </ModalContent>
        </ModalBackdrop>
      )}

      {openEdit && editChannel && (
        <ModalBackdrop onClick={() => setOpenEdit(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Edit Channel</h3>
              <button className="btn" onClick={() => setOpenEdit(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmitEdit(onUpdate)} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <FormGrid>
                <Field>
                  <Label>Channel Name</Label>
                  <Input {...registerEdit('name', { required: true })} placeholder="Channel Name" />
                </Field>
                <Field>
                  <Label>Organization</Label>
                  <Select {...registerEdit('organization', { required: true })}>
                    <option value="">Select Organization</option>
                    {organizations.map(org => (
                      <option key={org._id} value={org._id}>{org.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>Channel Type</Label>
                  <Select {...registerEdit('type', { required: true })}>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="corporate">Corporate</option>
                    <option value="events">Events</option>
                  </Select>
                </Field>
                <Field>
                  <Label>Status</Label>
                  <Select {...registerEdit('status', { required: true })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </Field>
                <Field style={{ gridColumn: '1 / -1' }}>
                  <Label>Description</Label>
                  <Input {...registerEdit('description')} placeholder="Description" />
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
            <h3>Export Channels</h3>
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
            <h3>Delete Channels</h3>
            <p>Are you sure you want to delete {selectedIds.length} selected channel(s)? This action cannot be undone.</p>
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
