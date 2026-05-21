const express = require("express");
const { authRequired, adminOnly } = require("../middleware/auth");
const { listUsers, blockUser, listResults, deleteResult } = require("../controllers/adminController");
const { adminCreateCodes, adminListCodes, adminDisableCode } = require("../controllers/codeController");

const router = express.Router();

router.get("/users", authRequired, adminOnly, listUsers);
router.patch("/users/:id/block", authRequired, adminOnly, blockUser);
router.get("/results", authRequired, adminOnly, listResults);
router.delete("/results/:id", authRequired, adminOnly, deleteResult);

router.get("/codes", authRequired, adminOnly, adminListCodes);
router.post("/codes", authRequired, adminOnly, adminCreateCodes);
router.patch("/codes/:code/disable", authRequired, adminOnly, adminDisableCode);

module.exports = router;
