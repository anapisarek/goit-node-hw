const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const gravatar = require('gravatar');
const path = require('path');
const fs = require('fs/promises');
const jimp = require('jimp');
const uuid = require('uuid').v4;
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const { sendEmail } = require('../helpers/sendEmail');

const registerUser = catchAsync(async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      return res.status(409).json({ "message": "Email in use" });
    }

    const avatarURL = gravatar.url(email);
    const verificationToken = uuid();

    const result = await User.create({
      email,
      password,
      avatarURL,
      verificationToken
    });

    const mail = {
      to: email,
      subject: "Confirmation of registration",
      html: `<a href="http://localhost:3000/users/verify/${verificationToken}" target="_blank">Click to confirm your email</a>`
    };

    await sendEmail(mail);

    res.status(201).json({
      user: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const loginUser = catchAsync(async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    const match = await bcrypt.compare(password, user.password);

    if (!user || !match) {
      return res.status(401).json({ "message": "Email or password is wrong" });
    }

    if (!user.verify) {
      return res.status(401).json({ "message": "Email not verified" });
    }

    const payload = {
      id: user._id
    };

    const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "1d" });

    await User.findByIdAndUpdate(user._id, { token });

    res.status(200).json({
      token,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const currentUser = catchAsync(async (req, res) => {
  try {
    const { email, subscription } = req.user;

    res.status(200).json({
      user: { email, subscription }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const logoutUser = catchAsync(async (req, res) => {
  try {
    const { _id } = req.user;

    await User.findByIdAndUpdate(_id, { token: null });

    res.status(204).json();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const avatarDir = path.join(__dirname, "../", "public", "avatars");

const updateAvatar = catchAsync(async (req, res) => {
  let tempPath;

  try {
    const { path: tempPath, originalname } = req.file;
    const { _id: id } = req.user;
    const imageName = `${id}_${originalname}`;
    const resultUpload = path.join(avatarDir, imageName);

    await jimp.read(tempPath).then((img) => {
      return img.resize(250, 250).write(resultUpload);
    });

    const avatarURL = path.join("public", "avatars", imageName);

    await User.findByIdAndUpdate(req.user._id, { avatarURL });

    res.status(200).json({ avatarURL });
  } catch (error) {
    if (tempPath) {
      await fs.unlink(tempPath);
    }
    res.status(500).json({ error: error.message });
  }
});

const verifyEmail = catchAsync(async (req, res) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.status(404).json({ "message": "User not found" });
    }

    await User.findByIdAndUpdate(user._id, { verify: true, verificationToken: "" });

    res.status(200).json({ "message": "Verification successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const resendVerifyEmail = catchAsync(async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!email) {
      return res.status(400).json({ "message": "missing required field email" });
    }

    if (!user) {
      return res.status(404).json({ "message": "Not found" });
    }

    if (user.verify) {
      return res.status(400).json({ "message": "Verification has already been passed" });
    }

    const mail = {
      to: email,
      subject: "Confirmation of registration",
      html: `<a href="http://localhost:3000/users/verify/${user.verificationToken}" target="_blank">Click to confirm your email</a>`
    };

    await sendEmail(mail);

    res.status(200).json({ "message": "Verification email sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  registerUser,
  loginUser,
  currentUser,
  logoutUser,
  updateAvatar,
  verifyEmail,
  resendVerifyEmail
};