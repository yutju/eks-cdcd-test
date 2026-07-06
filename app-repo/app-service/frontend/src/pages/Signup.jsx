// src/pages/Signup.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import Toast from '../components/common/Toast';

export default function Signup() {
  const [form, setForm] = useState({ loginId: '', password: '', passwordConfirm: '', name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.passwordConfirm) {
      setToast({ message: '비밀번호가 일치하지 않습니다.', type: 'error' }); return;
    }
    if (form.password.length < 8) {
      setToast({ message: '비밀번호는 8자 이상이어야 합니다.', type: 'error' }); return;
    }
    setLoading(true);
    try {
      await api.post('/auth/signup', { loginId: form.loginId, password: form.password, name: form.name, phone: form.phone, email: form.email });
      setToast({ message: '회원가입이 완료되었습니다!', type: 'success' });
      setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      setToast({ message: err.response?.data?.error || '회원가입에 실패했습니다.', type: 'error' });
    } finally { setLoading(false); }
  };

  const f = (key) => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'linear-gradient(135deg, #f4f5f0 0%, #e8ead0 100%)' }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div style={{ width: '100%', maxWidth: 500 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, background: '#2d4a22', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 14px', boxShadow: '0 4px 20px rgba(45,74,34,0.3)' }}>✚</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a2e14' }}>환자포털 회원가입</h1>
          <p style={{ color: '#888', fontSize: 14, marginTop: 6 }}>육군훈련소 의무대 환자포털</p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ padding: 36, boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>이름 *</label>
              <input className="form-input" placeholder="실명을 입력하세요" required {...f('name')} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>아이디 *</label>
              <input className="form-input" placeholder="영문/숫자 6~20자" required {...f('loginId')} />
            </div>
            <div className="form-group">
              <label>비밀번호 *</label>
              <input className="form-input" type="password" placeholder="8자 이상" required {...f('password')} />
            </div>
            <div className="form-group">
              <label>비밀번호 확인 *</label>
              <input className="form-input" type="password" placeholder="비밀번호 재입력" required {...f('passwordConfirm')} />
            </div>
            <div className="form-group">
              <label>휴대폰 *</label>
              <input className="form-input" placeholder="010-0000-0000" required {...f('phone')} />
            </div>
            <div className="form-group">
              <label>이메일</label>
              <input className="form-input" type="email" placeholder="선택 입력" {...f('email')} />
            </div>
          </div>

          <div style={{ background: '#f4f5f0', borderRadius: 8, padding: '14px 16px', fontSize: 13, color: '#666', marginBottom: 20, lineHeight: 1.7 }}>
            ✔ 수집된 개인정보는 의료서비스 제공 목적으로만 사용됩니다.<br />
            ✔ 회원가입 후 의무대 방문 시 실명 확인이 필요합니다.
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: 16 }}>
            {loading ? '처리 중...' : '회원가입 완료'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#888' }}>
            이미 계정이 있으신가요? <Link to="/login" style={{ color: '#2d4a22', fontWeight: 700 }}>로그인</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
