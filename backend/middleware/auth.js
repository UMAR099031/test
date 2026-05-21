const jwt = require("jsonwebtoken");
const { findUserById } = require("../db/repo");

function getTokenFromHeader(req) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

async function authRequired(req, res, next) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return res.status(401).json({ message: "Не авторизован" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = findUserById(payload.sub);
    if (!user) return res.status(401).json({ message: "Пользователь не найден" });
    if (user.isBlocked) return res.status(403).json({ message: "Аккаунт заблокирован" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Неверный токен" });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Только администратор" });
  }
  next();
}

module.exports = { authRequired, adminOnly };
