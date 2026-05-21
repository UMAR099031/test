const express = require("express");
const { listExams, getExam, submitExam } = require("../controllers/examController");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/", authRequired, listExams);
router.get("/:type", authRequired, getExam);
router.post("/:type/submit", authRequired, submitExam);

module.exports = router;

