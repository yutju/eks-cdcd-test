// src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import { useAuth } from '../hooks/useAuth';
import Toast from '../components/common/Toast';

export default function Login() {
  const [form, setForm] = useState({ loginId: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.name);
      setToast({ message: `${res.data.name}님 환영합니다!`, type: 'success' });
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      setToast({ message: err.response?.data?.error || '로그인에 실패했습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'linear-gradient(135deg, #f4f5f0 0%, #e8ead0 100%)' }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* 상단 로고 */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 72, height: 72, background: '#2d4a22', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px', boxShadow: '0 4px 20px rgba(45,74,34,0.3)' }}>✚</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a2e14' }}>환자포털 로그인</h1>
          <p style={{ color: '#888', fontSize: 14, marginTop: 6 }}>육군훈련소 의무대</p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ padding: 36, boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
          <div className="form-group">
            <label>아이디</label>
            <input className="form-input" placeholder="아이디를 입력하세요" value={form.loginId}
              onChange={e => setForm({ ...form, loginId: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>비밀번호</label>
            <input className="form-input" type="password" placeholder="비밀번호를 입력하세요" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}
            style={{ width: '100%', padding: '14px', fontSize: 16, marginTop: 8 }}>
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#888' }}>
            계정이 없으신가요?{' '}
            <Link to="/signup" style={{ color: '#2d4a22', fontWeight: 700 }}>회원가입</Link>
          </div>
        </form>

        <div style={{ marginTop: 20, background: 'rgba(200,168,75,0.15)', border: '1px solid rgba(200,168,75,0.5)', borderRadius: 8, padding: '14px 18px', fontSize: 13, color: '#6b5a2d' }}>
          ⚠ 이 시스템은 육군훈련소 장병 및 관계자만 이용 가능합니다.
        </div>
      </div>
    </div>
  );
}
