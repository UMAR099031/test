const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createUser, findUserByLogin } = require("../db/repo");

function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role, login: user.login }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// Optional: keep classic register/login (можно не использовать для разового теста)
async function register(req, res, next) {
  try {
    const { name, surname, login, password } = req.body || {};
    if (!name || !surname || !login || !password) return res.status(400).json({ message: "Заполните все поля" });
    if (String(password).length < 6) return res.status(400).json({ message: "Пароль минимум 6 символов" });

    const passwordHash = await bcrypt.hash(String(password), 12);
    const user = await createUser({ name, surname, login, passwordHash, role: "student" });
    const token = signToken(user);
    return res.json({ token, user: { id: user.id, name: user.name, surname: user.surname, login: user.login, role: user.role } });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { login: loginRaw, password } = req.body || {};
    if (!loginRaw || !password) return res.status(400).json({ message: "Введите логин и пароль" });

    const user = findUserByLogin(loginRaw);
    if (!user) return res.status(401).json({ message: "Неверный логин или пароль" });
    if (user.isBlocked) return res.status(403).json({ message: "Аккаунт заблокирован" });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Неверный логин или пароль" });

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, name: user.name, surname: user.surname, login: user.login, role: user.role } });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res) {
  const user = req.user;
  return res.json({
    user: {
      id: String(user.id),
      name: user.name,
      surname: user.surname,
      login: user.login,
      role: user.role,
      isBlocked: user.isBlocked,
      passedExams: user.passedExams || [],
      createdAt: user.createdAt,
    },
  });
}

module.exports = { register, login, me };

