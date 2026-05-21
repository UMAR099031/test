const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");

const { ensureAdmin } = require("./db/repo");
const authRoutes = require("./routes/authRoutes");
const examRoutes = require("./routes/examRoutes");
const resultRoutes = require("./routes/resultRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { notFound, errorHandler } = require("./middleware/error");

const PORT = Number(process.env.PORT || 5000);

if (!process.env.JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.error("JWT_SECRET не задан в .env");
  process.exit(1);
}

async function bootstrapAdmin() {
  const adminLogin = String(process.env.ADMIN_LOGIN || "admin").trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || "admin12345");
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await ensureAdmin({ login: adminLogin, passwordHash });
}

async function main() {
  await bootstrapAdmin();

  const app = express();
  app.set("trust proxy", 1);

  app.use(cors({ origin: true, credentials: true }));
  app.use(helmet());
  app.use(express.json({ limit: "200kb" }));

  app.use(
    "/api/",
    rateLimit({
      windowMs: 60 * 1000,
      limit: 180,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get("/api/health", (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
  app.use("/api/auth", authRoutes);
  app.use("/api/exams", examRoutes);
  app.use("/api/results", resultRoutes);
  app.use("/api/admin", adminRoutes);

  const frontendDir = path.join(__dirname, "..", "frontend");
  app.use(express.static(frontendDir));
  app.get(/^(?!\/api\/).*/, (req, res) => res.sendFile(path.join(frontendDir, "index.html")));

  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API запущен: http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
