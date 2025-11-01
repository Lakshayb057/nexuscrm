import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import { contactsAPI, organizationsAPI } from '../services/api';

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

const Contacts = () => {
  const queryClient = useQueryClient();
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editContact, setEditContact] = useState(null);

  const { data: res, isLoading } = useQuery(['contacts', { page: 1, limit: 50 }], () => contactsAPI.getContacts({ page: 1, limit: 50 }).then(r => r.data));
  const contacts = res?.data || [];

  const { data: orgsRes } = useQuery(['organizations', { page: 1, limit: 100 }], () => organizationsAPI.getOrganizations({ page: 1, limit: 100 }).then(r => r.data));
  const organizations = orgsRes?.data || [];

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      title: '',
      firstName: '',
      lastName: '',
      mobile: '',
      email: '',
      dateOfBirth: '',
      preferredLanguage: '',
      gender: '',
      profession: '',
      organization: '',
      city: '',
      zipCode: '',
      firstDonationSource: '',
      optInEmail: 'no',
      optInWhatsApp: 'no',
    }
  });

  const createMutation = useMutation((payload) => contactsAPI.createContact(payload).then(r => r.data), {
    onSuccess: () => {
      toast.success('Contact created successfully');
      queryClient.invalidateQueries(['contacts']);
      reset();
      setOpenAdd(false);
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Failed to create contact')
  });

  const onCreate = (values) => {
    const payload = {
      title: values.title || undefined,
      firstName: values.firstName,
      lastName: values.lastName,
      mobile: values.mobile,
      email: values.email,
      dateOfBirth: values.dateOfBirth || undefined,
      preferredLanguage: values.preferredLanguage || undefined,
      gender: values.gender || undefined,
      profession: values.profession || undefined,
      organization: values.organization || undefined,
      city: values.city || undefined,
      zipCode: values.zipCode || undefined,
      firstDonationSource: values.firstDonationSource || undefined,
      optInEmail: values.optInEmail === 'yes',
      optInWhatsApp: values.optInWhatsApp === 'yes',
    };
    if (!payload.firstName || !payload.mobile) {
      toast.error('First Name and Mobile are required');
      return;
    }
    createMutation.mutate(payload);
  };

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit } = useForm({
    defaultValues: {
      title: '', firstName: '', lastName: '', mobile: '', email: '', dateOfBirth: '',
      preferredLanguage: '', gender: '', profession: '', organization: '', city: '', zipCode: '',
      firstDonationSource: '', optInEmail: 'no', optInWhatsApp: 'no'
    }
  });

  const updateMutation = useMutation(({ id, data }) => contactsAPI.updateContact(id, data).then(r => r.data), {
    onSuccess: () => {
      toast.success('Contact updated successfully');
      queryClient.invalidateQueries(['contacts']);
      setOpenEdit(false);
      setEditContact(null);
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Failed to update contact')
  });

  const onOpenEdit = () => {
    if (selectedIds.length !== 1) return;
    const c = contacts.find(x => x._id === selectedIds[0]);
    if (!c) return;
    setEditContact(c);
    resetEdit({
      title: c.title || '', firstName: c.firstName || '', lastName: c.lastName || '', mobile: c.mobile || '', email: c.email || '',
      dateOfBirth: c.dateOfBirth ? c.dateOfBirth.substring(0,10) : '',
      preferredLanguage: c.preferredLanguage || '', gender: c.gender || '', profession: c.profession || '',
      organization: c.organization?._id || c.organization || '', city: c.city || '', zipCode: c.zipCode || '',
      firstDonationSource: c.firstDonationSource || '', optInEmail: c.optInEmail ? 'yes' : 'no', optInWhatsApp: c.optInWhatsApp ? 'yes' : 'no'
    });
    setOpenEdit(true);
  };

  const onUpdate = (values) => {
    const id = editContact._id;
    const payload = {
      title: values.title || undefined,
      firstName: values.firstName,
      lastName: values.lastName,
      mobile: values.mobile,
      email: values.email,
      dateOfBirth: values.dateOfBirth || undefined,
      preferredLanguage: values.preferredLanguage || undefined,
      gender: values.gender || undefined,
      profession: values.profession || undefined,
      organization: values.organization || undefined,
      city: values.city || undefined,
      zipCode: values.zipCode || undefined,
      firstDonationSource: values.firstDonationSource || undefined,
      optInEmail: values.optInEmail === 'yes',
      optInWhatsApp: values.optInWhatsApp === 'yes',
    };
    updateMutation.mutate({ id, data: payload });
  };

  const deleteMutation = useMutation((id) => contactsAPI.deleteContact(id), {
    onError: () => toast.error('Failed to delete a contact')
  });

  const onDelete = async () => {
    try {
      await Promise.all(selectedIds.map(id => deleteMutation.mutateAsync(id)));
      toast.success('Deleted selected contacts');
      setSelectedIds([]);
      queryClient.invalidateQueries(['contacts']);
      setConfirmDelete(false);
    } catch {}
  };

  const exportMutation = useMutation((vars) => contactsAPI.exportContacts(vars), {
    onSuccess: (response) => {
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contacts.xlsx';
      document.body.appendChild(a);
      a.click(); a.remove(); window.URL.revokeObjectURL(url);
      setOpenExport(false);
    },
    onError: () => toast.error('Export failed')
  });

  const toggleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div>
      <h2>Contacts</h2>
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
            <i className="fas fa-plus"></i> New Contact
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
                  <th><input type="checkbox" onChange={(e) => { if (e.target.checked) setSelectedIds(contacts.map(c => c._id)); else setSelectedIds([]); }} checked={selectedIds.length && selectedIds.length === contacts.length} aria-checked={selectedIds.length > 0 && selectedIds.length < contacts.length} /></th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th className="hide-sm">Preferred Language</th>
                  <th className="hide-sm">Gender</th>
                  <th className="hide-xs">Organization</th>
                  <th className="hide-xs">City</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map(c => (
                  <tr key={c._id}>
                    <td><input type="checkbox" checked={selectedIds.includes(c._id)} onChange={() => toggleSelect(c._id)} /></td>
                    <td>{[c.title, c.firstName, c.lastName].filter(Boolean).join(' ')}</td>
                    <td>{c.mobile}</td>
                    <td>{c.email || '-'}</td>
                    <td className="hide-sm">{c.preferredLanguage || '-'}</td>
                    <td className="hide-sm">{c.gender || '-'}</td>
                    <td className="hide-xs">{c.organization?.name || '-'}</td>
                    <td className="hide-xs">{c.city || '-'}</td>
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
              <h3>New Contact</h3>
              <button className="btn" onClick={() => setOpenAdd(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit(onCreate)} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <FormGrid>
                <Field>
                  <Label>Title</Label>
                  <Select {...register('title')}>
                    <option value="">Select Title</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Dr.">Dr.</option>
                  </Select>
                </Field>
                <Field>
                  <Label>First Name</Label>
                  <Input {...register('firstName', { required: true })} placeholder="First Name" />
                </Field>
                <Field>
                  <Label>Last Name</Label>
                  <Input {...register('lastName')} placeholder="Last Name" />
                </Field>
                <Field>
                  <Label>Mobile</Label>
                  <Input {...register('mobile', { required: true })} placeholder="Mobile" />
                </Field>
                <Field>
                  <Label>Email</Label>
                  <Input type="email" {...register('email')} placeholder="email@example.com" />
                </Field>
                <Field>
                  <Label>Date of Birth</Label>
                  <Input type="date" {...register('dateOfBirth')} />
                </Field>
                <Field>
                  <Label>Preferred Language</Label>
                  <Select {...register('preferredLanguage')}>
                    <option value="">Select Language</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Marathi">Marathi</option>
                    <option value="Bengali">Bengali</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Telugu">Telugu</option>
                  </Select>
                </Field>
                <Field>
                  <Label>Gender</Label>
                  <Select {...register('gender')}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </Select>
                </Field>
                <Field>
                  <Label>Profession</Label>
                  <Input {...register('profession')} placeholder="Profession" />
                </Field>
                <Field>
                  <Label>Organization</Label>
                  <Select {...register('organization')}>
                    <option value="">Select Organization</option>
                    {organizations.map(org => (
                      <option key={org._id} value={org._id}>{org.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>City</Label>
                  <Input {...register('city')} placeholder="City" />
                </Field>
                <Field>
                  <Label>Zip Code</Label>
                  <Input {...register('zipCode')} placeholder="Zip Code" />
                </Field>
                <Field>
                  <Label>First Donation Source</Label>
                  <Select {...register('firstDonationSource')}>
                    <option value="">Select Source</option>
                    <option value="Website">Website</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Event">Event</option>
                    <option value="Referral">Referral</option>
                    <option value="Other">Other</option>
                  </Select>
                </Field>
                <Field>
                  <Label>Opt-in Email</Label>
                  <Select {...register('optInEmail')}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </Select>
                </Field>
                <Field>
                  <Label>Opt-in WhatsApp</Label>
                  <Select {...register('optInWhatsApp')}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </Select>
                </Field>
              </FormGrid>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setOpenAdd(false)}>Cancel</button>
                <Button type="submit" disabled={createMutation.isLoading}>
                  {createMutation.isLoading ? 'Creating...' : 'Create Contact'}
                </Button>
              </div>
            </form>
          </ModalContent>
        </ModalBackdrop>
      )}

      {openEdit && editContact && (
        <ModalBackdrop onClick={() => setOpenEdit(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Edit Contact</h3>
              <button className="btn" onClick={() => setOpenEdit(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmitEdit(onUpdate)} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <FormGrid>
                <Field>
                  <Label>Title</Label>
                  <Select {...registerEdit('title')}>
                    <option value="">Select Title</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Dr.">Dr.</option>
                  </Select>
                </Field>
                <Field>
                  <Label>First Name</Label>
                  <Input {...registerEdit('firstName', { required: true })} placeholder="First Name" />
                </Field>
                <Field>
                  <Label>Last Name</Label>
                  <Input {...registerEdit('lastName')} placeholder="Last Name" />
                </Field>
                <Field>
                  <Label>Mobile</Label>
                  <Input {...registerEdit('mobile', { required: true })} placeholder="Mobile" />
                </Field>
                <Field>
                  <Label>Email</Label>
                  <Input type="email" {...registerEdit('email')} placeholder="email@example.com" />
                </Field>
                <Field>
                  <Label>Date of Birth</Label>
                  <Input type="date" {...registerEdit('dateOfBirth')} />
                </Field>
                <Field>
                  <Label>Preferred Language</Label>
                  <Select {...registerEdit('preferredLanguage')}>
                    <option value="">Select Language</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Marathi">Marathi</option>
                    <option value="Bengali">Bengali</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Telugu">Telugu</option>
                  </Select>
                </Field>
                <Field>
                  <Label>Gender</Label>
                  <Select {...registerEdit('gender')}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </Select>
                </Field>
                <Field>
                  <Label>Profession</Label>
                  <Input {...registerEdit('profession')} placeholder="Profession" />
                </Field>
                <Field>
                  <Label>Organization</Label>
                  <Select {...registerEdit('organization')}>
                    <option value="">Select Organization</option>
                    {organizations.map(org => (
                      <option key={org._id} value={org._id}>{org.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>City</Label>
                  <Input {...registerEdit('city')} placeholder="City" />
                </Field>
                <Field>
                  <Label>Zip Code</Label>
                  <Input {...registerEdit('zipCode')} placeholder="Zip Code" />
                </Field>
                <Field>
                  <Label>First Donation Source</Label>
                  <Select {...registerEdit('firstDonationSource')}>
                    <option value="">Select Source</option>
                    <option value="Website">Website</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Event">Event</option>
                    <option value="Referral">Referral</option>
                    <option value="Other">Other</option>
                  </Select>
                </Field>
                <Field>
                  <Label>Opt-in Email</Label>
                  <Select {...registerEdit('optInEmail')}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </Select>
                </Field>
                <Field>
                  <Label>Opt-in WhatsApp</Label>
                  <Select {...registerEdit('optInWhatsApp')}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </Select>
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
            <h3>Export Contacts</h3>
            <p>Select export format:</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn" onClick={() => setOpenExport(false)}>Cancel</button>
              <Button onClick={() => exportMutation.mutate({ ids: selectedIds.join(',') })}>Export XLS</Button>
            </div>
          </ModalContent>
        </ModalBackdrop>
      )}

      {confirmDelete && (
        <ModalBackdrop onClick={() => setConfirmDelete(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3>Delete Contacts</h3>
            <p>Are you sure you want to delete {selectedIds.length} selected contact(s)? This action cannot be undone.</p>
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

export default Contacts;
