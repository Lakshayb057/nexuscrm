import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { reportsAPI, organizationsAPI, contactsAPI, campaignsAPI } from '../services/api';
import '../styles/reports.css';

export default function Reports() {
  const [orgs, setOrgs] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [search, setSearch] = useState('');
  const [createdReport, setCreatedReport] = useState(null);
  const [runResults, setRunResults] = useState([]);
  const [exportFormat, setExportFormat] = useState('xls'); // csv | xls | doc
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportReportId, setExportReportId] = useState(null);
  const canvasRef = useRef(null);

  // Modal local state
  const [modalOpen, setModalOpen] = useState(false);
  const [newReportName, setNewReportName] = useState('My Report');
  const [newReportType, setNewReportType] = useState('donation');
  const [newReportOrg, setNewReportOrg] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Filter form states
  const [filterDonor, setFilterDonor] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterDonationType, setFilterDonationType] = useState('');

  // Option lists
  const [donors, setDonors] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  // Fields and components selection
  const availableFields = useMemo(() => [
    'Donor Name','Donation Amount','Donation Date','Organization','Campaign','Payment Method','80G Status','City','Donor Type'
  ], []);
  const [selectedFields, setSelectedFields] = useState([]);
  const [componentToggles, setComponentToggles] = useState({ c1: true, c2: true, c3: true });

  const loadOrganizations = async () => {
    try {
      const res = await organizationsAPI.getOrganizations({ limit: 100 });
      setOrgs(res.data?.data || []);
    } catch (e) {
      // noop
    }
  };

  const loadDonors = async () => {
    try {
      const res = await contactsAPI.getContacts({ limit: 200 });
      setDonors(res.data?.data || []);
    } catch (e) {}
  };

  const loadCampaigns = async () => {
    try {
      const res = await campaignsAPI.getCampaigns({ limit: 200 });
      setCampaigns(res.data?.data || []);
    } catch (e) {}
  };

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedType !== 'all') params.type = selectedType;
      if (selectedOrg !== 'all') params.organization = selectedOrg;
      if (search) params.search = search;
      const res = await reportsAPI.getReports(params);
      setReports(res.data?.data || []);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedOrg, search]);

  useEffect(() => {
    loadOrganizations();
    loadDonors();
    loadCampaigns();
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const presetComponents = useMemo(() => ([
    {
      id: 'c1',
      kind: 'table',
      title: 'Donation Summary',
      queryKey: 'donation_summary_by_month',
      groupBy: 'month',
      metrics: ['sumAmount', 'count'],
      sort: { _id: 1 }
    },
    {
      id: 'c2',
      kind: 'bar',
      title: 'Donor Demographics',
      queryKey: 'donor_demographics',
      groupBy: 'city',
      metrics: ['sumAmount', 'count'],
      sort: { totalAmount: -1 }
    },
    {
      id: 'c3',
      kind: 'bar',
      title: 'Campaign Performance',
      queryKey: 'campaign_performance',
      groupBy: 'campaign',
      metrics: ['sumAmount', 'count'],
      sort: { totalAmount: -1 }
    }
  ]), []);

  const handleSaveReport = async () => {
    if (!newReportName || !newReportType || !newReportOrg) return;
    setSaving(true);
    try {
      const components = presetComponents.filter(c => componentToggles[c.id]);
      const filters = {
        organization: newReportOrg,
        donor: filterDonor || undefined,
        campaignId: filterCampaign || undefined,
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined,
        paymentMethod: filterPaymentMethod || undefined,
        type: filterDonationType || undefined,
      };
      if (isEditing && createdReport?._id) {
        const res = await reportsAPI.updateReport(createdReport._id, {
          name: newReportName,
          type: newReportType,
          organization: newReportOrg,
          filters,
          fields: selectedFields,
          components,
        });
        const report = res.data?.data;
        setCreatedReport(report);
        await loadReports();
        setModalOpen(false);
        await runReport(report._id);
      } else {
        const res = await reportsAPI.createReport({
          name: newReportName,
          type: newReportType,
          organization: newReportOrg,
          filters,
          fields: selectedFields,
          components,
        });
        const report = res.data?.data;
        setCreatedReport(report);
        await loadReports();
        setModalOpen(false);
        await runReport(report._id);
      }
    } catch (e) {
      // noop
    } finally {
      setSaving(false);
    }
  };

  const runReport = async (id) => {
    setRunning(true);
    try {
      const res = await reportsAPI.runReport(id);
      setRunResults(res.data?.data || []);
      // auto-scroll to results
      setTimeout(() => {
        if (canvasRef.current) {
          canvasRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 0);
    } catch (e) {
      // noop
    } finally {
      setRunning(false);
    }
  };

  const formatINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await reportsAPI.deleteReport(id);
      if (createdReport && createdReport._id === id) {
        setCreatedReport(null);
        setRunResults([]);
      }
      await loadReports();
    } catch (e) {
      // noop
    }
  };

  const saveComponents = async (report, components) => {
    if (!report?._id) return;
    try {
      const res = await reportsAPI.updateReport(report._id, { components });
      setCreatedReport(res.data?.data || report);
      await runReport(report._id);
    } catch (e) {
      // noop
    }
  };

  const handleEditComponent = async (idx) => {
    const report = createdReport;
    if (!report) return;
    const current = report.components?.[idx];
    const title = window.prompt('Component title', current?.title || '');
    if (title == null) return;
    const components = [...(report.components || [])];
    components[idx] = { ...components[idx], title };
    await saveComponents(report, components);
  };

  const handleRemoveComponent = async (idx) => {
    const report = createdReport;
    if (!report) return;
    const components = (report.components || []).filter((_, i) => i !== idx);
    await saveComponents(report, components);
  };

  return (
    <div id="reports-view" className="view">
      <div className="page-title">
        <h2>Reports & Analytics</h2>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <i className="fas fa-plus" /> Create Report
        </button>
      </div>

      <div className="filter-bar">
        <select className="filter-item" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
          <option value="all">All Report Types</option>
          <option value="donation">Donation Reports</option>
          <option value="donor">Donor Reports</option>
          <option value="campaign">Campaign Reports</option>
          <option value="financial">Financial Reports</option>
        </select>
        <select className="filter-item" value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)}>
          <option value="all">All Organizations</option>
          {orgs.map(o => (
            <option key={o._id} value={o._id}>{o.name}</option>
          ))}
        </select>
        <input type="text" className="filter-item" placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') loadReports(); }} />
        <button className="btn btn-primary btn-sm" onClick={loadReports}><i className="fas fa-search" /> Search</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Report Builder</div>
        </div>
        <div className="card-body">
          <div className="report-builder">
            <div className="report-fields">
              <h4 style={{ marginBottom: 15 }}>Available Fields</h4>
              <div className="field-item" draggable>Donor Name</div>
              <div className="field-item" draggable>Donation Amount</div>
              <div className="field-item" draggable>Donation Date</div>
              <div className="field-item" draggable>Organization</div>
              <div className="field-item" draggable>Campaign</div>
              <div className="field-item" draggable>Payment Method</div>
              <div className="field-item" draggable>80G Status</div>
              <div className="field-item" draggable>City</div>
              <div className="field-item" draggable>Donor Type</div>
            </div>

            <div className="report-canvas" ref={canvasRef}>
              <h4 style={{ marginBottom: 15 }}>Report Canvas</h4>

              <div className="report-component">
                <div className="report-component-header">
                  <div>Donation Summary</div>
                  <div className="component-actions">
                    <div className="component-action" onClick={() => handleEditComponent(0)}><i className="fas fa-pencil-alt" /></div>
                    <div className="component-action" onClick={() => handleRemoveComponent(0)}><i className="fas fa-trash" /></div>
                  </div>
                </div>
                <p>Table showing donation summary by month</p>
                {/* Results table if available */}
                {runResults[0]?.rows?.length ? (
                  <div className="table-responsive">
                  <table className="table" style={{ width: '100%', marginTop: 10 }}>
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Donations</th>
                        <th>Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runResults[0].rows.map((r, idx) => (
                        <tr key={idx}>
                          <td>{r.key}</td>
                          <td>{r.count || 0}</td>
                          <td>{formatINR(r.sumAmount || r.totalAmount || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                ) : null}
              </div>

              <div className="report-component">
                <div className="report-component-header">
                  <div>Donor Demographics</div>
                  <div className="component-actions">
                    <div className="component-action" onClick={() => handleEditComponent(1)}><i className="fas fa-pencil-alt" /></div>
                    <div className="component-action" onClick={() => handleRemoveComponent(1)}><i className="fas fa-trash" /></div>
                  </div>
                </div>
                <p>Chart showing donor city distribution</p>
                {runResults[1]?.rows?.length ? (
                  <div className="table-responsive">
                  <table className="table" style={{ width: '100%', marginTop: 10 }}>
                    <thead>
                      <tr>
                        <th>City</th>
                        <th>Unique Donors</th>
                        <th>Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runResults[1].rows.map((r, idx) => (
                        <tr key={idx}>
                          <td>{r.key}</td>
                          <td>{r.donorCount || 0}</td>
                          <td>{formatINR(r.sumAmount || r.totalAmount || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                ) : null}
              </div>

              <div className="report-component">
                <div className="report-component-header">
                  <div>Campaign Performance</div>
                  <div className="component-actions">
                    <div className="component-action" onClick={() => handleEditComponent(2)}><i className="fas fa-pencil-alt" /></div>
                    <div className="component-action" onClick={() => handleRemoveComponent(2)}><i className="fas fa-trash" /></div>
                  </div>
                </div>
                <p>Comparison of campaigns by funds raised</p>
                {runResults[2]?.rows?.length ? (
                  <div className="table-responsive">
                  <table className="table" style={{ width: '100%', marginTop: 10 }}>
                    <thead>
                      <tr>
                        <th>Campaign</th>
                        <th>Donations</th>
                        <th>Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runResults[2].rows.map((r, idx) => (
                        <tr key={idx}>
                          <td>{r.campaignName || r.key}</td>
                          <td>{r.count || 0}</td>
                          <td>{formatINR(r.sumAmount || r.totalAmount || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                ) : null}
              </div>

              {/* Selected Fields Preview */}
              {Array.isArray(runResults) && runResults.length > 0 && (() => {
                const preview = runResults.find(x => (x.title || '').toLowerCase().includes('selected fields'));
                if (!preview || !Array.isArray(preview.rows) || preview.rows.length === 0) return null;
                const headers = Array.isArray(preview.headers) && preview.headers.length
                  ? preview.headers
                  : Object.keys(preview.rows[0] || {});
                return (
                  <div className="report-component">
                    <div className="report-component-header">
                      <div>Selected Fields (preview)</div>
                    </div>
                    <div className="table-responsive">
                    <table className="table" style={{ width: '100%', marginTop: 10 }}>
                      <thead>
                        <tr>
                          {headers.map(h => (<th key={h}>{h}</th>))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row, ridx) => (
                          <tr key={ridx}>
                            {headers.map(h => (<td key={h}>{row[h] != null ? String(row[h]) : ''}</td>))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Showing up to 50 rows preview. Download to get full data.</div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', gap: 10, marginTop: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={handleSaveReport} disabled={saving}>
                  {saving ? (<><i className="fas fa-spinner fa-spin" /> Saving...</>) : (<><i className="fas fa-save" /> Save Report</>)}
                </button>
                {createdReport ? (
                  <>
                    <button className="btn btn-ghost btn-sm" onClick={() => runReport(createdReport._id)}>
                      <i className="fas fa-play" /> Run
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => runReport(createdReport._id)}>
                      <i className="fas fa-eye" /> View
                    </button>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setExportReportId(createdReport._id); setExportModalOpen(true); }}>
                        <i className="fas fa-download" /> Download
                      </button>
                    </div>
                  </>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={async () => {
                    // Create on-the-fly then run and show
                    await handleSaveReport();
                    if (createdReport?._id) {
                      await runReport(createdReport._id);
                    }
                  }}>
                    <i className="fas fa-eye" /> View
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <div className="card-title">Sample Reports</div>
        </div>
        <div className="card-body">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="form-row">
              {reports.slice(0, 3).map((r) => (
                <div key={r._id} className="card" style={{ flex: 1, minWidth: 300 }}>
                  <div className="card-header">
                    <div className="card-title">{r.name}</div>
                  </div>
                  <div className="card-body">
                    <p>Type: {r.type}</p>
                    <button className="btn btn-primary btn-sm" onClick={() => { setCreatedReport(r); runReport(r._id); }}>View Report</button>
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} onClick={() => { setExportReportId(r._id); setExportModalOpen(true); }}>
                      <i className="fas fa-download" />
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} onClick={() => {
                      // Prefill modal for editing
                      setIsEditing(true);
                      setNewReportName(r.name);
                      setNewReportType(r.type);
                      setNewReportOrg(r.organization?._id || r.organization);
                      const f = r.filters || {};
                      setFilterDonor(f.donor || '');
                      setFilterCampaign(f.campaignId || '');
                      setFilterDateFrom(f.dateFrom ? String(f.dateFrom).slice(0,10) : '');
                      setFilterDateTo(f.dateTo ? String(f.dateTo).slice(0,10) : '');
                      setFilterPaymentMethod(f.paymentMethod || '');
                      setFilterDonationType(f.type || '');
                      setSelectedFields(r.fields || []);
                      const toggles = { c1: false, c2: false, c3: false };
                      (r.components || []).forEach(c => { toggles[c.id] = true; });
                      setComponentToggles(toggles);
                      setCreatedReport(r);
                      setModalOpen(true);
                    }}>
                      <i className="fas fa-pen" /> Edit
                    </button>
                    <button className="btn btn-danger btn-sm" style={{ marginLeft: 8 }} onClick={() => handleDeleteReport(r._id)}>
                      <i className="fas fa-trash" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="modal" onClick={() => { setModalOpen(false); setIsEditing(false); }}>
          <div className="modal-dialog">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h5 className="modal-title">{isEditing ? 'Edit Report' : 'Create Report'}</h5>
                <button className="close" onClick={() => { setModalOpen(false); setIsEditing(false); }}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name</label>
                  <input className="form-control" value={newReportName} onChange={(e) => setNewReportName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select className="form-control" value={newReportType} onChange={(e) => setNewReportType(e.target.value)}>
                    <option value="donation">Donation</option>
                    <option value="donor">Donor</option>
                    <option value="campaign">Campaign</option>
                    <option value="financial">Financial</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Organization</label>
                  <select className="form-control" value={newReportOrg} onChange={(e) => setNewReportOrg(e.target.value)}>
                    <option value="">Select organization</option>
                    {orgs.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
                  </select>
                </div>

                <div className="settings-tabs" style={{ marginTop: 10 }}>
                  <div className="settings-tab active">Filters</div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Donor</label>
                    <select className="form-control" value={filterDonor} onChange={(e) => setFilterDonor(e.target.value)}>
                      <option value="">All Donors</option>
                      {donors.map(d => <option key={d._id} value={d._id}>{d.firstName} {d.lastName}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Campaign</label>
                    <select className="form-control" value={filterCampaign} onChange={(e) => setFilterCampaign(e.target.value)}>
                      <option value="">All Campaigns</option>
                      {campaigns.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date From</label>
                    <input type="date" className="form-control" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Date To</label>
                    <input type="date" className="form-control" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Payment Method</label>
                    <select className="form-control" value={filterPaymentMethod} onChange={(e) => setFilterPaymentMethod(e.target.value)}>
                      <option value="">All</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="debit_card">Debit Card</option>
                      <option value="upi">UPI</option>
                      <option value="net_banking">Net Banking</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Donation Type</label>
                    <select className="form-control" value={filterDonationType} onChange={(e) => setFilterDonationType(e.target.value)}>
                      <option value="">All</option>
                      <option value="one-time">One-time</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                <div className="settings-tabs" style={{ marginTop: 10 }}>
                  <div className="settings-tab active">Fields</div>
                </div>
                <div className="form-row">
                  {availableFields.map(f => (
                    <label key={f} className="form-group" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="checkbox" checked={selectedFields.includes(f)} onChange={(e) => {
                        if (e.target.checked) setSelectedFields(prev => [...prev, f]);
                        else setSelectedFields(prev => prev.filter(x => x !== f));
                      }} />
                      <span>{f}</span>
                    </label>
                  ))}
                </div>

                <div className="settings-tabs" style={{ marginTop: 10 }}>
                  <div className="settings-tab active">Components</div>
                </div>
                <div className="form-row">
                  {presetComponents.map(c => (
                    <label key={c.id} className="form-group" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="checkbox" checked={!!componentToggles[c.id]} onChange={(e) => setComponentToggles(prev => ({ ...prev, [c.id]: e.target.checked }))} />
                      <span>{c.title}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => { setModalOpen(false); setIsEditing(false); }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveReport} disabled={saving || !newReportOrg}>{isEditing ? 'Save Changes' : 'Create'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {exportModalOpen && (
        <div className="modal" onClick={() => setExportModalOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: 420 }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h5 className="modal-title">Download Report</h5>
                <button className="close" onClick={() => setExportModalOpen(false)}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select format</label>
                  <select className="form-control" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                    <option value="xls">Excel (.xls)</option>
                    <option value="csv">CSV (.csv)</option>
                    <option value="doc">Word (.doc)</option>
                    <option value="pdf" disabled>PDF (.pdf) — Enable server PDF to use</option>
                  </select>
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>PDF requires enabling a server-side PDF renderer. XLS/CSV/Word are ready now.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setExportModalOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={async () => {
                  try {
                    if (!exportReportId) return;
                    const blobRes = await reportsAPI.exportReport(exportReportId, { format: exportFormat });
                    if (blobRes.data?.message && exportFormat === 'pdf') {
                      alert('PDF export is not enabled on the server yet. Please choose XLS/CSV/Word.');
                      return;
                    }
                    const url = window.URL.createObjectURL(new Blob([blobRes.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    const ext = exportFormat === 'csv' ? 'csv' : (exportFormat === 'doc' ? 'doc' : (exportFormat === 'pdf' ? 'pdf' : 'xls'));
                    link.setAttribute('download', `report.${ext}`);
                    document.body.appendChild(link);
                    link.click();
                    link.parentNode.removeChild(link);
                    setExportModalOpen(false);
                  } catch (e) {
                    alert('Failed to export report');
                  }
                }}>Download</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
