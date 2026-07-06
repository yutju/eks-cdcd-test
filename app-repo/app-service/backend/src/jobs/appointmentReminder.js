// backend/src/jobs/appointmentReminder.js (MySQL 버전)
const cron = require('node-cron');
const { query } = require('../db/pool');
const { sendSMS, sendEmail } = require('../services/notifyService');

cron.schedule('0 * * * *', async () => {
  const { rows } = await query(`
    SELECT a.id, a.start_time, p.phone, p.email, p.name
    FROM appointment_local a
    JOIN patients_local p ON p.id = a.patient_id
    WHERE a.status='booked' AND a.notify_sent=0
      AND a.start_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
  `);

  for (const appt of rows) {
    const msg = `[병원] ${appt.name}님, 내일 ${appt.start_time} 예약이 있습니다.`;
    await sendSMS(appt.phone, msg);
    if (appt.email) await sendEmail(appt.email, '진료예약 안내', `<p>${msg}</p>`);
    await query('UPDATE appointment_local SET notify_sent=1 WHERE id=?', [appt.id]);
  }
});
