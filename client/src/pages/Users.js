import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI, organizationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';

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
  width: 560px;
  max-width: 90vw;
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
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
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

export default function Users() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [permUser, setPermUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  const { data: usersRes, isLoading: loadingUsers } = useQuery(['users'], () => usersAPI.getUsers().then(r => r.data));
  const { data: orgsRes, isLoading: loadingOrgs } = useQuery(['organizations', { page: 1, limit: 100 }], () => organizationsAPI.getOrganizations({ page: 1, limit: 100 }).then(r => r.data));

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'admin',
      organization: '',
      manages: [],
    }
  });
  const role = watch('role');
  const [confirmAdmin, setConfirmAdmin] = useState(false);

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, watch: watchEdit, setValue: setEditValue } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'user',
      organization: '',
      manages: [],
    }
  });
  const editRole = watchEdit('role');

  const createMutation = useMutation((payload) => usersAPI.createUser(payload).then(r => r.data), {
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      reset();
      setIsOpen(false);
      toast.success('User created successfully');
    }
  });

  const updateMutation = useMutation(({ id, data }) => usersAPI.updateUser(id, data).then(r => r.data), {
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setEditingUser(null);
      toast.success('User updated successfully');
    },
    onError: (error) => {
      const message = error?.response?.data?.message || 'Failed to update user';
      toast.error(message);
    }
  });

  const deleteMutation = useMutation((id) => usersAPI.deleteUser(id).then(r => r.data), {
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      const message = error?.response?.data?.message || 'Failed to delete user';
      toast.error(message);
    }
  });

  const onSubmit = (values) => {
    // For non-admins (defensive), enforce their organization
    const payload = { ...values };
    if (user.role !== 'admin') {
      payload.role = 'user';
      payload.organization = user.organization?._id || user.organization;
    }
    // If role is not user, drop empty organization to avoid ObjectId cast errors
    if (payload.role !== 'user' && !payload.organization) {
      delete payload.organization;
    }
    if (payload.role === 'admin') {
      setConfirmAdmin(true);
      return;
    }
    createMutation.mutate(payload, {
      onError: (error) => {
        const message = error?.response?.data?.message || 'Failed to create user';
        toast.error(message);
      }
    });
  };

  const proceedAdminCreate = () => {
    const values = {
      firstName: watch('firstName'),
      lastName: watch('lastName'),
      email: watch('email'),
      password: watch('password'),
      role: 'admin',
      organization: watch('organization'),
      manages: watch('manages'),
    };
    if (!values.organization) {
      delete values.organization;
    }
    createMutation.mutate(values, {
      onError: (error) => {
        const message = error?.response?.data?.message || 'Failed to create user';
        toast.error(message);
      }
    });
    setConfirmAdmin(false);
  };

  const users = usersRes?.data || usersRes?.users || usersRes?.data || [];
  const organizations = orgsRes?.data || [];

  return (
    <div>
      <h1>User Management</h1>
      <Toolbar>
        <div></div>
        <div>
          <Button onClick={() => setIsOpen(true)}><i className="fas fa-user-plus"></i> New User</Button>
        </div>
      </Toolbar>

      <section style={{ marginTop: 16 }}>
        <Card>
          <h3>Users</h3>
          {loadingUsers ? (
            <p>Loading users...</p>
          ) : (
            <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Name</th>
                  <th style={{ textAlign: 'left' }}>Email</th>
                  <th style={{ textAlign: 'left' }}>Role</th>
                  <th style={{ textAlign: 'left' }}>Organization</th>
                  <th style={{ textAlign: 'left' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>{u.firstName} {u.lastName}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.organization?.name || '-'}</td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button className="btn" title="Edit" onClick={() => {
                        setEditingUser(u);
                        resetEdit({
                          firstName: u.firstName || '',
                          lastName: u.lastName || '',
                          email: u.email || '',
                          password: '',
                          role: u.role || 'user',
                          organization: u.organization?._id || u.organization || '',
                          manages: u.manages || [],
                        });
                      }}><i className="fas fa-pen"></i></button>
                      <button className="btn" title="Delete" onClick={() => setDeletingUser(u)}><i className="fas fa-trash"></i></button>
                      {user.role === 'admin' && u.role === 'user' && (
                        <button className="btn" title="Permissions" onClick={() => setPermUser(u)}>
                          <i className="fas fa-key"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </Card>
      </section>

      {isOpen && (
        <ModalBackdrop onClick={() => setIsOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Create New User</h3>
              <button className="btn" onClick={() => setIsOpen(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <FormGrid>
                <Field>
                  <Label>First Name</Label>
                  <Input {...register('firstName', { required: true })} placeholder="First Name" />
                </Field>
                <Field>
                  <Label>Last Name</Label>
                  <Input {...register('lastName', { required: true })} placeholder="Last Name" />
                </Field>
                <Field>
                  <Label>Email</Label>
                  <Input type="email" {...register('email', { required: true })} placeholder="email@example.com" />
                </Field>
                <Field>
                  <Label>Password</Label>
                  <Input type="password" {...register('password', { required: true, minLength: 6 })} placeholder="Password" />
                </Field>
                <Field>
                  <Label>Role</Label>
                  <Select {...register('role')} disabled={user.role !== 'admin'}>
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </Select>
                </Field>
                {role === 'user' && (
                  <Field>
                    <Label>Organization</Label>
                    <Select {...register('organization', { required: role === 'user' })} disabled={user.role !== 'admin'}>
                      <option value="">Select organization</option>
                      {loadingOrgs ? (
                        <option value="" disabled>Loading...</option>
                      ) : (
                        organizations.map(org => (
                          <option key={org._id} value={org._id}>{org.name}</option>
                        ))
                      )}
                    </Select>
                  </Field>
                )}
                {role === 'manager' && (
                  <Field style={{ gridColumn: '1 / -1' }}>
                    <Label>Users to Manage</Label>
                    <Select multiple {...register('manages')}>
                      {users
                        .filter(u => u.role !== 'admin')
                        .map(u => (
                          <option key={u._id} value={u._id}>
                            {u.firstName} {u.lastName} ({u.email})
                          </option>
                        ))}
                    </Select>
                  </Field>
                )}
              </FormGrid>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn" onClick={() => setIsOpen(false)}>Cancel</button>
                <Button type="submit" disabled={createMutation.isLoading}>
                  {createMutation.isLoading ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
            {createMutation.isError && (
              <p style={{ color: 'red' }}>{createMutation.error?.response?.data?.message || 'Failed to create user'}</p>
            )}
          </ModalContent>
        </ModalBackdrop>
      )}

      {confirmAdmin && (
        <ModalBackdrop onClick={() => setConfirmAdmin(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Admin Creation</h3>
            <p>Are you sure you want to create a new admin? Admins have full access to the CRM.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn" onClick={() => setConfirmAdmin(false)}>Cancel</button>
              <Button onClick={proceedAdminCreate}>Yes, Create Admin</Button>
            </div>
          </ModalContent>
        </ModalBackdrop>
      )}

      {editingUser && (
        <ModalBackdrop onClick={() => setEditingUser(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Edit User</h3>
              <button className="btn" onClick={() => setEditingUser(null)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmitEdit((vals) => {
              const payload = { ...vals };
              if (!payload.password) delete payload.password;
              if (payload.role !== 'user' && !payload.organization) delete payload.organization;
              updateMutation.mutate({ id: editingUser._id, data: payload });
            })} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <FormGrid>
                <Field>
                  <Label>First Name</Label>
                  <Input {...registerEdit('firstName', { required: true })} />
                </Field>
                <Field>
                  <Label>Last Name</Label>
                  <Input {...registerEdit('lastName', { required: true })} />
                </Field>
                <Field>
                  <Label>Email</Label>
                  <Input type="email" {...registerEdit('email', { required: true })} />
                </Field>
                <Field>
                  <Label>Password</Label>
                  <Input type="password" placeholder="Leave blank to keep current" {...registerEdit('password', { minLength: 6 })} />
                </Field>
                <Field>
                  <Label>Role</Label>
                  <Select {...registerEdit('role')} disabled={user.role !== 'admin'}>
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </Select>
                </Field>
                {editRole === 'user' && (
                  <Field>
                    <Label>Organization</Label>
                    <Select {...registerEdit('organization')} disabled={user.role !== 'admin'}>
                      <option value="">Select organization</option>
                      {loadingOrgs ? (
                        <option value="" disabled>Loading...</option>
                      ) : (
                        organizations.map(org => (
                          <option key={org._id} value={org._id}>{org.name}</option>
                        ))
                      )}
                    </Select>
                  </Field>
                )}
              </FormGrid>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn" onClick={() => setEditingUser(null)}>Cancel</button>
                <Button type="submit" disabled={updateMutation.isLoading}>
                  {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </ModalContent>
        </ModalBackdrop>
      )}

      {permUser && user.role === 'admin' && permUser.role === 'user' && (
        <PermissionsModal user={permUser} onClose={() => setPermUser(null)} onSaved={() => { setPermUser(null); queryClient.invalidateQueries(['users']); }} />
      )}

      {deletingUser && (
        <ModalBackdrop onClick={() => setDeletingUser(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3>Delete User</h3>
            <p>Are you sure you want to delete <strong>{deletingUser.firstName} {deletingUser.lastName}</strong> ({deletingUser.email})? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn" onClick={() => setDeletingUser(null)}>Cancel</button>
              <Button onClick={() => { deleteMutation.mutate(deletingUser._id, { onSuccess: () => setDeletingUser(null) }); }}>
                Delete
              </Button>
            </div>
          </ModalContent>
        </ModalBackdrop>
      )}
    </div>
  );
}

function PermissionsModal({ user, onClose, onSaved }) {
  const [perms, setPerms] = useState(() => user.permissions || {});
  const queryClient = useQueryClient();
  const mutation = useMutation(({ id, data }) => usersAPI.updateUser(id, data).then(r => r.data), {
    onSuccess: () => {
      toast.success('Permissions updated');
      onSaved();
    },
    onError: (e) => {
      toast.error(e?.response?.data?.message || 'Failed to update permissions');
    }
  });

  const resources = ['dashboard','organizations','agencies','channels','contacts','monthlyDonations','donations','payments','receipts','campaigns','journeys','reports','users','settings'];
  const actions = ['read','create','update','delete','export'];

  const toggle = (res, act) => {
    setPerms(prev => {
      const next = { ...prev };
      const resObj = { ...(next[res] || {}) };
      resObj[act] = !resObj[act];
      next[res] = resObj;
      return next;
    });
  };

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Permissions for {user.firstName} {user.lastName}</h3>
          <button className="btn" onClick={onClose}><i className="fas fa-times"></i></button>
        </div>
        <div style={{ maxHeight: 400, overflow: 'auto', marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Resource</th>
                {actions.map(act => (
                  <th key={act} style={{ textAlign: 'center', padding: '6px 4px' }}>{act}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resources.map(res => (
                <tr key={res}>
                  <td style={{ padding: '6px 4px' }}>{res}</td>
                  {actions.map(act => (
                    <td key={act} style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={!!perms?.[res]?.[act]} onChange={() => toggle(res, act)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <Button onClick={() => mutation.mutate({ id: user._id, data: { permissions: perms } })} disabled={mutation.isLoading}>
            {mutation.isLoading ? 'Saving...' : 'Save Permissions'}
          </Button>
        </div>
      </ModalContent>
    </ModalBackdrop>
  );
}
