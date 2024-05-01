const nodemailer = require("nodemailer");
// const pug = require("pug");
const { html } = require("./htmlEmail");
module.exports = class Email {
  constructor(user, resetcode) {
    this.to = user.email;
    this.username = user.name.split(" ")[0];
    this.resetcode = resetcode;
    this.from = `${process.env.myEmail}`;
  }
  newTransport() {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.myEmail,
        pass: process.env.emailPassword,
      },
    });
  }
  async send() {
    console.log(this.to);
    const mailOptions = {
      from: "Balizaar ecommerce app <abdulwadoodowner@gmail.com>",
      to: this.to,
      subject: "Balizaar verification code",
      html: html.replace("#code#", this.resetcode),
      //   html:
    };

    await this.newTransport().sendMail(mailOptions);
  }
  async sendWelcome() {
    await this.send("Welcome", "Welcome to the starschat!");
  }
  async sendVerificationCode() {
    await this.send();
  }
};
