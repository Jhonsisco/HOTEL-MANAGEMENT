// config/nodemailer.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const enviarCorreo = async (destinatario, asunto, mensaje) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: destinatario,
    subject: asunto,
    text: mensaje,
  });
};

module.exports = { enviarCorreo };
