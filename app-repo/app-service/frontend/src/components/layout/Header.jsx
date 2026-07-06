// src/components/layout/Header.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/',            label: '홈' },
    { path: '/appointment', label: '진료예약' },
    { path: '/medical',     label: '진료기록' },
    { path: '/health',      label: '건강관리' },
    { path: '/board',       label: '게시판' },
    { path: '/message',     label: '상담' },
  ];

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      {/* 상단 안내바 */}
      <div style={{ background: '#1a2e14', color: '#c8a84b', fontSize: 12, padding: '6px 0', textAlign: 'center', fontWeight: 500, letterSpacing: 1 }}>
        육군훈련소 의무대 — 건강한 장병, 강한 군대
      </div>

      <header style={{ background: '#2d4a22', boxShadow: '0 2px 12px rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 68 }}>
          {/* 로고 */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ width: 44, height: 44, background: '#c8a84b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#1a2e14' }}>
              ✚
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>육군훈련소</div>
              <div style={{ color: '#c8a84b', fontSize: 12, fontWeight: 500 }}>환자포털</div>
            </div>
          </Link>

          {/* 데스크탑 네비 */}
          <nav style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 4 }}>
            {navItems.map(item => (
              <Link key={item.path} to={item.path} style={{
                padding: '8px 16px',
                borderRadius: 6,
                color: isActive(item.path) ? '#c8a84b' : 'rgba(255,255,255,0.8)',
                fontWeight: isActive(item.path) ? 700 : 400,
                fontSize: 14,
                background: isActive(item.path) ? 'rgba(200,168,75,0.15)' : 'transparent',
                borderBottom: isActive(item.path) ? '2px solid #c8a84b' : '2px solid transparent',
                transition: 'all 0.2s',
              }}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 로그인/유저 영역 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {user ? (
              <>
                <Link to="/dashboard" style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>
                  <span style={{ color: '#c8a84b', fontWeight: 700 }}>{user.name}</span>님
                </Link>
                <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '7px 14px', borderRadius: 6, fontSize: 13 }}>
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, padding: '7px 14px' }}>로그인</Link>
                <Link to="/signup" style={{ background: '#c8a84b', color: '#1a2e14', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 700 }}>
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
