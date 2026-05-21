const express = require("express");
const { authRequired } = require("../middleware/auth");
const { myResults, myResultByExam } = require("../controllers/resultController");

const router = express.Router();

router.get("/my", authRequired, myResults);
router.get("/my/:examType", authRequired, myResultByExam);

module.exports = router;

