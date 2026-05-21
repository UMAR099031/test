const { listUsers, setUserBlocked, listResults, deleteResult } = require("../db/repo");

async function listUsersHandler(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    const users = listUsers(q).map((u) => ({
      _id: u.id, // keep frontend compatibility
      name: u.name,
      surname: u.surname,
      login: u.login,
      role: u.role,
      isBlocked: Boolean(u.isBlocked),
      passedExams: u.passedExams || [],
      createdAt: u.createdAt,
    }));
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
}

async function blockUser(req, res, next) {
  try {
    const updated = await setUserBlocked(req.params.id, Boolean(req.body?.isBlocked));
    return res.json({ user: { _id: updated.id, name: updated.name, surname: updated.surname, login: updated.login, role: updated.role, isBlocked: updated.isBlocked } });
  } catch (err) {
    return next(err);
  }
}

async function listResultsHandler(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    const examType = String(req.query.examType || "").trim();
    const results = listResults({ q, examType });
    return res.json({ results });
  } catch (err) {
    return next(err);
  }
}

async function deleteResultHandler(req, res, next) {
  try {
    const deleted = await deleteResult(req.params.id);
    return res.json({ message: "Удалено", deleted });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listUsers: listUsersHandler, blockUser, listResults: listResultsHandler, deleteResult: deleteResultHandler };

