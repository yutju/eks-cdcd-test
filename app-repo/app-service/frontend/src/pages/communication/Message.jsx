// src/pages/communication/Message.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { io as ioClient } from 'socket.io-client';
import api from '../../api/axiosClient';
import { useAuth } from '../../hooks/useAuth';
import Toast from '../../components/common/Toast';

export default function Message() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    // 1) 기존 대화 내역 조회
    (async () => {
      try {
        const r = await api.get('/message');
        if (mounted) setMessages(r.data);
      } catch (err) {
        setToast({ message: '메시지를 불러오지 못했습니다.', type: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // 2) 실시간 수신을 위한 socket.io 연결 (같은 origin, nginx가 backend로 프록시)
    const token = localStorage.getItem('token');
    const socket = ioClient({ auth: { token } });
    socketRef.current = socket;

    socket.on('new_message', (msg) => {
      setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setContent('');
    try {
      const r = await api.post('/message', { content: text });
      setMessages(prev => (prev.some(m => m.id === r.data.id) ? prev : [...prev, r.data]));
    } catch (err) {
      setToast({ message: err.response?.data?.error || '전송에 실패했습니다.', type: 'error' });
      setContent(text);
    }
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
          <h1>💬 의료진 상담</h1>
          <p>의료진에게 질문하거나 상담을 요청하세요</p>
        </div>
      </div>
      <div className="container" style={{ paddingBottom: 60 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>
          {/* 사이드 - 메뉴 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, #2d4a22, #3d6b2e)', color: '#fff' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>의료진 메시지</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>의료진과 1:1로 소통하세요</div>
            </div>

            <Link to="/telemedicine" className="card" style={{ display: 'block', textAlign: 'center', color: 'inherit' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📹</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>화상 진료</div>
              <div style={{ fontSize: 13, color: '#888' }}>온라인 진료 예약</div>
            </Link>

            <div className="card" style={{ background: '#fff8e1', border: '1px solid #ffe082' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#795548', marginBottom: 8 }}>⚠ 이용 안내</div>
              <div style={{ fontSize: 12, color: '#795548', lineHeight: 1.7 }}>
                · 긴급 상황은 즉시 내원<br />
                · 응급: 041-000-0001<br />
                · 평일 08:30~17:30 운영<br />
                · 답변까지 최대 1~2일 소요
              </div>
            </div>
          </div>

          {/* 채팅창 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 600 }}>
            {/* 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid #eee', marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, background: '#2d4a22', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👨‍⚕️</div>
              <div>
                <div style={{ fontWeight: 700 }}>육군훈련소 의무대</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#888' }}>
                  <span style={{ width: 8, height: 8, background: '#27ae60', borderRadius: '50%', display: 'inline-block' }} />
                  온라인
                </div>
              </div>
            </div>

            {/* 메시지 목록 */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: '0 4px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>불러오는 중...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>아직 대화 내역이 없습니다. 궁금한 점을 남겨보세요.</div>
              ) : messages.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.sender_type === 'patient' ? 'flex-end' : 'flex-start' }}>
                  {m.sender_type === 'staff' && (
                    <div style={{ width: 32, height: 32, background: '#2d4a22', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginRight: 8, flexShrink: 0 }}>👨‍⚕️</div>
                  )}
                  <div>
                    <div style={{
                      maxWidth: 320, padding: '12px 16px', borderRadius: m.sender_type === 'patient' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                      background: m.sender_type === 'patient' ? '#2d4a22' : '#f0f0f0',
                      color: m.sender_type === 'patient' ? '#fff' : '#333',
                      fontSize: 14, lineHeight: 1.6,
                    }}>
                      {m.content}
                    </div>
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 4, textAlign: m.sender_type === 'patient' ? 'right' : 'left' }}>
                      {new Date(m.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* 입력창 */}
            <form onSubmit={handleSend} style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid #eee', marginTop: 8 }}>
              <input className="form-input" placeholder="메시지를 입력하세요..." value={content}
                onChange={e => setContent(e.target.value)} style={{ flex: 1 }} />
              <button type="submit" className="btn-primary" style={{ padding: '12px 20px', flexShrink: 0 }}>전송</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
