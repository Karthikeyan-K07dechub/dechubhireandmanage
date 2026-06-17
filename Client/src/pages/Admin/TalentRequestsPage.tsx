import { useEffect, useState } from 'react';
import { listTalentRequests, getTalentRequest, updateTalentRequestStatus, unreadCount, markAsRead } from '../../api/admin.api';
import './admin-talent-requests.css';

interface TalentRequestsPageProps {
  onLogout: () => void;
}

export default function TalentRequestsPage({ onLogout }: TalentRequestsPageProps) {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [badge, setBadge] = useState(0);

  async function load() {
    try {
      const data = await listTalentRequests({ perPage: 50 });
      setItems(data.items || []);
      const u = await unreadCount();
      setBadge(u.unread || 0);
    } catch (err) {
      // ignore
    }
  }

  useEffect(() => { load(); }, []);

  const openDetails = async (id: string) => {
    try {
      const detail = await getTalentRequest(id);
      setSelected(detail);
      // reload badge
      const u = await unreadCount();
      setBadge(u.unread || 0);
    } catch (err) {}
  };

  const changeStatus = async (id: string, status: string) => {
    await updateTalentRequestStatus(id, status);
    await load();
    if (selected && selected._id === id) setSelected({ ...selected, status });
  };

  const markRead = async (id: string) => {
    await markAsRead(id);
    await load();
  };

  return (
    <div className="atr-root">
      <header className="atr-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1>Talent Requests Admin</h1>
          <button onClick={onLogout} style={{ 
            marginLeft: 'auto', 
            padding: '0.5rem 1rem',
            backgroundColor: '#1a1a2e',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>Logout</button>
        </div>
        <div className="atr-badge">🔔 {badge}</div>
      </header>

      <main className="atr-main">
        <section className="atr-list">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Talent</th>
                <th>Company</th>
                <th>Email</th>
                <th>Budget</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it._id} className={it.unread ? 'unread' : ''}>
                  <td>{it._id}</td>
                  <td>{it.workerName}</td>
                  <td>{it.companyName}</td>
                  <td>{it.email}</td>
                  <td>{it.budget}</td>
                  <td>{new Date(it.createdAt).toLocaleString()}</td>
                  <td>{it.status}</td>
                  <td>
                    <button onClick={() => openDetails(it._id)}>View</button>
                    <button onClick={() => changeStatus(it._id, 'contacted')}>Mark Contacted</button>
                    <button onClick={() => markRead(it._id)}>Mark Read</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <aside className="atr-details">
          {selected ? (
            <div>
              <h2>{selected.workerName}</h2>
              <p><strong>Role:</strong> {selected.workerRole}</p>
              <p><strong>Profile:</strong> <a href={selected.workerProfileUrl}>{selected.workerProfileUrl}</a></p>

              <h3>Company</h3>
              <p><strong>{selected.companyName}</strong></p>
              <p>{selected.contactFirstName} {selected.contactLastName}</p>
              <p>{selected.phoneNumber}</p>
              <p>{selected.email}</p>

              <h3>Project</h3>
              <p><strong>Type:</strong> {selected.projectType}</p>
              <p><strong>Budget:</strong> {selected.budget}</p>
              <p>{selected.projectDescription}</p>

              <h4>Submission</h4>
              <p>{new Date(selected.createdAt).toLocaleString()}</p>
              <p><strong>ID:</strong> {selected._id}</p>

              <div className="atr-status-actions">
                <label>Status:</label>
                <select value={selected.status} onChange={(e) => changeStatus(selected._id, e.target.value)}>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="in_discussion">In Discussion</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          ) : (
            <div>Select a request to view details</div>
          )}
        </aside>
      </main>
    </div>
  );
}
