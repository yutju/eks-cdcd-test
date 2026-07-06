// backend/src/services/openemrClient.js
// ⚠️ 더 이상 사용하지 않습니다 (FHIR API 대신 openemrDirect.js로 전환됨).
// 롤백 대비로만 남겨둔 파일이며, 어떤 라우트도 이 파일을 import하지 않습니다.
const axios = require('axios');

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const resp = await axios.post(
    `${process.env.OPENEMR_BASE_URL}/oauth2/default/token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.OPENEMR_CLIENT_ID,
      client_secret: process.env.OPENEMR_CLIENT_SECRET,
      scope: process.env.OPENEMR_SCOPE,
    })
  );
  cachedToken = resp.data.access_token;
  tokenExpiry = Date.now() + (resp.data.expires_in - 30) * 1000;
  return cachedToken;
}

async function fhirRequest(method, path, data) {
  const token = await getAccessToken();
  return axios({
    method,
    url: `${process.env.OPENEMR_BASE_URL}/apis/default/fhir${path}`,
    headers: { Authorization: `Bearer ${token}` },
    data,
  }).then(r => r.data);
}

module.exports = {
  getPatientByOpenemrId: (pid) => fhirRequest('get', `/Patient/${pid}`),
  searchAppointments: (pid) => fhirRequest('get', `/Appointment?patient=${pid}`),
  createAppointment: (payload) => fhirRequest('post', `/Appointment`, payload),
  updateAppointment: (apptId, payload) => fhirRequest('put', `/Appointment/${apptId}`, payload),
  cancelAppointment: (apptId) => fhirRequest('put', `/Appointment/${apptId}`, {
    resourceType: 'Appointment', id: apptId, status: 'cancelled',
  }),
  getPatientDocuments: (pid, type) => fhirRequest('get', `/${type}?patient=${pid}`),
  getImmunizations: (pid) => fhirRequest('get', `/Immunization?patient=${pid}`),
};
