const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const { normalizeCode, createUser, useAccessCode, createAccessCodes, listAccessCodes, setAccessCodeDisabled } = require("../db/repo");

function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role, login: user.login }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

async function codeLogin(req, res, next) {
  try {
    const { code: rawCode, name, surname } = req.body || {};
    const code = normalizeCode(rawCode);
    if (!code) return res.status(400).json({ message: "Введите код" });
    if (!name || !surname) return res.status(400).json({ message: "Введите имя и фамилию" });

    // Create a user tied to this code (unique login)
    const passwordHash = await bcrypt.hash(crypto.randomBytes(18).toString("hex"), 12);
    const login = `code_${code.toLowerCase()}`;
    const user = await createUser({ name, surname, login, passwordHash, role: "student" });

    // Mark code as used by this user
    await useAccessCode({ codeRaw: code, userId: user.id });

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, name: user.name, surname: user.surname, login: user.login, role: user.role } });
  } catch (err) {
    return next(err);
  }
}

async function adminCreateCodes(req, res, next) {
  try {
    const count = Number(req.body?.count ?? 10);
    const codes = await createAccessCodes({ count, createdBy: req.user?.id || null });
    return res.json({ codes });
  } catch (err) {
    return next(err);
  }
}

async function adminListCodes(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    const codes = listAccessCodes(q);
    return res.json({ codes });
  } catch (err) {
    return next(err);
  }
}

async function adminDisableCode(req, res, next) {
  try {
    const code = normalizeCode(req.params.code);
    const updated = await setAccessCodeDisabled(code, Boolean(req.body?.isDisabled));
    return res.json({ code: updated });
  } catch (err) {
    return next(err);
  }
}

module.exports = { codeLogin, adminCreateCodes, adminListCodes, adminDisableCode };

