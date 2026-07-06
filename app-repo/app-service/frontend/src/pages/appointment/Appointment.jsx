// src/pages/appointment/Appointment.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosClient';
import Toast from '../../components/common/Toast';
import { useAuth } from '../../hooks/useAuth';

const departments = ['내과', '치과', '정형외과', '안과', '신경과', '외과'];

export default function Appointment() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({ department: '', start: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState('list'); // list | book

  useEffect(() => { fetchAppts(); }, []);

  const fetchAppts = async () => {
    try { const res = await api.get('/appointments/my'); setAppointments(res.data); }
    catch {}
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const start = new Date(form.start).toISOString();
      const end = new Date(new Date(form.start).getTime() + 30 * 60 * 1000).toISOString();
      await api.post('/appointments/book', { ...form, start, end });
      setToast({ message: '예약이 접수되었습니다!', type: 'success' });
      setTab('list'); fetchAppts();
      setForm({ department: '', start: '', reason: '' });
    } catch (err) {
      setToast({ message: err.response?.data?.error || '예약에 실패했습니다.', type: 'error' });
    } finally { setLoading(false); }
  };

  const handleCancel = async (apptId) => {
    if (!confirm('예약을 취소하시겠습니까?')) return;
    try {
      await api.delete(`/appointments/${apptId}`);
      setToast({ message: '예약이 취소되었습니다.', type: 'success' });
      fetchAppts();
    } catch { setToast({ message: '취소에 실패했습니다.', type: 'error' }); }
  };

  const statusBadge = (s) => {
    const m = { proposed: ['접수대기', 'yellow'], booked: ['예약확정', 'green'], cancelled: ['취소', 'red'], fulfilled: ['진료완료', 'gray'] };
    const [label, type] = m[s] || ['알수없음', 'gray'];
    return <span className={`badge badge-${type}`}>{label}</span>;
  };

  if (!user) return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontSize: 22, marginBottom: 12 }}>로그인이 필요합니다</h2>
      <Link to="/login" className="btn-primary" style={{ display: 'inline-block', padding: '12px 32px' }}>로그인하기</Link>
    </div>
  );

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="page-header">
        <div className="container">
          <h1>📅 진료 예약</h1>
          <p>온라인으로 간편하게 진료를 예약하세요</p>
        </div>
      </div>
      <div className="container" style={{ paddingBottom: 60 }}>
        {/* 탭 */}
        <div style={{ display: 'flex', borderBottom: '2px solid #dde0d4', marginBottom: 32 }}>
          {[['list', '예약 내역'], ['book', '새 예약 신청']].map(([k, v]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '12px 28px', fontWeight: 700, fontSize: 15, background: 'none', border: 'none',
              borderBottom: tab === k ? '3px solid #2d4a22' : '3px solid transparent',
              color: tab === k ? '#2d4a22' : '#aaa', marginBottom: -2,
            }}>{v}</button>
          ))}
        </div>

        {tab === 'list' ? (
          <div>
            {appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                <p style={{ fontSize: 16 }}>예약 내역이 없습니다.</p>
                <button onClick={() => setTab('book')} className="btn-primary" style={{ marginTop: 20, padding: '12px 32px' }}>예약 신청하기</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {appointments.map(a => (
                  <div key={a.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span style={{ fontSize: 17, fontWeight: 700 }}>{a.department || '진료과 미정'}</span>
                        {statusBadge(a.status)}
                        {a.is_telemedicine === 1 && <span className="badge badge-navy">화상진료</span>}
                      </div>
                      <div style={{ fontSize: 14, color: '#888' }}>🕐 {new Date(a.start_time).toLocaleString('ko-KR')}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {(a.status === 'proposed' || a.status === 'booked') && (
                        <button className="btn-danger" onClick={() => handleCancel(a.openemr_appt_id)} style={{ padding: '8px 18px', fontSize: 13 }}>취소</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ maxWidth: 560 }}>
            <div className="card">
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: '#1a2e14' }}>새 예약 신청</h2>
              <form onSubmit={handleBook}>
                <div className="form-group">
                  <label>진료과 *</label>
                  <select className="form-input" required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                    <option value="">진료과를 선택하세요</option>
                    {departments.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>희망 날짜/시간 *</label>
                  <input className="form-input" type="datetime-local" required value={form.start}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={e => setForm({ ...form, start: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>증상/방문 사유</label>
                  <textarea className="form-input" rows={4} placeholder="증상이나 방문 사유를 입력하세요" value={form.reason}
                    onChange={e => setForm({ ...form, reason: e.target.value })} style={{ resize: 'none' }} />
                </div>
                <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#795548', marginBottom: 20 }}>
                  ⚠ 접수된 예약은 의무대 검토 후 확정됩니다. 응급 시에는 직접 내원하세요.
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" className="btn-secondary" onClick={() => setTab('list')} style={{ flex: 1, padding: '13px' }}>취소</button>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2, padding: '13px' }}>
                    {loading ? '접수 중...' : '예약 신청'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
