// src/pages/medical/Medical.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosClient';
import { useAuth } from '../../hooks/useAuth';

const tabs = [
  { key: 'lab-results', label: '🔬 검사결과', endpoint: '/medical/lab-results' },
  { key: 'prescriptions', label: '💊 처방전', endpoint: '/medical/prescriptions' },
  { key: 'documents', label: '📄 진단서', endpoint: '/medical/documents' },
  { key: 'immunizations', label: '💉 예방접종', endpoint: '/medical/immunizations' },
  { key: 'checkup-results', label: '🏥 건강검진', endpoint: '/medical/checkup-results' },
];

function EmptyState({ label }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
      <p style={{ fontSize: 15 }}>{label} 기록이 없습니다.</p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#c0392b' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
      <p style={{ fontSize: 15 }}>{message}</p>
    </div>
  );
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ko-KR') : '-';

async function handleDownload(docId, name) {
  try {
    const res = await api.get(`/medical/documents/${docId}/file`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.download = name || 'document';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    let message = '파일을 열 수 없습니다.';
    // responseType이 blob이라 에러 응답도 blob으로 오므로 JSON 텍스트로 다시 읽어야 메시지 확인 가능
    try {
      const text = await err.response?.data?.text?.();
      if (text) message = JSON.parse(text).error || message;
    } catch { /* ignore */ }
    alert(message);
  }
}

// 탭별로 백엔드(openemrDirect)가 실제로 반환하는 원본 컬럼 구조에 맞춰 렌더링합니다.
function renderRow(tabKey, r, i) {
  switch (tabKey) {
    case 'prescriptions':
      return (
        <div key={r.id ?? i} className="card" style={{ borderLeft: '4px solid #2d4a22' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{r.drug}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{r.dosage} · {r.quantity}개</div>
              {r.note && <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{r.note}</div>}
              <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>📅 {fmtDate(r.date_added)}</div>
            </div>
            <span className={`badge ${r.active ? 'badge-green' : ''}`}>{r.active ? '복용중' : '종료'}</span>
          </div>
        </div>
      );

    case 'immunizations':
      return (
        <div key={r.id ?? i} className="card" style={{ borderLeft: '4px solid #2d4a22' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
            {r.cvx_code ? `백신 코드: ${r.cvx_code}` : `접종 #${r.immunization_id}`}
          </div>
          <div style={{ fontSize: 13, color: '#888' }}>
            {r.manufacturer && `제조사: ${r.manufacturer} · `}
            {r.route && `${r.route} · `}
            {r.administration_site}
          </div>
          {r.note && <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{r.note}</div>}
          <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>📅 {fmtDate(r.administered_date)}</div>
        </div>
      );

    case 'documents':
      return (
        <div key={r.id ?? i} className="card" style={{ borderLeft: '4px solid #2d4a22' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>📄 {r.name}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{r.mimetype} {r.size ? `· ${Math.round(r.size / 1024)}KB` : ''}</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>📅 {fmtDate(r.date)}</div>
            </div>
            <button onClick={() => handleDownload(r.id, r.name)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13, flexShrink: 0 }}>
              열기/다운로드
            </button>
          </div>
        </div>
      );

    case 'checkup-results':
      return (
        <div key={r.id ?? i} className="card" style={{ borderLeft: '4px solid #2d4a22' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>📅 {fmtDate(r.date)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, fontSize: 13, color: '#555' }}>
            {r.bps && <div>혈압: {r.bps}/{r.bpd}</div>}
            {r.weight && <div>체중: {r.weight}kg</div>}
            {r.height && <div>신장: {r.height}cm</div>}
            {r.BMI && <div>BMI: {r.BMI}</div>}
            {r.temperature && <div>체온: {r.temperature}℃</div>}
            {r.pulse && <div>맥박: {r.pulse}회/분</div>}
            {r.respiration && <div>호흡수: {r.respiration}회/분</div>}
          </div>
        </div>
      );

    case 'lab-results':
    default:
      return (
        <div key={`${r.procedure_order_id}-${i}`} className="card" style={{ borderLeft: '4px solid #2d4a22' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                {r.result_code || `검사오더 #${r.procedure_order_id}`}
              </div>
              {r.result_text && <div style={{ fontSize: 13, color: '#888' }}>{r.result_text}</div>}
              {r.units && <div style={{ fontSize: 13, color: '#888' }}>단위: {r.units}</div>}
              <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>📅 주문일 {fmtDate(r.date_ordered)}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              <span className="badge badge-green">{r.order_status || r.report_status}</span>
              {r.abnormal === 'A' && <span className="badge" style={{ background: '#fce4e4', color: '#c0392b' }}>이상</span>}
            </div>
          </div>
        </div>
      );
  }
}

function ResourceList({ tabKey, state, label }) {
  if (state?.status === 'error') return <ErrorState message={state.message} />;
  const list = state?.data;
  if (!Array.isArray(list) || list.length === 0) return <EmptyState label={label} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {list.map((r, i) => renderRow(tabKey, r, i))}
    </div>
  );
}

export default function Medical() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('lab-results');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const tab = tabs.find(t => t.key === activeTab);
    if (data[activeTab]) return;
    setLoading(true);
    api.get(tab.endpoint)
      .then(r => setData(prev => ({ ...prev, [activeTab]: { status: 'ok', data: r.data } })))
      .catch(err => setData(prev => ({
        ...prev,
        [activeTab]: { status: 'error', message: err.response?.data?.error || '조회 중 오류가 발생했습니다.' },
      })))
      .finally(() => setLoading(false));
  }, [activeTab, user]);

  if (!user) return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontSize: 22, marginBottom: 12 }}>로그인이 필요합니다</h2>
      <Link to="/login" className="btn-primary" style={{ display: 'inline-block', padding: '12px 32px' }}>로그인하기</Link>
    </div>
  );

  const currentTab = tabs.find(t => t.key === activeTab);

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>📋 진료 기록</h1>
          <p>검사결과, 처방전, 예방접종 이력을 조회하세요</p>
        </div>
      </div>
      <div className="container" style={{ paddingBottom: 60 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14,
              background: activeTab === t.key ? '#2d4a22' : '#fff',
              color: activeTab === t.key ? '#fff' : '#555',
              border: activeTab === t.key ? 'none' : '1.5px solid #ddd',
              boxShadow: activeTab === t.key ? '0 2px 8px rgba(45,74,34,0.3)' : 'none',
            }}>{t.label}</button>
          ))}
        </div>
        {loading ? <div className="spinner" /> : (
          <ResourceList tabKey={activeTab} state={data[activeTab]} label={currentTab?.label} />
        )}
      </div>
    </div>
  );
}
