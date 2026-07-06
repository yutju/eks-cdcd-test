// src/pages/admin/AdminLogin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../api/adminClient';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import Toast from '../../components/common/Toast';

export default function AdminLogin() {
  const [form, setForm] = useState({ loginId: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminApi.post('/admin/auth/login', form);
      login(res.data.token, res.data.name);
      navigate('/staff');
    } catch (err) {
      setToast({ message: err.response?.data?.error || '로그인에 실패했습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#1a2e14' }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>관리자 로그인</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 6 }}>육군훈련소 환자포털 관리자 페이지</p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ padding: 32 }}>
          <div className="form-group">
            <label>관리자 아이디</label>
            <input className="form-input" value={form.loginId}
              onChange={e => setForm({ ...form, loginId: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>비밀번호</label>
            <input className="form-input" type="password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}
            style={{ width: '100%', padding: '14px', fontSize: 16, marginTop: 8 }}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
