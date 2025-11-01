import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import { agenciesAPI, organizationsAPI } from '../services/api';

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

export default function Agencies() {
  const queryClient = useQueryClient();
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editAgency, setEditAgency] = useState(null);

  const { data: agenciesRes, isLoading } = useQuery(['agencies', { page: 1, limit: 50 }], () => agenciesAPI.getAgencies({ page: 1, limit: 50 }).then(r => r.data));
  const agencies = agenciesRes?.data || [];

  const { data: orgsRes } = useQuery(['organizations', { page: 1, limit: 100 }], () => organizationsAPI.getOrganizations({ page: 1, limit: 100 }).then(r => r.data));
  const organizations = orgsRes?.data || [];

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      organization: '',
      contactPerson: '',
      email: '',
      phone: '',
      commissionPercentage: 0,
      addressStreet: '',
      addressCity: '',
      addressState: '',
      addressZipCode: '',
      addressCountry: 'India',
    }
  });

  const createMutation = useMutation((payload) => agenciesAPI.createAgency(payload).then(r => r.data), {
    onSuccess: () => {
      toast.success('Agency created successfully');
      queryClient.invalidateQueries(['agencies']);
      reset();
      setOpenAdd(false);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create agency');
    }
  });

  const onCreate = (values) => {
    const payload = {
      name: values.name,
      organization: values.organization,
      contactPerson: values.contactPerson,
      email: values.email,
      phone: values.phone,
      commissionPercentage: Number(values.commissionPercentage) || 0,
      address: {
        street: values.addressStreet,
        city: values.addressCity,
        state: values.addressState,
        zipCode: values.addressZipCode,
        country: values.addressCountry,
      }
    };
    if (!payload.name || !payload.organization || !payload.contactPerson || !payload.phone) {
      toast.error('Name, Organization, Contact Person and Phone are required');
      return;
    }
    createMutation.mutate(payload);
  };

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit } = useForm({
    defaultValues: {
      name: '',
      organization: '',
      contactPerson: '',
      email: '',
      phone: '',
      commissionPercentage: 0,
      addressStreet: '',
      addressCity: '',
      addressState: '',
      addressZipCode: '',
      addressCountry: 'India',
      isActive: true,
    }
  });

  const updateMutation = useMutation(({ id, data }) => agenciesAPI.updateAgency(id, data).then(r => r.data), {
    onSuccess: () => {
      toast.success('Agency updated successfully');
      queryClient.invalidateQueries(['agencies']);
      setOpenEdit(false);
      setEditAgency(null);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update agency');
    }
  });

  const onOpenEdit = () => {
    if (selectedIds.length !== 1) return;
    const ag = agencies.find(a => a._id === selectedIds[0]);
    if (!ag) return;
    setEditAgency(ag);
    resetEdit({
      name: ag.name || '',
      organization: ag.organization?._id || ag.organization || '',
      contactPerson: ag.contactPerson || '',
      email: ag.email || '',
      phone: ag.phone || '',
      commissionPercentage: ag.commissionPercentage ?? 0,
      addressStreet: ag.address?.street || '',
      addressCity: ag.address?.city || '',
      addressState: ag.address?.state || '',
      addressZipCode: ag.address?.zipCode || '',
      addressCountry: ag.address?.country || 'India',
      isActive: ag.isActive !== false,
    });
    setOpenEdit(true);
  };

  const onUpdate = (values) => {
    const id = editAgency._id;
    const payload = {
      name: values.name,
      organization: values.organization,
      contactPerson: values.contactPerson,
      email: values.email,
      phone: values.phone,
      commissionPercentage: Number(values.commissionPercentage) || 0,
      address: {
        street: values.addressStreet,
        city: values.addressCity,
        state: values.addressState,
        zipCode: values.addressZipCode,
        country: values.addressCountry,
      },
      isActive: !!values.isActive,
    };
    updateMutation.mutate({ id, data: payload });
  };

  const deleteMutation = useMutation((id) => agenciesAPI.deleteAgency(id), {
    onError: () => toast.error('Failed to delete an agency')
  });

  const onDelete = async () => {
    try {
      await Promise.all(selectedIds.map(id => deleteMutation.mutateAsync(id)));
      toast.success('Deleted selected agencies');
      setSelectedIds([]);
      queryClient.invalidateQueries(['agencies']);
      setConfirmDelete(false);
    } catch {}
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const exportMutation = useMutation(({ format, ids }) => agenciesAPI.exportAgencies({ format, ids: ids.join(',') }), {
    onSuccess: (response, vars) => {
      const blob = new Blob([response.data], { type: vars.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = vars.format === 'pdf' ? 'agencies.pdf' : 'agencies.xlsx';
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
      <h2>Agencies</h2>
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
            <i className="fas fa-plus"></i> Add Agency
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
                  <th><input type="checkbox" onChange={(e) => {
                    if (e.target.checked) setSelectedIds(agencies.map(a => a._id)); else setSelectedIds([]);
                  }} checked={selectedIds.length && selectedIds.length === agencies.length} aria-checked={selectedIds.length > 0 && selectedIds.length < agencies.length} /></th>
                  <th>Agency Name</th>
                  <th className="hide-xs">Organization</th>
                  <th>Contact Person</th>
                  <th className="hide-sm">Email</th>
                  <th>Phone</th>
                  <th className="hide-sm">Commission %</th>
                  <th className="hide-xs">Address</th>
                </tr>
              </thead>
              <tbody>
                {agencies.map(a => (
                  <tr key={a._id}>
                    <td>
                      <input type="checkbox" checked={selectedIds.includes(a._id)} onChange={() => toggleSelect(a._id)} />
                    </td>
                    <td>{a.name}</td>
                    <td className="hide-xs">{a.organization?.name || '-'}</td>
                    <td>{a.contactPerson}</td>
                    <td className="hide-sm">{a.email || '-'}</td>
                    <td>{a.phone}</td>
                    <td className="hide-sm">{a.commissionPercentage ?? 0}</td>
                    <td className="hide-xs">{[a.address?.street, a.address?.city, a.address?.state, a.address?.zipCode, a.address?.country].filter(Boolean).join(', ')}</td>
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
              <h3>Add Agency</h3>
              <button className="btn" onClick={() => setOpenAdd(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit(onCreate)} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <FormGrid>
                <Field>
                  <Label>Agency Name</Label>
                  <Input {...register('name', { required: true })} placeholder="Agency Name" />
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
                  <Label>Contact Person</Label>
                  <Input {...register('contactPerson', { required: true })} placeholder="Contact Person" />
                </Field>
                <Field>
                  <Label>Email</Label>
                  <Input type="email" {...register('email')} placeholder="email@example.com" />
                </Field>
                <Field>
                  <Label>Phone</Label>
                  <Input {...register('phone', { required: true })} placeholder="Phone" />
                </Field>
                <Field>
                  <Label>Commission Percentage</Label>
                  <Input type="number" step="0.01" min="0" max="100" {...register('commissionPercentage')} placeholder="0" />
                </Field>
              </FormGrid>
              <FormGrid>
                <Field>
                  <Label>Address - Street</Label>
                  <Input {...register('addressStreet')} placeholder="Street" />
                </Field>
                <Field>
                  <Label>Address - City</Label>
                  <Input {...register('addressCity')} placeholder="City" />
                </Field>
                <Field>
                  <Label>Address - State</Label>
                  <Input {...register('addressState')} placeholder="State" />
                </Field>
                <Field>
                  <Label>Address - Zip Code</Label>
                  <Input {...register('addressZipCode')} placeholder="Zip Code" />
                </Field>
                <Field>
                  <Label>Address - Country</Label>
                  <Input {...register('addressCountry')} placeholder="Country" />
                </Field>
              </FormGrid>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setOpenAdd(false)}>Cancel</button>
                <Button type="submit" disabled={createMutation.isLoading}>
                  {createMutation.isLoading ? 'Creating...' : 'Create Agency'}
                </Button>
              </div>
            </form>
          </ModalContent>
        </ModalBackdrop>
      )}

      {openEdit && editAgency && (
        <ModalBackdrop onClick={() => setOpenEdit(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Edit Agency</h3>
              <button className="btn" onClick={() => setOpenEdit(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmitEdit(onUpdate)} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <FormGrid>
                <Field>
                  <Label>Agency Name</Label>
                  <Input {...registerEdit('name', { required: true })} placeholder="Agency Name" />
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
                  <Label>Contact Person</Label>
                  <Input {...registerEdit('contactPerson', { required: true })} placeholder="Contact Person" />
                </Field>
                <Field>
                  <Label>Email</Label>
                  <Input type="email" {...registerEdit('email')} placeholder="email@example.com" />
                </Field>
                <Field>
                  <Label>Phone</Label>
                  <Input {...registerEdit('phone', { required: true })} placeholder="Phone" />
                </Field>
                <Field>
                  <Label>Commission Percentage</Label>
                  <Input type="number" step="0.01" min="0" max="100" {...registerEdit('commissionPercentage')} placeholder="0" />
                </Field>
              </FormGrid>
              <FormGrid>
                <Field>
                  <Label>Address - Street</Label>
                  <Input {...registerEdit('addressStreet')} placeholder="Street" />
                </Field>
                <Field>
                  <Label>Address - City</Label>
                  <Input {...registerEdit('addressCity')} placeholder="City" />
                </Field>
                <Field>
                  <Label>Address - State</Label>
                  <Input {...registerEdit('addressState')} placeholder="State" />
                </Field>
                <Field>
                  <Label>Address - Zip Code</Label>
                  <Input {...registerEdit('addressZipCode')} placeholder="Zip Code" />
                </Field>
                <Field>
                  <Label>Address - Country</Label>
                  <Input {...registerEdit('addressCountry')} placeholder="Country" />
                </Field>
              </FormGrid>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="checkbox" {...registerEdit('isActive')} id="agency-active" />
                  <Label htmlFor="agency-active">Active</Label>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn" onClick={() => setOpenEdit(false)}>Cancel</button>
                  <Button type="submit" disabled={updateMutation.isLoading}>
                    {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </form>
          </ModalContent>
        </ModalBackdrop>
      )}

      {openExport && (
        <ModalBackdrop onClick={() => setOpenExport(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3>Export Agencies</h3>
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
            <h3>Delete Agencies</h3>
            <p>Are you sure you want to delete {selectedIds.length} selected agency(ies)? This action cannot be undone.</p>
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
