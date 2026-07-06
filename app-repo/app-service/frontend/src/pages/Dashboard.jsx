// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosClient';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [healthLogs, setHealthLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/appointments/my').catch(() => ({ data: [] })),
      api.get('/health/log/bp').catch(() => ({ data: [] })),
    ]).then(([appt, health]) => {
      setAppointments(appt.data.slice(0, 3));
      setHealthLogs(health.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const statusBadge = (s) => {
    const m = { proposed: ['접수', 'yellow'], booked: ['확정', 'green'], cancelled: ['취소', 'red'], fulfilled: ['완료', 'gray'] };
    const [label, type] = m[s] || ['알수없음', 'gray'];
    return <span className={`badge badge-${type}`}>{label}</span>;
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>마이페이지</h1>
          <p>{user?.name}님의 건강 대시보드</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        {/* 환영 카드 */}
        <div style={{ background: 'linear-gradient(135deg, #2d4a22, #3d6b2e)', color: '#fff', borderRadius: 16, padding: '28px 32px', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>안녕하세요, {user?.name}님 👋</div>
            <div style={{ opacity: 0.8, fontSize: 14 }}>오늘도 건강한 하루 되세요. 무엇을 도와드릴까요?</div>
          </div>
          <Link to="/appointment" style={{ background: '#c8a84b', color: '#1a2e14', padding: '12px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            + 예약 신청
          </Link>
        </div>

        {/* 빠른 메뉴 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { icon: '📅', label: '예약 현황', path: '/appointment', count: appointments.filter(a => a.status === 'booked').length },
            { icon: '💊', label: '처방전 조회', path: '/medical/prescriptions', count: null },
            { icon: '🩺', label: '검사 결과', path: '/medical/lab', count: null },
            { icon: '💬', label: '미확인 메시지', path: '/message', count: 0 },
          ].map(m => (
            <Link key={m.path} to={m.path} className="card" style={{ textAlign: 'center', padding: '20px 16px', transition: 'transform 0.2s', display: 'block' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>{m.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{m.label}</div>
              {m.count !== null && <div style={{ fontSize: 22, fontWeight: 700, color: '#2d4a22', marginTop: 4 }}>{m.count}</div>}
            </Link>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
          {/* 예약 현황 */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>📅 예약 현황</h2>
              <Link to="/appointment" style={{ fontSize: 13, color: '#2d4a22', fontWeight: 600 }}>전체보기 ›</Link>
            </div>
            {appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                <p style={{ fontSize: 14 }}>예약 내역이 없습니다.</p>
                <Link to="/appointment" className="btn-primary" style={{ display: 'inline-block', marginTop: 14, padding: '10px 24px', fontSize: 14 }}>예약하기</Link>
              </div>
            ) : appointments.map(a => (
              <div key={a.id} style={{ borderBottom: '1px solid #eee', paddingBottom: 14, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{a.department || '진료과 미정'}</div>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 3 }}>{new Date(a.start_time).toLocaleString('ko-KR')}</div>
                  </div>
                  {statusBadge(a.status)}
                </div>
              </div>
            ))}
          </div>

          {/* 혈압 기록 */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>❤️ 혈압 기록</h2>
              <Link to="/health" style={{ fontSize: 13, color: '#2d4a22', fontWeight: 600 }}>전체보기 ›</Link>
            </div>
            {healthLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📊</div>
                <p style={{ fontSize: 14 }}>기록된 혈압이 없습니다.</p>
                <Link to="/health" className="btn-primary" style={{ display: 'inline-block', marginTop: 14, padding: '10px 24px', fontSize: 14 }}>기록하기</Link>
              </div>
            ) : healthLogs.map(h => (
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#2d4a22' }}>{h.value_1}/{h.value_2}</span>
                  <span style={{ fontSize: 12, color: '#aaa', marginLeft: 4 }}>mmHg</span>
                </div>
                <span style={{ fontSize: 12, color: '#aaa' }}>{new Date(h.measured_at).toLocaleDateString('ko-KR')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
