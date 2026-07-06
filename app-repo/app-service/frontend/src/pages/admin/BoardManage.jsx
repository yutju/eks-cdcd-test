// src/pages/admin/BoardManage.jsx
import { useState, useEffect } from 'react';
import adminApi from '../../api/adminClient';
import Toast from '../../components/common/Toast';

const BOARDS = {
  notice: '📢 공지사항',
  faq:    '❓ FAQ',
  qna:    '💬 Q&A',
  free:   '📝 자유게시판',
};

export default function BoardManage() {
  const [boardType, setBoardType] = useState('notice');
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ title: '', content: '', isNotice: false });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const r = await adminApi.get(`/admin/board/${boardType}`);
      setPosts(r.data);
    } catch (err) {
      setToast({ message: err.response?.data?.error || '조회에 실패했습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); setShowForm(false); }, [boardType]);

  const handleWrite = async (e) => {
    e.preventDefault();
    try {
      await adminApi.post(`/admin/board/${boardType}`, form);
      setToast({ message: '게시글이 등록되었습니다.', type: 'success' });
      setForm({ title: '', content: '', isNotice: false });
      setShowForm(false);
      fetchPosts();
    } catch (err) {
      setToast({ message: err.response?.data?.error || '등록에 실패했습니다.', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('이 게시글을 삭제하시겠습니까? 댓글도 함께 삭제됩니다.')) return;
    try {
      await adminApi.delete(`/admin/board/post/${id}`);
      setToast({ message: '삭제되었습니다.', type: 'success' });
      fetchPosts();
    } catch (err) {
      setToast({ message: err.response?.data?.error || '삭제에 실패했습니다.', type: 'error' });
    }
  };

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {Object.entries(BOARDS).map(([k, label]) => (
          <button key={k} onClick={() => setBoardType(k)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '6px 0',
              fontWeight: boardType === k ? 700 : 400,
              color: boardType === k ? '#2d4a22' : '#888',
              borderBottom: boardType === k ? '2px solid #2d4a22' : '2px solid transparent',
            }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)} style={{ padding: '10px 24px' }}>
          {showForm ? '취소' : '+ 글쓰기'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleWrite} className="card" style={{ marginBottom: 24 }}>
          <div className="form-group">
            <label>제목 *</label>
            <input className="form-input" required value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label>내용 *</label>
            <textarea className="form-input" required rows={6} value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })} style={{ resize: 'vertical' }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 16 }}>
            <input type="checkbox" checked={form.isNotice}
              onChange={e => setForm({ ...form, isNotice: e.target.checked })} />
            공지로 상단 고정
          </label>
          <button type="submit" className="btn-primary" style={{ padding: '12px 24px' }}>등록</button>
        </form>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>제목</th>
              <th style={{ width: 100 }}>공지</th>
              <th style={{ width: 110 }}>날짜</th>
              <th style={{ width: 70 }}>조회</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>불러오는 중...</td></tr>
            ) : posts.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>게시글이 없습니다.</td></tr>
            ) : posts.map(p => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{p.is_notice ? '공지' : '-'}</td>
                <td style={{ color: '#aaa', fontSize: 12 }}>{new Date(p.created_at).toLocaleDateString('ko-KR')}</td>
                <td style={{ color: '#aaa', fontSize: 13 }}>{p.view_count}</td>
                <td>
                  <button onClick={() => handleDelete(p.id)}
                    style={{ fontSize: 12, background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#c0392b' }}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
