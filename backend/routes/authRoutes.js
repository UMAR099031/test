const express = require("express");
const { register, login, me } = require("../controllers/authController");
const { codeLogin } = require("../controllers/codeController");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/code-login", codeLogin);
router.get("/me", authRequired, me);

module.exports = router;
