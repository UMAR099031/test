const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "data.json");

const EMPTY = {
  users: [],
  results: [],
  accessCodes: [],
  meta: { version: 1 },
};

let cache = null;
let writeChain = Promise.resolve();

function ensureDbFile() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(EMPTY, null, 2), "utf8");
  }
}

function load() {
  ensureDbFile();
  if (cache) return cache;
  const raw = fs.readFileSync(DB_PATH, "utf8");
  try {
    cache = JSON.parse(raw);
  } catch {
    cache = { ...EMPTY };
  }
  cache.users ||= [];
  cache.results ||= [];
  cache.accessCodes ||= [];
  cache.meta ||= { version: 1 };
  return cache;
}

function snapshot() {
  const db = load();
  return {
    users: [...db.users],
    results: [...db.results],
    accessCodes: [...db.accessCodes],
    meta: { ...(db.meta || {}) },
  };
}

function persist(nextDb) {
  cache = nextDb;
  const payload = JSON.stringify(nextDb, null, 2);
  writeChain = writeChain.then(async () => {
    const tmp = `${DB_PATH}.tmp`;
    await fs.promises.writeFile(tmp, payload, "utf8");
    await fs.promises.rename(tmp, DB_PATH);
  });
  return writeChain;
}

async function update(mutator) {
  const db = snapshot();
  const result = await mutator(db);
  await persist(db);
  return result;
}

module.exports = { DB_PATH, load, update };

