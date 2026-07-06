// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import PatientVerification from './PatientVerification';
import BoardManage from './BoardManage';
import MessageManage from './MessageManage';

export default function AdminDashboard() {
  const { admin, logout, isAdminLoggedIn } = useAdminAuth();
  const [tab, setTab] = useState('patients');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdminLoggedIn) navigate('/staff/login');
  }, [isAdminLoggedIn]);

  if (!isAdminLoggedIn) return null;

  return (
    <div>
      <div style={{ background: '#1a2e14', color: '#fff', padding: '18px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700 }}>관리자 페이지</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{admin?.name}님 로그인 중</p>
          </div>
          <button onClick={() => { logout(); navigate('/staff/login'); }}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>
            로그아웃
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 24 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #eee' }}>
          {[
            { key: 'patients', label: '👤 환자 실명확인 / OpenEMR 연동' },
            { key: 'board', label: '📢 게시판 관리' },
            { key: 'messages', label: '💬 상담 관리' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '12px 16px', fontSize: 14,
                fontWeight: tab === t.key ? 700 : 400,
                color: tab === t.key ? '#2d4a22' : '#888',
                borderBottom: tab === t.key ? '2px solid #2d4a22' : '2px solid transparent',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        {tab === 'patients' && <PatientVerification />}
        {tab === 'board' && <BoardManage />}
        {tab === 'messages' && <MessageManage />}
      </div>
    </div>
  );
}
