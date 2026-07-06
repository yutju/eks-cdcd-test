// src/pages/admin/MessageManage.jsx
import { useState, useEffect, useRef } from 'react';
import { io as ioClient } from 'socket.io-client';
import adminApi from '../../api/adminClient';
import Toast from '../../components/common/Toast';

export default function MessageManage() {
  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null); // patient_id
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [toast, setToast] = useState(null);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const socketRef = useRef(null);
  const endRef = useRef(null);

  const fetchThreads = async () => {
    setLoadingThreads(true);
    try {
      const r = await adminApi.get('/admin/messages');
      setThreads(r.data);
    } catch (err) {
      setToast({ message: '상담 목록을 불러오지 못했습니다.', type: 'error' });
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    fetchThreads();

    const token = localStorage.getItem('adminToken');
    const socket = ioClient({ auth: { token } });
    socketRef.current = socket;

    // 어떤 환자한테서든 새 메시지가 오면 스레드 목록 갱신
    socket.on('thread_updated', () => fetchThreads());

    return () => socket.disconnect();
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const openThread = async (patientId) => {
    setSelected(patientId);
    setLoadingMessages(true);
    socketRef.current?.emit('watch_thread', patientId);
    try {
      const r = await adminApi.get(`/admin/messages/${patientId}`);
      setMessages(r.data);
    } catch (err) {
      setToast({ message: '대화 내역을 불러오지 못했습니다.', type: 'error' });
    } finally {
      setLoadingMessages(false);
    }
  };

  // 현재 열려있는 스레드에 새 메시지가 실시간으로 오면 반영
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = (msg) => {
      if (msg.patient_id === selected) {
        setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
      }
    };
    socket.on('new_message', handler);
    return () => socket.off('new_message', handler);
  }, [selected]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || !selected) return;
    setContent('');
    try {
      const r = await adminApi.post(`/admin/messages/${selected}`, { content: text });
      setMessages(prev => (prev.some(m => m.id === r.data.id) ? prev : [...prev, r.data]));
      fetchThreads();
    } catch (err) {
      setToast({ message: '전송에 실패했습니다.', type: 'error' });
      setContent(text);
    }
  };

  const selectedThread = threads.find(t => t.patient_id === selected);

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>
        {/* 스레드 목록 */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee', fontWeight: 700, fontSize: 14 }}>
            상담 목록 {threads.length > 0 && `(${threads.length})`}
          </div>
          <div style={{ maxHeight: 560, overflowY: 'auto' }}>
            {loadingThreads ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 13 }}>불러오는 중...</div>
            ) : threads.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 13 }}>상담 내역이 없습니다.</div>
            ) : threads.map(t => (
              <div key={t.patient_id} onClick={() => openThread(t.patient_id)}
                style={{
                  padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f2f2f2',
                  background: selected === t.patient_id ? '#f0f4ed' : '#fff',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</span>
                  {t.unread_count > 0 && (
                    <span style={{ background: '#c0392b', color: '#fff', borderRadius: 10, fontSize: 11, padding: '2px 7px' }}>
                      {t.unread_count}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.last_content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 대화창 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 610 }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 14 }}>
              왼쪽에서 상담을 선택하세요.
            </div>
          ) : (
            <>
              <div style={{ paddingBottom: 14, borderBottom: '1px solid #eee', marginBottom: 14, fontWeight: 700 }}>
                {selectedThread?.name} ({selectedThread?.login_id})
              </div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: '0 4px' }}>
                {loadingMessages ? (
                  <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>불러오는 중...</div>
                ) : messages.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: m.sender_type === 'staff' ? 'flex-end' : 'flex-start' }}>
                    <div>
                      <div style={{
                        maxWidth: 320, padding: '12px 16px', borderRadius: m.sender_type === 'staff' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                        background: m.sender_type === 'staff' ? '#2d4a22' : '#f0f0f0',
                        color: m.sender_type === 'staff' ? '#fff' : '#333',
                        fontSize: 14, lineHeight: 1.6,
                      }}>
                        {m.content}
                      </div>
                      <div style={{ fontSize: 11, color: '#bbb', marginTop: 4, textAlign: m.sender_type === 'staff' ? 'right' : 'left' }}>
                        {new Date(m.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid #eee', marginTop: 8 }}>
                <input className="form-input" placeholder="답장을 입력하세요..." value={content}
                  onChange={e => setContent(e.target.value)} style={{ flex: 1 }} />
                <button type="submit" className="btn-primary" style={{ padding: '12px 20px', flexShrink: 0 }}>전송</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
