import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import { organizationsAPI } from '../services/api';

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

const Organizations = () => {
  const queryClient = useQueryClient();
  const [openAdd, setOpenAdd] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOrg, setEditOrg] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: res, isLoading } = useQuery(['organizations', { page: 1, limit: 50 }], () =>
    organizationsAPI.getOrganizations({ page: 1, limit: 50 }).then(r => r.data)
  );
  const orgs = res?.data || [];

  const { register, handleSubmit, watch, reset, setValue } = useForm({
    defaultValues: {
      name: '',
      registrationNumber: '',
      contactEmail: '',
      phone: '',
      g80Status: 'pending',
      g80Number: '',
      addressStreet: '',
      addressCity: '',
      addressState: '',
      addressZipCode: '',
      addressCountry: 'India',
    }
  });

  // Edit form state and handlers
  const { register: registerEdit, handleSubmit: handleSubmitEdit, watch: watchEdit, reset: resetEdit, setValue: setValueEdit } = useForm({
    defaultValues: {
      name: '',
      registrationNumber: '',
      contactEmail: '',
      phone: '',
      g80Status: 'pending',
      g80Number: '',
      g80ApplicationNumber: '',
      addressStreet: '',
      addressCity: '',
      addressState: '',
      addressZipCode: '',
      addressCountry: 'India',
      website: '',
      description: '',
      isActive: true,
    }
  });
  const editStatus = watchEdit('g80Status');
  useEffect(() => {
    if (editStatus !== 'approved') setValueEdit('g80Number', '');
    if (editStatus !== 'pending') setValueEdit('g80ApplicationNumber', '');
  }, [editStatus, setValueEdit]);

  const updateMutation = useMutation(({ id, data }) => organizationsAPI.updateOrganization(id, data).then(r => r.data), {
    onSuccess: () => {
      toast.success('Organization updated successfully');
      queryClient.invalidateQueries(['organizations']);
      setOpenEdit(false);
      setEditOrg(null);
    },
    onError: (error) => {
      const message = error?.response?.data?.message || 'Failed to update organization';
      toast.error(message);
    }
  });

  const onOpenEdit = () => {
    if (selectedIds.length !== 1) return;
    const org = orgs.find(o => o._id === selectedIds[0]);
    if (!org) return;
    setEditOrg(org);
    resetEdit({
      name: org.name || '',
      registrationNumber: org.registrationNumber || '',
      contactEmail: org.contactEmail || '',
      phone: org.phone || '',
      g80Status: org.g80Status || 'pending',
      g80Number: org.g80Number || '',
      g80ApplicationNumber: org.g80ApplicationNumber || '',
      addressStreet: org.address?.street || '',
      addressCity: org.address?.city || '',
      addressState: org.address?.state || '',
      addressZipCode: org.address?.zipCode || '',
      addressCountry: org.address?.country || 'India',
      website: org.website || '',
      description: org.description || '',
      isActive: org.isActive !== false,
    });
    setOpenEdit(true);
  };

  const onUpdate = (values) => {
    const id = editOrg._id;
    const payload = {
      name: values.name,
      registrationNumber: values.registrationNumber,
      contactEmail: values.contactEmail,
      phone: values.phone,
      g80Status: values.g80Status,
      address: {
        street: values.addressStreet,
        city: values.addressCity,
        state: values.addressState,
        zipCode: values.addressZipCode,
        country: values.addressCountry,
      },
      website: values.website,
      description: values.description,
      isActive: values.isActive,
    };
    if (payload.g80Status === 'approved') {
      payload.g80Number = values.g80Number;
      if (!payload.g80Number) {
        toast.error('80G Certificate Number is required when status is Has 80G Certificate');
        return;
      }
    } else if (payload.g80Status === 'pending') {
      if (values.g80ApplicationNumber) payload.g80ApplicationNumber = values.g80ApplicationNumber;
    }
    updateMutation.mutate({ id, data: payload });
  };

  const deleteMutation = useMutation((id) => organizationsAPI.deleteOrganization(id), {
    onError: () => toast.error('Failed to delete an organization')
  });

  const onDelete = async () => {
    try {
      await Promise.all(selectedIds.map(id => deleteMutation.mutateAsync(id)));
      toast.success('Deleted selected organizations');
      setSelectedIds([]);
      queryClient.invalidateQueries(['organizations']);
      setConfirmDelete(false);
    } catch (e) {
      // errors already toasted per item
    }
  };
  const g80Status = watch('g80Status');
  useEffect(() => {
    if (g80Status !== 'approved') {
      setValue('g80Number', '');
    }
    if (g80Status !== 'pending') {
      setValue('g80ApplicationNumber', '');
    }
  }, [g80Status, setValue]);

  const createMutation = useMutation((payload) => organizationsAPI.createOrganization(payload).then(r => r.data), {
    onSuccess: () => {
      toast.success('Organization created successfully');
      queryClient.invalidateQueries(['organizations']);
      reset();
      setOpenAdd(false);
    },
    onError: (error) => {
      const message = error?.response?.data?.message || 'Failed to create organization';
      toast.error(message);
    }
  });

  const onCreate = (values) => {
    const payload = {
      name: values.name,
      registrationNumber: values.registrationNumber,
      contactEmail: values.contactEmail,
      phone: values.phone,
      g80Status: values.g80Status, // approved | pending | rejected
      address: {
        street: values.addressStreet,
        city: values.addressCity,
        state: values.addressState,
        zipCode: values.addressZipCode,
        country: values.addressCountry,
      }
    };

    if (payload.g80Status === 'approved') {
      payload.g80Number = values.g80Number;
      if (!payload.g80Number) {
        toast.error('80G Certificate Number is required when status is Has 80G Certificate');
        return;
      }
    } else if (payload.g80Status === 'pending') {
      if (values.g80ApplicationNumber) {
        payload.g80ApplicationNumber = values.g80ApplicationNumber;
      }
    }

    if (payload.g80Status === 'approved' && !payload.g80Number) {
      toast.error('80G Certificate Number is required when status is Has 80G Certificate');
      return;
    }

    createMutation.mutate(payload);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const exportMutation = useMutation(({ format, ids }) => organizationsAPI.exportOrganizations({ format, ids: ids.join(',') }), {
    onSuccess: (response, vars) => {
      const blob = new Blob([response.data], { type: vars.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = vars.format === 'pdf' ? 'organizations.pdf' : 'organizations.xlsx';
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
      <h2>Organizations</h2>
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
            <i className="fas fa-plus"></i> Add Organization
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
                    if (e.target.checked) setSelectedIds(orgs.map(o => o._id)); else setSelectedIds([]);
                  }} checked={selectedIds.length && selectedIds.length === orgs.length} aria-checked={selectedIds.length > 0 && selectedIds.length < orgs.length} /></th>
                  <th>Name</th>
                  <th className="hide-sm">Reg. No</th>
                  <th className="hide-sm">Email</th>
                  <th>Phone</th>
                  <th className="hide-sm">80G Status</th>
                  <th className="hide-sm">80G Number</th>
                  <th className="hide-xs">Address</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map(o => (
                  <tr key={o._id}>
                    <td>
                      <input type="checkbox" checked={selectedIds.includes(o._id)} onChange={() => toggleSelect(o._id)} />
                    </td>
                    <td>{o.name}</td>
                    <td className="hide-sm">{o.registrationNumber}</td>
                    <td className="hide-sm">{o.contactEmail}</td>
                    <td>{o.phone}</td>
                    <td className="hide-sm">{o.g80Status}</td>
                    <td className="hide-sm">{o.g80Number || '-'}</td>
                    <td className="hide-xs">{[o.address?.street, o.address?.city, o.address?.state, o.address?.zipCode, o.address?.country].filter(Boolean).join(', ')}</td>
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
              <h3>Add New Organization</h3>
              <button className="btn" onClick={() => setOpenAdd(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit(onCreate)} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <FormGrid>
                <Field>
                  <Label>Organization Name</Label>
                  <Input {...register('name', { required: true })} placeholder="Organization Name" />
                </Field>
                <Field>
                  <Label>Registration Number</Label>
                  <Input {...register('registrationNumber', { required: true })} placeholder="Registration Number" />
                </Field>
                <Field>
                  <Label>Contact Email</Label>
                  <Input type="email" {...register('contactEmail', { required: true })} placeholder="email@example.com" />
                </Field>
                <Field>
                  <Label>Phone Number</Label>
                  <Input {...register('phone', { required: true })} placeholder="Phone Number" />
                </Field>
                <Field>
                  <Label>80G Certificate Status</Label>
                  <Select {...register('g80Status')}>
                    <option value="approved">Has 80G Certificate</option>
                    <option value="rejected">Does Not Have 80G Certificate</option>
                    <option value="pending">Applied for 80G Certificate</option>
                  </Select>
                </Field>
                {g80Status === 'approved' && (
                  <Field>
                    <Label>80G Certificate Number (required)</Label>
                    <Input {...register('g80Number', { required: true })} placeholder="80G Certificate Number" />
                  </Field>
                )}
                {g80Status === 'pending' && (
                  <Field>
                    <Label>Application Number</Label>
                    <Input {...register('g80ApplicationNumber')} placeholder="Application Number" />
                  </Field>
                )}
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
                  {createMutation.isLoading ? 'Creating...' : 'Create Organization'}
                </Button>
              </div>
            </form>
          </ModalContent>
        </ModalBackdrop>
      )}

      {openExport && (
        <ModalBackdrop onClick={() => setOpenExport(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3>Export Organizations</h3>
            <p>Select export format:</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn" onClick={() => setOpenExport(false)}>Cancel</button>
              <Button onClick={() => exportMutation.mutate({ format: 'pdf', ids: selectedIds })}>Export PDF</Button>
              <Button onClick={() => exportMutation.mutate({ format: 'excel', ids: selectedIds })}>Export XLS</Button>
            </div>
          </ModalContent>
        </ModalBackdrop>
      )}

      {openEdit && editOrg && (
        <ModalBackdrop onClick={() => setOpenEdit(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Edit Organization</h3>
              <button className="btn" onClick={() => setOpenEdit(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmitEdit(onUpdate)} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <FormGrid>
                <Field>
                  <Label>Organization Name</Label>
                  <Input {...registerEdit('name', { required: true })} placeholder="Organization Name" />
                </Field>
                <Field>
                  <Label>Registration Number</Label>
                  <Input {...registerEdit('registrationNumber', { required: true })} placeholder="Registration Number" />
                </Field>
                <Field>
                  <Label>Contact Email</Label>
                  <Input type="email" {...registerEdit('contactEmail', { required: true })} placeholder="email@example.com" />
                </Field>
                <Field>
                  <Label>Phone Number</Label>
                  <Input {...registerEdit('phone', { required: true })} placeholder="Phone Number" />
                </Field>
                <Field>
                  <Label>80G Certificate Status</Label>
                  <Select {...registerEdit('g80Status')}>
                    <option value="approved">Has 80G Certificate</option>
                    <option value="rejected">Does Not Have 80G Certificate</option>
                    <option value="pending">Applied for 80G Certificate</option>
                  </Select>
                </Field>
                {editStatus === 'approved' && (
                  <Field>
                    <Label>80G Certificate Number (required)</Label>
                    <Input {...registerEdit('g80Number', { required: true })} placeholder="80G Certificate Number" />
                  </Field>
                )}
                {editStatus === 'pending' && (
                  <Field>
                    <Label>Application Number</Label>
                    <Input {...registerEdit('g80ApplicationNumber')} placeholder="Application Number" />
                  </Field>
                )}
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
                  <input type="checkbox" {...registerEdit('isActive')} id="org-active" />
                  <Label htmlFor="org-active">Active</Label>
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

      {confirmDelete && (
        <ModalBackdrop onClick={() => setConfirmDelete(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3>Delete Organizations</h3>
            <p>Are you sure you want to delete {selectedIds.length} selected organization(s)? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <Button onClick={onDelete}>Delete</Button>
            </div>
          </ModalContent>
        </ModalBackdrop>
      )}
    </div>
  );
};

export default Organizations;
