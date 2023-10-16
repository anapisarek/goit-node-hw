const express = require('express');
const {registerUser, loginUser, currentUser, logoutUser, updateAvatar, verifyEmail, resendVerifyEmail} = require('../../controllers/users');
const { checkCreateUserData, auth, upload, checkUserEmailData } = require('../../middlewares/userMiddlewares');

const router = express.Router();

router.post('/register', checkCreateUserData, registerUser);

router.post('/login', checkCreateUserData, loginUser);

router.get('/current', auth, currentUser);

router.post('/logout', auth, logoutUser);

router.patch('/avatars', auth, upload.single("avatar"), updateAvatar);

router.get('/verify/:verificationToken', verifyEmail);

router.post('/verify', checkUserEmailData, resendVerifyEmail);

module.exports = router