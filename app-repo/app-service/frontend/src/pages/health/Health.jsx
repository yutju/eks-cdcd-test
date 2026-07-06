// src/pages/health/Health.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosClient';
import Toast from '../../components/common/Toast';
import { useAuth } from '../../hooks/useAuth';

const LOG_TYPES = [
  { key: 'bp',      label: '혈압',  unit: 'mmHg', icon: '❤️',  hasTwo: true,  p1: '수축기(높은값)', p2: '이완기(낮은값)' },
  { key: 'glucose', label: '혈당',  unit: 'mg/dL', icon: '🩸', hasTwo: false, p1: '혈당 수치' },
  { key: 'weight',  label: '체중',  unit: 'kg',   icon: '⚖️',  hasTwo: false, p1: '체중' },
  { key: 'pulse',   label: '맥박',  unit: 'bpm',  icon: '💓',  hasTwo: false, p1: '맥박수' },
];

export default function Health() {
  const { user } = useAuth();
  const [activeType, setActiveType] = useState('bp');
  const [logs, setLogs] = useState({});
  const [form, setForm] = useState({ v1: '', v2: '', memo: '', measuredAt: new Date().toISOString().slice(0, 16) });
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const typeInfo = LOG_TYPES.find(t => t.key === activeType);

  useEffect(() => {
    if (!user || logs[activeType]) return;
    api.get(`/health/log/${activeType}`).then(r => setLogs(p => ({ ...p, [activeType]: r.data }))).catch(() => setLogs(p => ({ ...p, [activeType]: [] })));
  }, [activeType, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/health/log', { logType: activeType, value1: form.v1, value2: form.v2 || null, memo: form.memo, measuredAt: form.measuredAt });
      setToast({ message: '기록이 저장되었습니다!', type: 'success' });
      setLogs(p => ({ ...p, [activeType]: null })); // 재조회 트리거
      setShowForm(false);
      setForm({ v1: '', v2: '', memo: '', measuredAt: new Date().toISOString().slice(0, 16) });
    } catch { setToast({ message: '저장에 실패했습니다.', type: 'error' }); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await api.delete(`/health/log/${id}`);
    setLogs(p => ({ ...p, [activeType]: null }));
  };

  const currentLogs = logs[activeType] || [];

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
          <h1>💊 건강 관리</h1>
          <p>혈압, 혈당, 체중 등 개인 건강 지표를 기록하고 관리하세요</p>
        </div>
      </div>
      <div className="container" style={{ paddingBottom: 60 }}>
        {/* 타입 탭 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          {LOG_TYPES.map(t => (
            <button key={t.key} onClick={() => setActiveType(t.key)} style={{
              flex: 1, padding: '16px', borderRadius: 12, fontWeight: 700, fontSize: 15,
              background: activeType === t.key ? '#2d4a22' : '#fff',
              color: activeType === t.key ? '#fff' : '#555',
              border: activeType === t.key ? 'none' : '1.5px solid #ddd',
              boxShadow: activeType === t.key ? '0 4px 16px rgba(45,74,34,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 24 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
          {/* 기록 목록 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{typeInfo.icon} {typeInfo.label} 기록</h2>
              <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ padding: '9px 20px', fontSize: 14 }}>
                {showForm ? '취소' : '+ 기록 추가'}
              </button>
            </div>

            {/* 최근 값 카드 */}
            {currentLogs.length > 0 && (
              <div style={{ background: 'linear-gradient(135deg, #2d4a22, #3d6b2e)', color: '#fff', borderRadius: 16, padding: '24px 28px', marginBottom: 20 }}>
                <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>최근 측정값</div>
                <div style={{ fontSize: 36, fontWeight: 900 }}>
                  {typeInfo.hasTwo ? `${currentLogs[0].value_1}/${currentLogs[0].value_2}` : currentLogs[0].value_1}
                  <span style={{ fontSize: 16, opacity: 0.7, marginLeft: 6 }}>{typeInfo.unit}</span>
                </div>
                <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>{new Date(currentLogs[0].measured_at).toLocaleString('ko-KR')}</div>
              </div>
            )}

            {currentLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#aaa' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{typeInfo.icon}</div>
                <p>기록이 없습니다. 첫 기록을 추가해보세요!</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>측정값</th>
                    <th>메모</th>
                    <th>측정일시</th>
                    <th>삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLogs.map(h => (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 700, color: '#2d4a22' }}>
                        {typeInfo.hasTwo ? `${h.value_1}/${h.value_2}` : h.value_1} {typeInfo.unit}
                      </td>
                      <td style={{ color: '#888', fontSize: 13 }}>{h.memo || '-'}</td>
                      <td style={{ color: '#888', fontSize: 13 }}>{new Date(h.measured_at).toLocaleString('ko-KR')}</td>
                      <td><button onClick={() => handleDelete(h.id)} style={{ color: '#e74c3c', background: 'none', border: 'none', fontWeight: 600, fontSize: 13 }}>삭제</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 기록 폼 */}
          {showForm && (
            <div className="card" style={{ position: 'sticky', top: 90 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>{typeInfo.icon} {typeInfo.label} 기록 추가</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>{typeInfo.p1} ({typeInfo.unit}) *</label>
                  <input className="form-input" type="number" step="0.1" required placeholder="수치 입력"
                    value={form.v1} onChange={e => setForm({ ...form, v1: e.target.value })} />
                </div>
                {typeInfo.hasTwo && (
                  <div className="form-group">
                    <label>{typeInfo.p2} ({typeInfo.unit}) *</label>
                    <input className="form-input" type="number" step="0.1" required placeholder="수치 입력"
                      value={form.v2} onChange={e => setForm({ ...form, v2: e.target.value })} />
                  </div>
                )}
                <div className="form-group">
                  <label>측정 일시 *</label>
                  <input className="form-input" type="datetime-local" required value={form.measuredAt}
                    onChange={e => setForm({ ...form, measuredAt: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>메모</label>
                  <input className="form-input" placeholder="식후/식전, 특이사항 등" value={form.memo}
                    onChange={e => setForm({ ...form, memo: e.target.value })} />
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '12px' }}>
                  {loading ? '저장 중...' : '저장'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
