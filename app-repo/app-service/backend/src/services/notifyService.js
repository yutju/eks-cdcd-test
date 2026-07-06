// backend/src/services/notifyService.js
const nodemailer = require('nodemailer');
const CoolsmsMessageService = require('coolsms-node-sdk').default;
const { query } = require('../db/pool');

const messageService = new CoolsmsMessageService(
  process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET
);

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

async function sendSMS(phone, content) {
  try {
    await messageService.sendOne({ to: phone, from: process.env.SMS_SENDER, text: content });
    await query(
      `INSERT INTO notification_log (channel, purpose, content, success) VALUES ('sms','manual',?,1)`,
      [content]
    );
  } catch (err) {
    console.error('SMS 발송 실패', err);
  }
}

async function sendEmail(to, subject, html) {
  await mailer.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
}

module.exports = { sendSMS, sendEmail };
