import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const email = process.env.EMAIL_SUP;
const senha = process.env.PASS_SUP;

const sendEmail = (recipient, origin, title, description) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: email,
      pass: senha,
    },
  });

  const htmlContent = `<h1 class="text-aling: center; margin-bottom: 1rem; font-size: 1.2rem;">${title}</h1><p>${description}</p>`;

  const mailOptions = {
    from: email, // Remetente
    to: recipient, // Destinatário
    subject: origin, // Assunto
    html: htmlContent, // Conteúdo HTML
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log("Erro ao enviar o e-mail: " + error);
    }
    console.log("E-mail enviado: " + info.response);
  });
};

export { sendEmail };
