// backend/src/routes/medical.js
// OpenEMR FHIR API 대신 OpenEMR DB에 직접 쿼리하는 버전입니다.
const express = require('express');
const jwtAuth = require('../middleware/jwtAuth');
const openemr = require('../services/openemrDirect');
const { query } = require('../db/pool');
const router = express.Router();

async function getOpenemrPid(userId) {
  const { rows } = await query('SELECT openemr_pid FROM patients_local WHERE id=?', [userId]);
  return rows[0]?.openemr_pid;
}

// 공통 핸들러: openemr_pid가 없으면 OpenEMR을 조회하지 않고 안내 메시지를 반환하고,
// OpenEMR DB 조회가 실패해도 서버가 죽지 않도록 에러를 잡아 처리합니다.
function medicalHandler(fetcher) {
  return async (req, res) => {
    try {
      const pid = await getOpenemrPid(req.userId);
      if (!pid) {
        return res.status(400).json({ error: '본인확인(OpenEMR 연동)이 필요합니다. 의무대에 문의해주세요.' });
      }
      const data = await fetcher(pid);
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(502).json({ error: '의무기록 시스템(OpenEMR DB) 조회 중 오류가 발생했습니다.' });
    }
  };
}

router.get('/lab-results', jwtAuth, medicalHandler(pid => openemr.getLabResults(pid)));
router.get('/prescriptions', jwtAuth, medicalHandler(pid => openemr.getPrescriptions(pid)));
router.get('/documents', jwtAuth, medicalHandler(pid => openemr.getDocuments(pid)));
router.get('/immunizations', jwtAuth, medicalHandler(pid => openemr.getImmunizations(pid)));
router.get('/checkup-results', jwtAuth, medicalHandler(pid => openemr.getVitals(pid)));

// 문서 파일 다운로드 (본인 소유 문서인지 pid로 확인 후 서빙)
router.get('/documents/:docId/file', jwtAuth, async (req, res) => {
  try {
    const pid = await getOpenemrPid(req.userId);
    if (!pid) {
      return res.status(400).json({ error: '본인확인(OpenEMR 연동)이 필요합니다. 의무대에 문의해주세요.' });
    }
    const doc = await openemr.getDocumentFile(req.params.docId, pid);
    if (!doc) {
      return res.status(404).json({ error: '문서를 찾을 수 없습니다.' });
    }
    if (doc.document_data) {
      // document_data가 base64로 저장되어 있다고 가정 (OpenEMR 기본 blob 저장 방식)
      const buffer = Buffer.from(doc.document_data, 'base64');
      res.setHeader('Content-Type', doc.mimetype || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.name || 'document')}"`);
      return res.send(buffer);
    }
    if ((doc.type === 'web_url' || doc.type === 'file_url') && /^https?:\/\//i.test(doc.url || '')) {
      return res.redirect(doc.url);
    }
    // url이 서버 로컬 파일 경로 등 - OpenEMR 파일 서버(디스크)에 저장된 경우
    // 이 서버(환자포털 backend)에서 직접 접근할 방법이 없습니다.
    return res.status(501).json({
      error: '이 문서는 OpenEMR 파일 서버(디스크)에 저장되어 있어 포털에서 직접 열 수 없습니다. 의무대에 문의해주세요.',
    });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: '문서 조회 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
