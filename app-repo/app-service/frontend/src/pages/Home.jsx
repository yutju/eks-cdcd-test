// src/pages/Home.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const quickMenus = [
  { icon: '📅', label: '진료 예약', sub: '온라인으로 간편하게', path: '/appointment', color: '#2d4a22' },
  { icon: '📋', label: '진료 기록', sub: '검사결과·처방전 조회', path: '/medical',     color: '#3d5a6b' },
  { icon: '💊', label: '건강 관리', sub: '혈압·혈당 기록 및 조회', path: '/health',   color: '#6b4a2d' },
  { icon: '💬', label: '의료진 상담', sub: '메시지·화상진료', path: '/message',       color: '#4a2d6b' },
  { icon: '📢', label: '공지사항', sub: '병원 소식 및 안내', path: '/board/notice',   color: '#2d5a4a' },
  { icon: '❓', label: 'FAQ', sub: '자주 묻는 질문', path: '/board/faq',              color: '#5a4a2d' },
];

const notices = [
  { id: 1, title: '[공지] 하절기 진료 시간 변경 안내', date: '2026-06-28', isNew: true },
  { id: 2, title: '[안내] 독감 예방접종 실시 안내',   date: '2026-06-25', isNew: true },
  { id: 3, title: '[공지] 의무대 이전 안내',           date: '2026-06-20', isNew: false },
  { id: 4, title: '[행사] 건강검진 일정 안내',         date: '2026-06-15', isNew: false },
];

const departments = [
  { icon: '🏥', name: '내과',   desc: '내부 질환 전반' },
  { icon: '🦷', name: '치과',   desc: '구강·치아 관리' },
  { icon: '🦴', name: '정형외과', desc: '근골격계 질환' },
  { icon: '👁', name: '안과',   desc: '눈 질환 및 검사' },
  { icon: '🧠', name: '신경과', desc: '신경계 질환' },
  { icon: '💉', name: '외과',   desc: '수술적 처치' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      {/* 히어로 섹션 */}
      <section style={{
        background: 'linear-gradient(135deg, #1a2e14 0%, #2d4a22 50%, #3d6b2e 100%)',
        color: '#fff', padding: '80px 0', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(200,168,75,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-block', background: 'rgba(200,168,75,0.2)', color: '#c8a84b', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 20, border: '1px solid rgba(200,168,75,0.4)' }}>
                ✺ 육군훈련소 공식 환자포털
              </div>
              <h1 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.25, marginBottom: 20 }}>
                장병 건강을<br/>
                <span style={{ color: '#c8a84b' }}>최우선</span>으로 지킵니다
              </h1>
              <p style={{ fontSize: 16, lineHeight: 1.8, opacity: 0.85, marginBottom: 36 }}>
                훈련소 의무대의 온라인 환자포털에 오신 것을 환영합니다.<br/>
                진료 예약부터 건강 기록 관리까지 한 곳에서 해결하세요.
              </p>
              <div style={{ display: 'flex', gap: 14 }}>
                <Link to="/appointment" className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>
                  진료 예약하기
                </Link>
                {!user && (
                  <Link to="/signup" className="btn-secondary" style={{ padding: '14px 32px', fontSize: 16, background: 'transparent', border: '2px solid rgba(255,255,255,0.5)', color: '#fff' }}>
                    회원가입
                  </Link>
                )}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: '오늘 진료 인원', value: '127명', icon: '👨‍⚕️' },
                { label: '월 평균 처리', value: '3,240건', icon: '📊' },
                { label: '의료 인력', value: '32명', icon: '🏥' },
                { label: '진료 과목', value: '6개과', icon: '💊' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#c8a84b' }}>{s.value}</div>
                  <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 빠른 메뉴 */}
      <section style={{ padding: '60px 0' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 700, marginBottom: 8, color: '#1a2e14' }}>빠른 메뉴</h2>
          <p style={{ textAlign: 'center', color: '#888', marginBottom: 36 }}>자주 이용하는 서비스를 빠르게 이용하세요</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {quickMenus.map(m => (
              <Link key={m.path} to={m.path} style={{
                background: '#fff', borderRadius: 12, padding: '28px 24px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 18,
                border: '2px solid transparent', transition: 'all 0.2s',
                textDecoration: 'none', color: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                  {m.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a1a' }}>{m.label}</div>
                  <div style={{ fontSize: 13, color: '#888', marginTop: 3 }}>{m.sub}</div>
                </div>
                <span style={{ marginLeft: 'auto', color: '#ccc', fontSize: 20 }}>›</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 진료과 안내 + 공지사항 */}
      <section style={{ padding: '0 0 60px', background: '#fff' }}>
        <div className="container" style={{ paddingTop: 48 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
            {/* 진료과 */}
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: '#1a2e14', borderBottom: '3px solid #c8a84b', paddingBottom: 12 }}>
                🏥 진료 과목
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {departments.map(d => (
                  <div key={d.name} style={{ background: '#f4f5f0', borderRadius: 10, padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{d.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{d.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 공지사항 */}
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: '#1a2e14', borderBottom: '3px solid #c8a84b', paddingBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📢 공지사항</span>
                <Link to="/board/notice" style={{ fontSize: 13, color: '#6b7c3f', fontWeight: 500 }}>전체보기 ›</Link>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {notices.map(n => (
                  <Link key={n.id} to={`/board/notice`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #eee', color: 'inherit' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {n.isNew && <span style={{ background: '#c8a84b', color: '#1a2e14', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>NEW</span>}
                      <span style={{ fontSize: 14 }}>{n.title}</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#aaa', flexShrink: 0, marginLeft: 16 }}>{n.date}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 진료 시간 배너 */}
      <section style={{ background: 'linear-gradient(90deg, #2d4a22, #3d6b2e)', padding: '48px 0' }}>
        <div className="container" style={{ textAlign: 'center', color: '#fff' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>진료 시간 안내</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            {[
              { day: '월요일~금요일', time: '08:30 ~ 17:30' },
              { day: '토요일', time: '09:00 ~ 12:00' },
              { day: '일요일·공휴일', time: '응급실만 운영' },
            ].map(t => (
              <div key={t.day} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '20px 32px', border: '1px solid rgba(200,168,75,0.4)' }}>
                <div style={{ color: '#c8a84b', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{t.day}</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{t.time}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
