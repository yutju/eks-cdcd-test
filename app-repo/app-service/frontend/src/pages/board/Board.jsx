// src/pages/board/Board.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosClient';
import Toast from '../../components/common/Toast';
import { useAuth } from '../../hooks/useAuth';

const BOARDS = {
  notice: { label: '📢 공지사항', writable: false },
  faq:    { label: '❓ FAQ',      writable: false },
  qna:    { label: '💬 Q&A',      writable: true  },
  free:   { label: '📝 자유게시판', writable: true  },
};

export default function Board() {
  const { boardType = 'notice', postId } = useParams();
  const [posts, setPosts] = useState([]);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [form, setForm] = useState({ title: '', content: '' });
  const [comment, setComment] = useState('');
  const [view, setView] = useState('list'); // list | write | detail
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const board = BOARDS[boardType] || BOARDS.notice;

  useEffect(() => { fetchPosts(); setView('list'); }, [boardType]);

  const fetchPosts = async () => {
    try { const r = await api.get(`/board/${boardType}`); setPosts(r.data); }
    catch {}
  };

  const openDetail = async (id) => {
    try {
      const r = await api.get(`/board/post/${id}`);
      setPost(r.data.post); setComments(r.data.comments); setView('detail');
    } catch {}
  };

  const handleWrite = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post(`/board/${boardType}`, form);
      setToast({ message: '게시글이 등록되었습니다!', type: 'success' });
      setForm({ title: '', content: '' }); fetchPosts(); setView('list');
    } catch (err) {
      setToast({ message: err.response?.data?.error || '등록에 실패했습니다.', type: 'error' });
    } finally { setLoading(false); }
  };

  const handleComment = async (e) => {
    e.preventDefault(); if (!comment.trim()) return;
    try {
      await api.post(`/board/post/${post.id}/comment`, { content: comment });
      setComment(''); openDetail(post.id);
    } catch {}
  };

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="page-header">
        <div className="container">
          <h1>{board.label}</h1>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            {Object.entries(BOARDS).map(([k, v]) => (
              <Link key={k} to={`/board/${k}`} style={{ color: boardType === k ? '#c8a84b' : 'rgba(255,255,255,0.7)', fontWeight: boardType === k ? 700 : 400, fontSize: 14, borderBottom: boardType === k ? '2px solid #c8a84b' : '2px solid transparent', paddingBottom: 4 }}>
                {v.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        {view === 'list' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              {board.writable && user && (
                <button className="btn-primary" onClick={() => setView('write')} style={{ padding: '10px 24px' }}>+ 글쓰기</button>
              )}
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>번호</th>
                    <th>제목</th>
                    <th style={{ width: 100 }}>작성자</th>
                    <th style={{ width: 110 }}>날짜</th>
                    <th style={{ width: 70 }}>조회</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: '#aaa' }}>게시글이 없습니다.</td></tr>
                  ) : posts.map((p, i) => (
                    <tr key={p.id} onClick={() => openDetail(p.id)} style={{ cursor: 'pointer' }}>
                      <td style={{ color: '#aaa', fontSize: 13 }}>{p.is_notice ? <span style={{ color: '#c8a84b', fontWeight: 700 }}>공지</span> : posts.length - i}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {p.is_notice && <span style={{ background: '#2d4a22', color: '#fff', fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>공지</span>}
                          <span style={{ fontWeight: p.is_notice ? 700 : 400 }}>{p.title}</span>
                          {p.is_private && <span style={{ fontSize: 12 }}>🔒</span>}
                        </div>
                      </td>
                      <td style={{ color: '#888', fontSize: 13 }}>{p.author_name || '관리자'}</td>
                      <td style={{ color: '#aaa', fontSize: 12 }}>{new Date(p.created_at).toLocaleDateString('ko-KR')}</td>
                      <td style={{ color: '#aaa', fontSize: 13 }}>{p.view_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'write' && (
          <div style={{ maxWidth: 700 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>글쓰기</h2>
            <form className="card" onSubmit={handleWrite}>
              <div className="form-group">
                <label>제목 *</label>
                <input className="form-input" required placeholder="제목을 입력하세요" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>내용 *</label>
                <textarea className="form-input" required rows={10} placeholder="내용을 입력하세요" value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn-secondary" onClick={() => setView('list')} style={{ flex: 1, padding: '12px' }}>취소</button>
                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2, padding: '12px' }}>
                  {loading ? '등록 중...' : '게시글 등록'}
                </button>
              </div>
            </form>
          </div>
        )}

        {view === 'detail' && post && (
          <div style={{ maxWidth: 800 }}>
            <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', color: '#2d4a22', fontWeight: 700, fontSize: 14, marginBottom: 20, cursor: 'pointer' }}>
              ← 목록으로
            </button>
            <div className="card" style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{post.title}</h2>
              <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#aaa', paddingBottom: 20, borderBottom: '1px solid #eee', marginBottom: 24 }}>
                <span>👤 {post.author_name || '관리자'}</span>
                <span>📅 {new Date(post.created_at).toLocaleString('ko-KR')}</span>
                <span>👁 {post.view_count}</span>
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.9, whiteSpace: 'pre-wrap', color: '#333' }}>{post.content}</div>
            </div>

            {/* 댓글 */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>💬 댓글 {comments.length}개</h3>
              {comments.map(c => (
                <div key={c.id} style={{ background: '#f9fafb', borderRadius: 8, padding: '14px 16px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>👤 {c.name || '관리자'}</span>
                    <span style={{ fontSize: 12, color: '#aaa' }}>{new Date(c.created_at).toLocaleString('ko-KR')}</span>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.7 }}>{c.content}</p>
                </div>
              ))}
              {user ? (
                <form onSubmit={handleComment} style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <input className="form-input" placeholder="댓글을 입력하세요" value={comment}
                    onChange={e => setComment(e.target.value)} style={{ flex: 1 }} />
                  <button type="submit" className="btn-primary" style={{ padding: '12px 20px', flexShrink: 0 }}>등록</button>
                </form>
              ) : (
                <div style={{ marginTop: 16, textAlign: 'center', color: '#aaa', fontSize: 14 }}>
                  댓글을 작성하려면 <Link to="/login" style={{ color: '#2d4a22', fontWeight: 700 }}>로그인</Link>이 필요합니다.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
