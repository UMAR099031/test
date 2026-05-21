const { getMyResults, getMyResultByExam } = require("../db/repo");

async function myResults(req, res, next) {
  try {
    const results = getMyResults(req.user.id);
    return res.json({ results });
  } catch (err) {
    return next(err);
  }
}

async function myResultByExam(req, res, next) {
  try {
    const examType = String(req.params.examType || "").toLowerCase();
    const result = getMyResultByExam(req.user.id, examType);
    if (!result) return res.status(404).json({ message: "Результат не найден" });
    return res.json({ result });
  } catch (err) {
    return next(err);
  }
}

module.exports = { myResults, myResultByExam };

