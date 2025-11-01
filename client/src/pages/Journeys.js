import React, { useState } from 'react';
import styled from 'styled-components';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { journeysAPI, organizationsAPI, contactsAPI } from '../services/api';

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
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

const Canvas = styled.div`
  position: relative;
  height: 420px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.bg};
`;

const Node = styled.div`
  position: absolute;
  min-width: 180px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.cardBg};
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
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
  width: 700px;
  max-width: 95vw;
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  padding: 20px;
`;

export default function Journeys() {
  const queryClient = useQueryClient();
  const [openCreate, setOpenCreate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [openRuns, setOpenRuns] = useState(false);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runs, setRuns] = useState([]);
  const [runsJourney, setRunsJourney] = useState({ id: null, name: '' });
  const [nodes, setNodes] = useState([]);
  const [drag, setDrag] = useState({ id: null, offsetX: 0, offsetY: 0 });
  const [openNodeEdit, setOpenNodeEdit] = useState(false);
  const [nodeToEdit, setNodeToEdit] = useState(null);
  const [nodeForm, setNodeForm] = useState({ title: '', subtitle: '', subject: '', content: '', delay: '', conditionType: '', conditionValue: '', targetJourney: '' });
  const [newNodeId, setNewNodeId] = useState(null);

  const [filters, setFilters] = useState({ org: 'all', status: 'all', search: '' });
  const { data: orgsRes } = useQuery(['organizations', { page: 1, limit: 200 }], () => organizationsAPI.getOrganizations({ page: 1, limit: 200 }).then(r => r.data));
  const organizations = orgsRes?.data || [];
  const { data: contactsRes } = useQuery(['contacts', { page: 1, limit: 500 }], () => contactsAPI.getContacts({ page: 1, limit: 500 }).then(r => r.data));
  const contacts = contactsRes?.data || [];

  const { data: res, isLoading } = useQuery(['journeys', filters], () => {
    const params = { page: 1, limit: 50 };
    if (filters.org !== 'all') params.organization = filters.org;
    if (filters.status !== 'all') params.status = filters.status;
    if (filters.search) params.search = filters.search;
    return journeysAPI.getJourneys(params).then(r => r.data);
  });
  const journeys = res?.data || [];
  const { data: allJourneysRes } = useQuery(['journeys_all_for_node_select'], () => journeysAPI.getJourneys({ page: 1, limit: 500 }).then(r => r.data));
  const allJourneys = allJourneysRes?.data || [];

  const createMutation = useMutation((payload) => journeysAPI.createJourney(payload).then(r => r.data), {
    onSuccess: () => {
      toast.success('Journey created');
      queryClient.invalidateQueries(['journeys']);
      setOpenCreate(false);
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to create journey')
  });

  const [form, setForm] = useState({ name: '', organization: '', status: 'draft', description: '' });
  const [selectedContacts, setSelectedContacts] = useState([]);
  const onCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.organization) {
      toast.error('Name and Organization are required');
      return;
    }
    if (!selectedContacts.length) {
      toast.error('Select at least one contact to create a journey');
      return;
    }
    createMutation.mutate({ ...form, nodes: [] }, {
      onSuccess: async (created) => {
        try {
          const newId = created?.data?._id;
          if (!newId) throw new Error('Journey not created');
          // Ensure active before enrollment
          if (form.status !== 'active') {
            await journeysAPI.activateJourney(newId);
          }
          await journeysAPI.enrollContacts(newId, { contacts: selectedContacts });
          toast.success('Journey created and contacts enrolled');
          queryClient.invalidateQueries(['journeys']);
          // auto-open enrolled contacts modal
          setRunsJourney({ id: newId, name: form.name });
          setRunsLoading(true);
          setOpenRuns(true);
          try {
            const resRuns = await journeysAPI.getJourneyRuns(newId);
            setRuns(resRuns.data?.data || []);
          } finally {
            setRunsLoading(false);
          }
          setOpenCreate(false);
          setSelectedContacts([]);
        } catch (err) {
          toast.error(err?.response?.data?.message || err.message || 'Failed to enroll contacts');
        }
      },
      onError: (e2) => toast.error(e2?.response?.data?.message || 'Failed to create journey')
    });
  };

  const nextPosition = () => {
    const base = 40;
    const step = 40;
    const count = nodes.length;
    return { left: base + ((count % 5) * 220), top: base + (Math.floor(count / 5) * 140) };
  };

  const addNode = (type) => {
    const id = `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const pos = nextPosition();
    const defaults = {
      email: { title: 'Email', subtitle: 'Sample email node', icon: 'fas fa-envelope', delay: '1m' },
      sms: { title: 'SMS', subtitle: 'Sample SMS node', icon: 'fas fa-sms', delay: '1m' },
      whatsapp: { title: 'WhatsApp', subtitle: 'Sample WhatsApp node', icon: 'fab fa-whatsapp', delay: '1m' },
      condition: { title: 'Condition', subtitle: 'Sample condition node', icon: 'fas fa-code-branch', delay: '1m' },
    };
    const newNode = { id, type, x: pos.left, y: pos.top, data: defaults[type] };
    setNodes(prev => [...prev, newNode]);
    // auto-open edit for the new node
    setNodeToEdit(newNode);
    setNodeForm({
      title: newNode.data?.title || '',
      subtitle: newNode.data?.subtitle || '',
      subject: '',
      content: '',
      delay: newNode.data?.delay || '1m',
      conditionType: '',
      conditionValue: '',
      targetJourney: '',
    });
    setOpenNodeEdit(true);
    setNewNodeId(newNode.id);
  };

  const removeNode = (id) => setNodes(prev => prev.filter(n => n.id !== id));

  const openEditNode = (id) => {
    const n = nodes.find(x => x.id === id);
    if (!n) return;
    setNodeToEdit(n);
    setNodeForm({
      title: n.data?.title || '',
      subtitle: n.data?.subtitle || '',
      subject: n.data?.subject || '',
      content: n.data?.content || '',
      delay: n.data?.delay || '',
      conditionType: n.data?.conditionType || '',
      conditionValue: n.data?.conditionValue || '',
      targetJourney: n.data?.targetJourney || ''
    });
    setOpenNodeEdit(true);
  };

  const saveEditNode = (e) => {
    e.preventDefault();
    if (!nodeToEdit) return;
    setNodes(prev => prev.map(n => n.id === nodeToEdit.id ? {
      ...n,
      data: {
        ...n.data,
        title: nodeForm.title,
        subtitle: nodeForm.subtitle,
        subject: nodeToEdit.type === 'email' ? nodeForm.subject : undefined,
        content: (nodeToEdit.type === 'email' || nodeToEdit.type === 'sms' || nodeToEdit.type === 'whatsapp') ? nodeForm.content : undefined,
        delay: nodeForm.delay,
        conditionType: nodeToEdit.type === 'condition' ? nodeForm.conditionType : undefined,
        conditionValue: nodeToEdit.type === 'condition' ? nodeForm.conditionValue : undefined,
        targetJourney: nodeForm.targetJourney || ''
      }
    } : n));
    setOpenNodeEdit(false);
    setNodeToEdit(null);
    setNewNodeId(null);
  };

  const closeEditNode = (cancelled) => {
    if (cancelled && newNodeId && nodeToEdit && nodeToEdit.id === newNodeId) {
      setNodes(prev => prev.filter(n => n.id !== newNodeId));
    }
    setOpenNodeEdit(false);
    setNodeToEdit(null);
    setNewNodeId(null);
  };

  const onMouseDownNode = (e, id) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDrag({ id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top });
  };

  const onMouseMoveCanvas = (e) => {
    if (!drag.id) return;
    const canvas = e.currentTarget.getBoundingClientRect();
    const newX = e.clientX - canvas.left - drag.offsetX;
    const newY = e.clientY - canvas.top - drag.offsetY;
    setNodes(prev => prev.map(n => n.id === drag.id ? { ...n, x: Math.max(0, newX), y: Math.max(0, newY) } : n));
  };

  const onMouseUpCanvas = () => setDrag({ id: null, offsetX: 0, offsetY: 0 });

  return (
    <div>
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Journey Builder</h2>
        <Button onClick={() => setOpenCreate(true)}><i className="fas fa-plus"></i> Create Journey</Button>
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Select value={filters.org} onChange={(e) => setFilters({ ...filters, org: e.target.value })}>
          <option value="all">All Organizations</option>
          {organizations.map(o => (
            <option key={o._id} value={o._id}>{o.name}</option>
          ))}
        </Select>
        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="draft">Draft</option>
        </Select>
        <Input placeholder="Search journeys..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
      </div>

      <Card style={{ marginTop: 16 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">Journey Canvas</div>
          <div className="journey-toolbar" style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => addNode('email')}><i className="fas fa-envelope"></i> Email</Button>
            <Button onClick={() => addNode('sms')}><i className="fas fa-sms"></i> SMS</Button>
            <Button onClick={() => addNode('whatsapp')}><i className="fab fa-whatsapp"></i> WhatsApp</Button>
            <Button onClick={() => addNode('condition')}><i className="fas fa-code-branch"></i> Condition</Button>
          </div>
        </div>
        <div className="card-body">
          <Canvas onMouseMove={onMouseMoveCanvas} onMouseUp={onMouseUpCanvas}>
            {nodes.map(n => (
              <Node key={n.id} style={{ left: n.x, top: n.y }} onMouseDown={(e) => onMouseDownNode(e, n.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><i className={n.data.icon}></i> {n.data.title}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ cursor: 'pointer' }} onClick={() => openEditNode(n.id)}><i className="fas fa-pencil-alt"></i></span>
                    <span style={{ cursor: 'pointer' }} onClick={() => removeNode(n.id)}><i className="fas fa-trash"></i></span>
                  </div>
                </div>
                <div style={{ marginTop: 6 }}>
                  <strong>{n.data.title}</strong>
                  <p>{n.data.subtitle}</p>
                  {!!n.data?.targetJourney && (
                    <p style={{ fontSize: 12, opacity: 0.85 }}>
                      For Journey: { (allJourneys.find(j => j._id === n.data.targetJourney)?.name) || n.data.targetJourney }
                    </p>
                  )}
                </div>
              </Node>
            ))}
          </Canvas>
        </div>
      </Card>

      <Card style={{ marginTop: 20 }}>
        <div className="card-header"><div className="card-title">Journeys</div></div>
        <div className="card-body">
          {isLoading ? <p>Loading...</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {journeys.map(j => (
                <div key={j._id} className="card" style={{ border: `1px solid var(--border)`, borderRadius: 12, padding: 12 }}>
                  <div className="card-title" style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{j.name}</span>
                    <span style={{ display: 'flex', gap: 8 }}>
                      <button className="btn" title="View Contacts" onClick={async () => {
                        try {
                          setRunsJourney({ id: j._id, name: j.name });
                          setRunsLoading(true);
                          setOpenRuns(true);
                          const res = await journeysAPI.getJourneyRuns(j._id);
                          setRuns(res.data?.data || []);
                        } catch (e) {
                          setRuns([]);
                        } finally {
                          setRunsLoading(false);
                        }
                      }}><i className="fas fa-users"></i></button>
                      <button className="btn" title="Delete" onClick={() => { setDeleteId(j._id); setOpenDelete(true); }}><i className="fas fa-trash"></i></button>
                    </span>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Org: {j.organization?.name || '-'}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Status: {j.status}</div>
                  <div style={{ marginTop: 8 }}>{j.description || '-'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {openCreate && (
        <ModalBackdrop onClick={() => setOpenCreate(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Create Journey</h3>
              <button className="btn" onClick={() => setOpenCreate(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={onCreate} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <FormGrid>
                <Field>
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Journey name" />
                </Field>
                <Field>
                  <Label>Organization</Label>
                  <Select value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })}>
                    <option value="">Select Organization</option>
                    {organizations.map(o => (
                      <option key={o._id} value={o._id}>{o.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>Status</Label>
                  <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </Field>
                <Field>
                  <Label>Description</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" />
                </Field>
                <Field>
                  <Label>Contacts (required)</Label>
                  <Select multiple size={4} value={selectedContacts} onChange={(e) => {
                    const opts = Array.from(e.target.options);
                    const vals = opts.filter(o => o.selected).map(o => o.value);
                    setSelectedContacts(vals);
                  }}>
                    {contacts.map(c => (
                      <option key={c._id} value={c._id}>{[c.title, c.firstName, c.lastName].filter(Boolean).join(' ') || c.name}</option>
                    ))}
                  </Select>
                </Field>
              </FormGrid>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setOpenCreate(false)}>Cancel</button>
                <Button type="submit" disabled={createMutation.isLoading}>{createMutation.isLoading ? 'Creating...' : 'Create & Enroll'}</Button>
              </div>
            </form>
          </ModalContent>
        </ModalBackdrop>
      )}

      {openRuns && (
        <ModalBackdrop onClick={() => setOpenRuns(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Enrolled Contacts — {runsJourney.name}</h3>
              <button className="btn" onClick={() => setOpenRuns(false)}><i className="fas fa-times"></i></button>
            </div>
            {runsLoading ? (
              <p>Loading...</p>
            ) : (
              <div style={{ marginTop: 12 }}>
                {(!runs || runs.length === 0) ? (
                  <p>No contacts enrolled yet.</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                    {runs.map(r => (
                      <li key={r._id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{[r.contact?.title, r.contact?.firstName, r.contact?.lastName].filter(Boolean).join(' ') || r.contact?.name || '—'}</div>
                            <div style={{ fontSize: 12, opacity: 0.8 }}>{r.contact?.email || r.contact?.phone || r.contact?.mobile || r.contact?.whatsapp || ''}</div>
                          </div>
                          <div style={{ fontSize: 12, opacity: 0.9 }}>
                            <span>Status: {r.status}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn" onClick={() => setOpenRuns(false)}>Close</button>
            </div>
          </ModalContent>
        </ModalBackdrop>
      )}

      {openDelete && deleteId && (
        <ModalBackdrop onClick={() => setOpenDelete(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Delete Journey</h3>
              <button className="btn" onClick={() => setOpenDelete(false)}><i className="fas fa-times"></i></button>
            </div>
            <p>Are you sure you want to delete this journey? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn" onClick={() => setOpenDelete(false)}>Cancel</button>
              <Button onClick={async () => {
                try {
                  await journeysAPI.deleteJourney(deleteId);
                  toast.success('Journey deleted');
                  setOpenDelete(false);
                  setDeleteId(null);
                  queryClient.invalidateQueries(['journeys']);
                } catch (e) {
                  toast.error(e?.response?.data?.message || 'Failed to delete journey');
                }
              }}>Delete</Button>
            </div>
          </ModalContent>
        </ModalBackdrop>
      )}

      {openNodeEdit && nodeToEdit && (
        <ModalBackdrop onClick={() => closeEditNode(true)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Edit Node - {nodeToEdit.data?.title}</h3>
              <button className="btn" onClick={() => closeEditNode(true)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={saveEditNode} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <FormGrid>
                <Field>
                  <Label>Title</Label>
                  <Input value={nodeForm.title} onChange={(e) => setNodeForm({ ...nodeForm, title: e.target.value })} placeholder="Title" />
                </Field>
                <Field>
                  <Label>Subtitle</Label>
                  <Input value={nodeForm.subtitle} onChange={(e) => setNodeForm({ ...nodeForm, subtitle: e.target.value })} placeholder="Subtitle" />
                </Field>
                <Field>
                  <Label>Target Journey</Label>
                  <Select value={nodeForm.targetJourney} onChange={(e) => setNodeForm({ ...nodeForm, targetJourney: e.target.value })}>
                    <option value="">None</option>
                    {allJourneys.map(j => (
                      <option key={j._id} value={j._id}>{j.name}</option>
                    ))}
                  </Select>
                </Field>
                {(nodeToEdit.type === 'email') && (
                  <>
                    <Field>
                      <Label>Subject</Label>
                      <Input value={nodeForm.subject} onChange={(e) => setNodeForm({ ...nodeForm, subject: e.target.value })} placeholder="Subject" />
                    </Field>
                    <Field>
                      <Label>Body</Label>
                      <Input value={nodeForm.content} onChange={(e) => setNodeForm({ ...nodeForm, content: e.target.value })} placeholder="Email body" />
                    </Field>
                  </>
                )}
                {(nodeToEdit.type === 'sms' || nodeToEdit.type === 'whatsapp') && (
                  <Field>
                    <Label>Message</Label>
                    <Input value={nodeForm.content} onChange={(e) => setNodeForm({ ...nodeForm, content: e.target.value })} placeholder="Message" />
                  </Field>
                )}
                {(nodeToEdit.type === 'condition') && (
                  <>
                    <Field>
                      <Label>Condition Type</Label>
                      <Select value={nodeForm.conditionType} onChange={(e) => setNodeForm({ ...nodeForm, conditionType: e.target.value })}>
                        <option value="">Select</option>
                        <option value="has_donated">Has Donated</option>
                        <option value="donation_amount_gt">Donation Amount &gt; X</option>
                        <option value="days_since_last_donation_gt">Days Since Last Donation &gt; X</option>
                      </Select>
                    </Field>
                    <Field>
                      <Label>Value</Label>
                      <Input value={nodeForm.conditionValue} onChange={(e) => setNodeForm({ ...nodeForm, conditionValue: e.target.value })} placeholder="Value" />
                    </Field>
                  </>
                )}
                <Field>
                  <Label>Delay (e.g., 2d, 3h)</Label>
                  <Input value={nodeForm.delay} onChange={(e) => setNodeForm({ ...nodeForm, delay: e.target.value })} placeholder="Delay" />
                </Field>
              </FormGrid>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => closeEditNode(true)}>Cancel</button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </ModalContent>
        </ModalBackdrop>
      )}
    </div>
  );
}
