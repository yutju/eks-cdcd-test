// src/components/layout/Footer.jsx
export default function Footer() {
  return (
    <footer style={{ background: '#1a2e14', color: 'rgba(255,255,255,0.6)', marginTop: 80 }}>
      <div className="container" style={{ padding: '40px 24px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, marginBottom: 32 }}>
          <div>
            <div style={{ color: '#c8a84b', fontWeight: 700, fontSize: 15, marginBottom: 12 }}>육군훈련소 의무대</div>
            <p style={{ fontSize: 13, lineHeight: 1.8 }}>장병 건강을 최우선으로<br/>전문적인 의료서비스를 제공합니다.</p>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 12 }}>빠른 메뉴</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['진료예약', '진료기록 조회', '건강노트', '게시판', '상담'].map(m => (
                <span key={m} style={{ fontSize: 13, cursor: 'pointer' }}>{m}</span>
              ))}
            </div>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 12 }}>진료 안내</div>
            <div style={{ fontSize: 13, lineHeight: 2 }}>
              <div>월~금: 08:30 ~ 17:30</div>
              <div>토요일: 09:00 ~ 12:00</div>
              <div>공휴일: 응급실만 운영</div>
            </div>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 12 }}>응급 연락처</div>
            <div style={{ fontSize: 13, lineHeight: 2 }}>
              <div>의무대 대표: 041-000-0000</div>
              <div>응급실: 041-000-0001</div>
              <div>훈련소 본부: 041-000-0002</div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, textAlign: 'center', fontSize: 12 }}>
          © 2026 육군훈련소 의무대 환자포털. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
