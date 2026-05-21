const { load, update } = require("./jsonDb");
const { id } = require("./id");

function normalizeLogin(login) {
  return String(login || "").trim().toLowerCase();
}

function normalizeCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
}

function nowIso() {
  return new Date().toISOString();
}

async function createUser({ name, surname, login, passwordHash, role = "student" }) {
  const normalized = normalizeLogin(login);
  return update((db) => {
    if (db.users.some((u) => u.login === normalized)) {
      const err = new Error("Логин уже занят");
      err.statusCode = 409;
      throw err;
    }
    const user = {
      id: id("usr"),
      name: String(name).trim(),
      surname: String(surname).trim(),
      login: normalized,
      passwordHash,
      role,
      passedExams: [],
      isBlocked: false,
      createdAt: nowIso(),
    };
    db.users.push(user);
    return user;
  });
}

function findUserByLogin(login) {
  const db = load();
  const normalized = normalizeLogin(login);
  return db.users.find((u) => u.login === normalized) || null;
}

function findUserById(userId) {
  const db = load();
  return db.users.find((u) => u.id === String(userId)) || null;
}

async function updateUser(userId, patch) {
  return update((db) => {
    const idx = db.users.findIndex((u) => u.id === String(userId));
    if (idx < 0) return null;
    db.users[idx] = { ...db.users[idx], ...patch };
    return db.users[idx];
  });
}

async function ensureAdmin({ login, passwordHash }) {
  const normalized = normalizeLogin(login);
  return update((db) => {
    let user = db.users.find((u) => u.login === normalized);
    if (user) {
      if (user.role !== "admin") user.role = "admin";
      if (passwordHash && user.passwordHash !== passwordHash) user.passwordHash = passwordHash;
      return user;
    }
    user = {
      id: id("usr"),
      name: "Admin",
      surname: "Panel",
      login: normalized,
      passwordHash,
      role: "admin",
      passedExams: [],
      isBlocked: false,
      createdAt: nowIso(),
    };
    db.users.push(user);
    return user;
  });
}

function listExams(examsData) {
  return Object.keys(examsData).map((examType) => {
    const exam = examsData[examType];
    return { examType, title: exam.title, durationMinutes: exam.durationMinutes, questionsCount: exam.questions.length };
  });
}

function getMyResults(userId) {
  const db = load();
  return db.results.filter((r) => r.userId === String(userId)).sort((a, b) => String(b.finishedAt).localeCompare(String(a.finishedAt)));
}

function getMyResultByExam(userId, examType) {
  const db = load();
  const type = String(examType || "").toLowerCase();
  return db.results.find((r) => r.userId === String(userId) && r.examType === type) || null;
}

async function createResultAndMarkPassed({ userId, examType, score, percent, answers, finishedAt }) {
  const type = String(examType || "").toLowerCase();
  return update((db) => {
    const user = db.users.find((u) => u.id === String(userId));
    if (!user) {
      const err = new Error("Пользователь не найден");
      err.statusCode = 401;
      throw err;
    }
    if (user.isBlocked) {
      const err = new Error("Аккаунт заблокирован");
      err.statusCode = 403;
      throw err;
    }

    const already = db.results.find((r) => r.userId === String(userId) && r.examType === type);
    if (already || (user.passedExams || []).some((p) => p.examType === type)) {
      const err = new Error("Вы уже прошли этот экзамен");
      err.statusCode = 409;
      throw err;
    }

    const result = {
      id: id("res"),
      userId: String(userId),
      examType: type,
      score,
      percent,
      answers: answers.map((v) => (Number.isInteger(v) ? v : -1)),
      finishedAt,
    };
    db.results.push(result);
    user.passedExams = user.passedExams || [];
    user.passedExams.push({ examType: type, resultId: result.id, finishedAt });
    return result;
  });
}

async function deleteResult(resultId) {
  return update((db) => {
    const idx = db.results.findIndex((r) => r.id === String(resultId));
    if (idx < 0) {
      const err = new Error("Результат не найден");
      err.statusCode = 404;
      throw err;
    }
    const [deleted] = db.results.splice(idx, 1);
    const user = db.users.find((u) => u.id === deleted.userId);
    if (user && Array.isArray(user.passedExams)) {
      user.passedExams = user.passedExams.filter((p) => p.examType !== deleted.examType);
    }
    return deleted;
  });
}

function listUsers(q) {
  const db = load();
  const s = String(q || "").trim().toLowerCase();
  let users = [...db.users];
  users.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  if (!s) return users;
  return users.filter((u) => `${u.name} ${u.surname} ${u.login}`.toLowerCase().includes(s));
}

function listResults({ q, examType }) {
  const db = load();
  const s = String(q || "").trim().toLowerCase();
  const type = String(examType || "").trim().toLowerCase();

  let results = [...db.results];
  results.sort((a, b) => String(b.finishedAt).localeCompare(String(a.finishedAt)));
  if (type && ["html", "css", "js"].includes(type)) results = results.filter((r) => r.examType === type);

  const usersById = new Map(db.users.map((u) => [u.id, u]));
  let rows = results.map((r) => {
    const u = usersById.get(r.userId);
    return {
      id: r.id,
      userId: r.userId,
      name: u?.name || "—",
      surname: u?.surname || "",
      login: u?.login || "",
      isBlocked: Boolean(u?.isBlocked),
      examType: r.examType,
      score: r.score,
      percent: r.percent,
      finishedAt: r.finishedAt,
    };
  });

  if (s) rows = rows.filter((row) => `${row.name} ${row.surname} ${row.login} ${row.examType}`.toLowerCase().includes(s));
  return rows;
}

async function setUserBlocked(userId, isBlocked) {
  return update((db) => {
    const user = db.users.find((u) => u.id === String(userId));
    if (!user) {
      const err = new Error("Пользователь не найден");
      err.statusCode = 404;
      throw err;
    }
    user.isBlocked = Boolean(isBlocked);
    return user;
  });
}

async function createAccessCodes({ count, createdBy }) {
  const n = Math.min(Math.max(1, Number(count) || 10), 200);
  const crypto = require("crypto");
  const make = () => crypto.randomBytes(6).toString("base64url").toUpperCase().slice(0, 10);
  return update((db) => {
    const codes = [];
    for (let i = 0; i < n; i += 1) {
      let code = make();
      while (db.accessCodes.some((c) => c.code === code)) code = make();
      db.accessCodes.push({ code, createdBy: createdBy || null, userId: null, usedAt: null, isDisabled: false, createdAt: nowIso() });
      codes.push(code);
    }
    return codes;
  });
}

function findAccessCode(codeRaw) {
  const db = load();
  const code = normalizeCode(codeRaw);
  return db.accessCodes.find((c) => c.code === code) || null;
}

async function useAccessCode({ codeRaw, userId }) {
  const code = normalizeCode(codeRaw);
  return update((db) => {
    const doc = db.accessCodes.find((c) => c.code === code);
    if (!doc) {
      const err = new Error("Неверный код");
      err.statusCode = 401;
      throw err;
    }
    if (doc.isDisabled) {
      const err = new Error("Код отключён");
      err.statusCode = 403;
      throw err;
    }
    if (doc.usedAt || doc.userId) {
      const err = new Error("Код уже использован");
      err.statusCode = 409;
      throw err;
    }
    doc.userId = String(userId);
    doc.usedAt = nowIso();
    return doc;
  });
}

function listAccessCodes(q) {
  const db = load();
  const s = String(q || "").trim().toUpperCase();
  let codes = [...db.accessCodes];
  codes.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  if (!s) return codes;
  return codes.filter((c) => String(c.code || "").includes(s));
}

async function setAccessCodeDisabled(codeRaw, isDisabled) {
  const code = normalizeCode(codeRaw);
  return update((db) => {
    const doc = db.accessCodes.find((c) => c.code === code);
    if (!doc) {
      const err = new Error("Код не найден");
      err.statusCode = 404;
      throw err;
    }
    doc.isDisabled = Boolean(isDisabled);
    return doc;
  });
}

module.exports = {
  normalizeLogin,
  normalizeCode,
  createUser,
  findUserByLogin,
  findUserById,
  updateUser,
  ensureAdmin,
  listExams,
  getMyResults,
  getMyResultByExam,
  createResultAndMarkPassed,
  deleteResult,
  listUsers,
  listResults,
  setUserBlocked,
  createAccessCodes,
  findAccessCode,
  useAccessCode,
  listAccessCodes,
  setAccessCodeDisabled,
};

