const { EXAMS, getExamPublic, gradeExam } = require("../data/exams");
const { listExams, createResultAndMarkPassed, getMyResultByExam } = require("../db/repo");

function listExamsHandler(req, res) {
  return res.json({ exams: listExams(EXAMS) });
}

function getExam(req, res) {
  const examType = String(req.params.type || "").toLowerCase();
  const payload = getExamPublic(examType);
  if (!payload) return res.status(404).json({ message: "Экзамен не найден" });
  return res.json(payload);
}

async function submitExam(req, res, next) {
  try {
    const userId = req.user.id;
    const examType = String(req.params.type || "").toLowerCase();
    const exam = EXAMS[examType];
    if (!exam) return res.status(404).json({ message: "Экзамен не найден" });

    // server-side: block if already passed
    const existing = getMyResultByExam(userId, examType);
    if (existing) return res.status(409).json({ message: "Вы уже прошли этот экзамен" });

    const { answers } = req.body || {};
    if (!Array.isArray(answers) || answers.length !== exam.questions.length) return res.status(400).json({ message: "Неверный формат ответов" });
    const safeAnswers = answers.map((v) => (Number.isInteger(v) ? v : -1));

    const now = new Date().toISOString();
    const grade = gradeExam(examType, safeAnswers);
    if (!grade) return res.status(400).json({ message: "Не удалось проверить экзамен" });

    const result = await createResultAndMarkPassed({
      userId,
      examType,
      score: grade.score,
      percent: grade.percent,
      answers: safeAnswers,
      finishedAt: now,
    });

    return res.json({
      message: "Экзамен завершён",
      result: {
        examType,
        total: grade.total,
        score: grade.score,
        percent: grade.percent,
        grade: grade.grade,
        finishedAt: now,
        resultId: result.id,
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listExams: listExamsHandler, getExam, submitExam };

