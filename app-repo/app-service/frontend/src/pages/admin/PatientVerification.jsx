// src/pages/admin/PatientVerification.jsx
import { useState, useEffect } from 'react';
import adminApi from '../../api/adminClient';
import Toast from '../../components/common/Toast';

export default function PatientVerification() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | true | false
  const [pidInput, setPidInput] = useState({}); // { [patientId]: value }
  const [candidates, setCandidates] = useState({}); // { [patientId]: [매칭 후보...] }
  const [autoLinking, setAutoLinking] = useState({}); // { [patientId]: true }
  const [checkingStatus, setCheckingStatus] = useState({}); // { [patientId]: true }
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filter !== 'all') params.verified = filter;
      const r = await adminApi.get('/admin/patients', { params });
      setPatients(r.data);
    } catch (err) {
      setToast({ message: err.response?.data?.error || '조회에 실패했습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, [filter]);

  const handleSearch = (e) => { e.preventDefault(); fetchPatients(); };

  const handleVerify = async (id, pidOverride) => {
    const openemrPid = (pidOverride ?? pidInput[id])?.trim();
    if (!openemrPid) {
      setToast({ message: 'OpenEMR 환자 ID를 입력하세요.', type: 'error' });
      return;
    }
    try {
      await adminApi.put(`/admin/patients/${id}/verify`, { openemrPid });
      setToast({ message: '실명확인이 완료되었습니다.', type: 'success' });
      setCandidates(prev => ({ ...prev, [id]: undefined }));
      fetchPatients();
    } catch (err) {
      setToast({ message: err.response?.data?.error || '처리에 실패했습니다.', type: 'error' });
    }
  };

  const handleUnverify = async (id) => {
    try {
      await adminApi.put(`/admin/patients/${id}/unverify`);
      setToast({ message: '인증이 해제되었습니다.', type: 'success' });
      fetchPatients();
    } catch (err) {
      setToast({ message: err.response?.data?.error || '처리에 실패했습니다.', type: 'error' });
    }
  };

  const handleAutoLink = async (id) => {
    setAutoLinking(prev => ({ ...prev, [id]: true }));
    setCandidates(prev => ({ ...prev, [id]: undefined }));
    try {
      const r = await adminApi.post(`/admin/patients/${id}/auto-link`);
      if (r.data.status === 'linked') {
        setToast({ message: `자동 연동되었습니다. (PID: ${r.data.openemrPid})`, type: 'success' });
        fetchPatients();
      } else if (r.data.status === 'no_match') {
        setToast({ message: '자동 매칭되는 OpenEMR 환자가 없습니다. 수동으로 입력해주세요.', type: 'error' });
      } else if (r.data.status === 'ambiguous') {
        setCandidates(prev => ({ ...prev, [id]: r.data.candidates }));
        setToast({ message: `동명이인 등 후보가 ${r.data.candidates.length}건 있습니다. 아래에서 선택해주세요.`, type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.response?.data?.error || '자동 연동에 실패했습니다.', type: 'error' });
    } finally {
      setAutoLinking(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleCheckStatus = async (id) => {
    setCheckingStatus(prev => ({ ...prev, [id]: true }));
    try {
      const r = await adminApi.get(`/admin/patients/${id}/openemr-status`);
      if (r.data.status === 'valid') {
        setToast({ message: `정상 연동 상태입니다. (PID: ${r.data.openemrPid})`, type: 'success' });
      } else if (r.data.status === 'invalid') {
        setToast({ message: `⚠️ 연동된 PID(${r.data.openemrPid})가 OpenEMR에 존재하지 않습니다. 재확인이 필요합니다.`, type: 'error' });
      } else {
        setToast({ message: '아직 연동되지 않은 환자입니다.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.response?.data?.error || '상태 확인에 실패했습니다.', type: 'error' });
    } finally {
      setCheckingStatus(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input className="form-input" placeholder="이름 / 아이디 / 전화번호 검색"
          value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
        <button type="submit" className="btn-secondary" style={{ padding: '10px 20px' }}>검색</button>
        <select className="form-input" value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="all">전체</option>
          <option value="false">미인증만</option>
          <option value="true">인증완료만</option>
        </select>
      </form>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>이름</th>
              <th>아이디</th>
              <th>전화번호</th>
              <th>가입일</th>
              <th style={{ width: 100 }}>상태</th>
              <th style={{ width: 340 }}>OpenEMR 연동</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>불러오는 중...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>환자가 없습니다.</td></tr>
            ) : patients.map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td style={{ color: '#888', fontSize: 13 }}>{p.login_id}</td>
                <td style={{ color: '#888', fontSize: 13 }}>{p.phone}</td>
                <td style={{ color: '#aaa', fontSize: 12 }}>{new Date(p.created_at).toLocaleDateString('ko-KR')}</td>
                <td>
                  {p.is_verified
                    ? <span style={{ color: '#2d4a22', fontWeight: 700, fontSize: 13 }}>✅ 인증완료</span>
                    : <span style={{ color: '#c8a84b', fontWeight: 700, fontSize: 13 }}>⏳ 미인증</span>}
                </td>
                <td>
                  {p.is_verified ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: '#888' }}>PID: {p.openemr_pid}</span>
                      <button onClick={() => handleCheckStatus(p.id)} disabled={checkingStatus[p.id]}
                        style={{ fontSize: 12, background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                        {checkingStatus[p.id] ? '확인 중...' : '인증상태확인'}
                      </button>
                      <button onClick={() => handleUnverify(p.id)}
                        style={{ fontSize: 12, background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                        해제
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: candidates[p.id] ? 8 : 0 }}>
                        <button onClick={() => handleAutoLink(p.id)} disabled={autoLinking[p.id]} className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: 13, flexShrink: 0 }}>
                          {autoLinking[p.id] ? '조회 중...' : '⚡ 자동연동 시도'}
                        </button>
                        <input className="form-input" placeholder="OpenEMR 환자 ID (수동)"
                          value={pidInput[p.id] || ''}
                          onChange={e => setPidInput({ ...pidInput, [p.id]: e.target.value })}
                          style={{ padding: '6px 10px', fontSize: 13, width: 140 }} />
                        <button onClick={() => handleVerify(p.id)} className="btn-primary"
                          style={{ padding: '6px 14px', fontSize: 13, flexShrink: 0 }}>
                          연동
                        </button>
                      </div>
                      {candidates[p.id] && candidates[p.id].length > 0 && (
                        <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 6, padding: 8 }}>
                          <div style={{ fontSize: 11, color: '#795548', marginBottom: 6 }}>동명이인 후보 - 맞는 사람을 선택하세요</div>
                          {candidates[p.id].map(c => (
                            <button key={c.pid} onClick={() => handleVerify(p.id, String(c.pid))}
                              style={{ display: 'block', width: '100%', textAlign: 'left', fontSize: 12, background: '#fff', border: '1px solid #eee', borderRadius: 6, padding: '6px 10px', marginBottom: 4, cursor: 'pointer' }}>
                              PID {c.pid} · {c.fname}{c.lname} · {c.DOB ? new Date(c.DOB).toLocaleDateString('ko-KR') : '생년월일 없음'} · {c.phone_cell || c.phone_home || '전화번호 없음'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
