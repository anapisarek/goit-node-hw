const nodemailer = require("nodemailer");
require("dotenv").config();

const { META_PASSWORD } = process.env;

const nodemailerConfig = {
	host: "gmail.com",
	port: 465,
	secure: true,
	auth: {
		user: "anabeblo@gmail.com",
		pass: META_PASSWORD,
	},
};

const transport = nodemailer.createTransport(nodemailerConfig);

const sendMail = async (data) => {
	const email = { ...data, from: "anabeblo@gmail.com" };
	await transport.sendMail(email);
	return true;
};

module.exports = sendMail;