/* eslint-disable no-alert */
const API_BASE = "";

const storage = {
  get token() {
    return localStorage.getItem("token") || "";
  },
  set token(v) {
    if (!v) localStorage.removeItem("token");
    else localStorage.setItem("token", v);
  },
  get lastResult() {
    const raw = localStorage.getItem("lastResult");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  set lastResult(v) {
    if (!v) localStorage.removeItem("lastResult");
    else localStorage.setItem("lastResult", JSON.stringify(v));
  },
};

const state = {
  me: null,
  exams: [],
  myResults: [],
  exam: null,
  examType: null,
  answers: [],
  cursor: 0,
  timerId: null,
  deadlineTs: 0,
};

function qs(sel, root = document) {
  return root.querySelector(sel);
}
function qsa(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

function fmtDate(d) {
  const dt = new Date(d);
  if (Number.isNaN(dt.valueOf())) return "—";
  return dt.toLocaleString();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function toast(type, title, message) {
  const wrap = qs("#toastWrap");
  const el = document.createElement("div");
  el.className = `toast ${type || ""}`;
  el.innerHTML = `<div class="t">${escapeHtml(title)}</div><div class="m">${escapeHtml(message || "")}</div>`;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

function openModal(title, bodyHtml, actions = []) {
  qs("#modalTitle").textContent = title;
  qs("#modalBody").innerHTML = bodyHtml;
  const act = qs("#modalActions");
  act.innerHTML = "";
  actions.forEach((a) => act.appendChild(a));
  qs("#modal").classList.add("open");
}

function closeModal() {
  qs("#modal").classList.remove("open");
}

async function api(path, { method = "GET", body = null, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && storage.token) headers.Authorization = `Bearer ${storage.token}`;
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : null });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || "Ошибка запроса");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function setLoading(btn, v) {
  if (!btn) return;
  btn.classList.toggle("loading", Boolean(v));
  btn.disabled = Boolean(v);
}

function setView(name) {
  qsa(".view").forEach((v) => v.classList.remove("active"));
  const el = qs(`[data-view="${name}"]`);
  if (el) el.classList.add("active");
}

function applyNavVisibility() {
  const authed = Boolean(storage.token);
  qsa("[data-auth]").forEach((el) => (el.style.display = authed ? "" : "none"));
  qsa("[data-role]").forEach((el) => {
    const need = el.getAttribute("data-role");
    el.style.display = authed && state.me?.role === need ? "" : "none";
  });
}

function toHash(h) {
  if (location.hash !== h) location.hash = h;
}

function examTitle(type) {
  if (type === "html") return "HTML";
  if (type === "css") return "CSS";
  if (type === "js") return "JavaScript";
  return type;
}

function passedExam(type) {
  return (state.me?.passedExams || []).some((p) => p.examType === type);
}

function draftKey() {
  const uid = state.me?.id || "anon";
  return `exam_draft_${uid}_${state.examType}`;
}

function saveDraft() {
  if (!state.examType) return;
  const payload = { examType: state.examType, answers: state.answers, cursor: state.cursor, deadlineTs: state.deadlineTs };
  localStorage.setItem(draftKey(), JSON.stringify(payload));
}

function loadDraft(examType) {
  const uid = state.me?.id || "anon";
  const key = `exam_draft_${uid}_${examType}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || data.examType !== examType) return null;
    return data;
  } catch {
    return null;
  }
}

function clearDraft(examType) {
  const uid = state.me?.id || "anon";
  localStorage.removeItem(`exam_draft_${uid}_${examType}`);
}

function renderDashboard() {
  qs("#dashHello").textContent = state.me ? `${state.me.name} ${state.me.surname} • ${state.me.login}` : "—";

  const passed = (state.me?.passedExams || []).length;
  qs("#statPassed").textContent = String(passed);
  qs("#statTotal").textContent = String(state.exams.length || 3);
  const avg = state.myResults.length ? Math.round(state.myResults.reduce((a, r) => a + (r.percent || 0), 0) / state.myResults.length) : null;
  qs("#statAvg").textContent = avg == null ? "—" : `${avg}%`;

  const cards = qs("#examCards");
  cards.innerHTML = "";
  state.exams.forEach((ex) => {
    const isPassed = passedExam(ex.examType);
    const card = document.createElement("div");
    card.className = "exam-card";
    card.innerHTML = `
      <div class="badge ${isPassed ? "ok" : "warn"}">${isPassed ? "Пройден" : "Не пройден"}</div>
      <div class="exam-title">${escapeHtml(ex.title)}</div>
      <div class="exam-meta">${ex.questionsCount} вопросов • ${ex.durationMinutes} минут</div>
      <div class="exam-actions">
        <button class="btn btn-ghost" data-open-result="${ex.examType}">Результат</button>
        <button class="btn btn-primary" data-start-exam="${ex.examType}" ${isPassed ? "disabled" : ""}>Начать</button>
      </div>
    `;
    cards.appendChild(card);
  });

  const tbody = qs("#myResultsTbody");
  tbody.innerHTML = "";
  if (!state.myResults.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="muted">Пока нет результатов.</td></tr>`;
  } else {
    state.myResults.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(examTitle(r.examType))}</td>
        <td>${r.score}</td>
        <td>${r.percent}%</td>
        <td>${escapeHtml(fmtDate(r.finishedAt))}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

function renderExam() {
  const exam = state.exam;
  if (!exam) return;
  const idx = state.cursor;
  const q = exam.questions[idx];
  qs("#examMeta").textContent = `${examTitle(exam.examType)} • ${exam.questions.length} вопросов`;
  qs("#examTitle").textContent = `${exam.title} экзамен`;
  qs("#qNum").textContent = String(idx + 1);
  qs("#qText").textContent = q.question;
  const pct = Math.round(((idx + 1) / exam.questions.length) * 100);
  qs("#progressBar").style.width = `${pct}%`;

  const options = qs("#qOptions");
  options.innerHTML = "";
  q.options.forEach((opt, i) => {
    const item = document.createElement("div");
    item.className = `opt ${state.answers[idx] === i ? "active" : ""}`;
    item.setAttribute("data-opt", String(i));
    item.innerHTML = `<div class="dot"></div><div class="txt">${escapeHtml(opt)}</div>`;
    item.addEventListener("click", () => {
      state.answers[idx] = i;
      saveDraft();
      renderExam();
    });
    options.appendChild(item);
  });

  qs("#btnPrev").disabled = idx === 0;
  qs("#btnNext").disabled = idx >= exam.questions.length - 1;
}

function stopTimer() {
  if (state.timerId) clearInterval(state.timerId);
  state.timerId = null;
}

function startTimer() {
  stopTimer();
  const el = qs("#timerValue");
  const tick = () => {
    const left = Math.max(0, state.deadlineTs - Date.now());
    const sec = Math.floor(left / 1000);
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    el.textContent = `${m}:${s}`;
    if (left <= 0) {
      stopTimer();
      finishExam(true);
    }
  };
  tick();
  state.timerId = setInterval(tick, 250);
}

async function loadMe() {
  if (!storage.token) {
    state.me = null;
    applyNavVisibility();
    return null;
  }
  try {
    const { user } = await api("/api/auth/me");
    state.me = user;
    applyNavVisibility();
    return user;
  } catch {
    storage.token = "";
    state.me = null;
    applyNavVisibility();
    return null;
  }
}

async function loadExams() {
  const { exams } = await api("/api/exams");
  state.exams = exams;
}

async function loadMyResults() {
  const { results } = await api("/api/results/my");
  state.myResults = results;
}

async function startExam(examType) {
  if (passedExam(examType)) {
    toast("warn", "Экзамен уже пройден", "Вы уже прошли этот экзамен");
    return;
  }
  try {
    await api(`/api/results/my/${examType}`);
    toast("warn", "Экзамен уже пройден", "Вы уже прошли этот экзамен");
    await loadMe();
    await loadMyResults();
    renderDashboard();
    return;
  } catch (e) {
    if (e.status !== 404) throw e;
  }

  const exam = await api(`/api/exams/${examType}`);
  state.exam = exam;
  state.examType = examType;
  state.cursor = 0;
  state.answers = new Array(exam.questions.length).fill(-1);

  const draft = loadDraft(examType);
  if (draft && Array.isArray(draft.answers) && draft.answers.length === exam.questions.length) {
    const stillValid = typeof draft.deadlineTs === "number" && draft.deadlineTs > Date.now() + 2000;
    if (stillValid) {
      state.answers = draft.answers.map((v) => (Number.isInteger(v) ? v : -1));
      state.cursor = Math.min(Math.max(0, Number(draft.cursor || 0)), exam.questions.length - 1);
      state.deadlineTs = draft.deadlineTs;
      toast("ok", "Черновик восстановлен", "Ответы и таймер восстановлены.");
    } else {
      clearDraft(examType);
    }
  }

  if (!state.deadlineTs) state.deadlineTs = Date.now() + exam.durationMinutes * 60 * 1000;
  saveDraft();
  toHash(`#/exam?type=${encodeURIComponent(examType)}`);
}

async function finishExam(force = false) {
  const examType = state.examType;
  const exam = state.exam;
  if (!exam || !examType) return;

  const unanswered = state.answers.filter((a) => !Number.isInteger(a) || a < 0).length;
  if (!force && unanswered > 0) {
    const btnCancel = document.createElement("button");
    btnCancel.className = "btn btn-ghost";
    btnCancel.textContent = "Отмена";
    btnCancel.onclick = closeModal;

    const btnOk = document.createElement("button");
    btnOk.className = "btn btn-primary";
    btnOk.textContent = "Завершить";
    btnOk.onclick = async () => {
      closeModal();
      await finishExam(true);
    };

    openModal(
      "Есть пропуски",
      `<p>Не отвечено: <b>${unanswered}</b>. Если завершить — изменить ответы будет нельзя.</p>`,
      [btnCancel, btnOk]
    );
    return;
  }

  stopTimer();
  try {
    const btn = qs("#btnFinish");
    setLoading(btn, true);
    const data = await api(`/api/exams/${examType}/submit`, { method: "POST", body: { answers: state.answers } });
    setLoading(btn, false);
    clearDraft(examType);
    storage.lastResult = data.result;
    toast("ok", "Сдано", "Результат сохранён и отправлен в админ-панель.");
    toHash(`#/result?type=${encodeURIComponent(examType)}`);
  } catch (e) {
    setLoading(qs("#btnFinish"), false);
    if (e.status === 409) {
      toast("warn", "Уже пройдено", "Вы уже прошли этот экзамен");
      toHash("#/dashboard");
      return;
    }
    toast("bad", "Ошибка", e.message || "Не удалось отправить экзамен");
    toHash("#/dashboard");
  }
}

function renderResult() {
  const r = storage.lastResult;
  if (!r) {
    qs("#resultBadge").textContent = "—";
    qs("#resultTitle").textContent = "Результат";
    return;
  }
  qs("#resultBadge").textContent = r.grade || "—";
  qs("#resultTitle").textContent = `Результат: ${examTitle(r.examType)}`;
  qs("#resultScore").textContent = `${r.score}/${r.total}`;
  qs("#resultPercent").textContent = `${r.percent}%`;
  qs("#resultGrade").textContent = r.grade || "—";
  qs("#resultDate").textContent = fmtDate(r.finishedAt);

  qs("#btnOpenMyResult").onclick = async () => {
    try {
      const { result } = await api(`/api/results/my/${r.examType}`);
      const btnOk = document.createElement("button");
      btnOk.className = "btn btn-primary";
      btnOk.textContent = "OK";
      btnOk.onclick = closeModal;
      openModal(
        `Детали: ${examTitle(r.examType)}`,
        `<p><b>${escapeHtml(state.me?.name || "")} ${escapeHtml(state.me?.surname || "")}</b></p>
         <p>Баллы: <b>${result.score}</b></p>
         <p>Процент: <b>${result.percent}%</b></p>
         <p>Дата: <b>${escapeHtml(fmtDate(result.finishedAt))}</b></p>`,
        [btnOk]
      );
    } catch (e) {
      toast("bad", "Ошибка", e.message);
    }
  };
}

async function adminLoad() {
  const qUsers = qs("#adminUsersSearch").value.trim();
  const qRes = qs("#adminResultsSearch").value.trim();
  const examFilter = qs("#adminExamFilter").value;

  const [usersData, resultsData] = await Promise.all([
    api(`/api/admin/users${qUsers ? `?q=${encodeURIComponent(qUsers)}` : ""}`),
    api(`/api/admin/results?${new URLSearchParams({ ...(qRes ? { q: qRes } : {}), ...(examFilter ? { examType: examFilter } : {}) }).toString()}`),
  ]);

  const usersT = qs("#adminUsersTbody");
  usersT.innerHTML = "";
  usersData.users.forEach((u) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(`${u.name} ${u.surname}`)}</td>
      <td>${escapeHtml(u.login)}</td>
      <td>${escapeHtml(u.role)}</td>
      <td>${u.isBlocked ? `<span class="badge warn">blocked</span>` : `<span class="badge ok">active</span>`}</td>
      <td style="text-align:right">
        ${u.role === "admin" ? "" : `<button class="btn btn-ghost" data-block="${u._id}" data-val="${u.isBlocked ? "0" : "1"}">${u.isBlocked ? "Разблок." : "Блок"}</button>`}
      </td>
    `;
    usersT.appendChild(tr);
  });

  usersT.querySelectorAll("[data-block]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-block");
      const val = btn.getAttribute("data-val") === "1";
      try {
        await api(`/api/admin/users/${id}/block`, { method: "PATCH", body: { isBlocked: val } });
        toast("ok", "Готово", val ? "Пользователь заблокирован" : "Пользователь разблокирован");
        await adminLoad();
      } catch (e) {
        toast("bad", "Ошибка", e.message);
      }
    });
  });

  const resT = qs("#adminResultsTbody");
  resT.innerHTML = "";
  resultsData.results.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(`${r.name} ${r.surname}`)}<div class="muted" style="font-size:12px">${escapeHtml(r.login)}</div></td>
      <td>${escapeHtml(examTitle(r.examType))}</td>
      <td>${r.score}</td>
      <td>${r.percent}%</td>
      <td>${escapeHtml(fmtDate(r.finishedAt))}</td>
      <td>${r.isBlocked ? `<span class="badge warn">blocked</span>` : `<span class="badge ok">active</span>`}</td>
      <td style="text-align:right"><button class="btn btn-ghost" data-del="${r.id}">Удалить</button></td>
    `;
    resT.appendChild(tr);
  });

  resT.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del");
      const btnCancel = document.createElement("button");
      btnCancel.className = "btn btn-ghost";
      btnCancel.textContent = "Отмена";
      btnCancel.onclick = closeModal;
      const btnOk = document.createElement("button");
      btnOk.className = "btn btn-primary";
      btnOk.textContent = "Удалить";
      btnOk.onclick = async () => {
        closeModal();
        try {
          await api(`/api/admin/results/${id}`, { method: "DELETE" });
          toast("ok", "Удалено", "Результат удалён");
          await adminLoad();
        } catch (e) {
          toast("bad", "Ошибка", e.message);
        }
      };
      openModal("Удалить результат?", "<p>Это также снимет статус прохождения экзамена у ученика.</p>", [btnCancel, btnOk]);
    });
  });
}

async function onRoute() {
  const raw = location.hash || "#/login";
  const [path, query] = raw.replace(/^#/, "").split("?");
  const params = new URLSearchParams(query || "");

  await loadMe();
  applyNavVisibility();

  const authed = Boolean(storage.token && state.me);
  const view = path.replace(/^\//, "") || "login";

  if (!authed && (view === "dashboard" || view === "exam" || view === "result" || view === "admin")) {
    setView("login");
    return;
  }
  if (authed && (view === "login" || view === "register")) {
    toHash(state.me?.role === "admin" ? "#/admin" : "#/dashboard");
    return;
  }

  if (view === "dashboard") {
    await loadExams();
    await loadMyResults();
    renderDashboard();
    setView("dashboard");
    return;
  }

  if (view === "exam") {
    const type = String(params.get("type") || "").toLowerCase();
    if (!type) return toHash("#/dashboard");
    if (passedExam(type)) {
      toast("warn", "Экзамен уже пройден", "Вы уже прошли этот экзамен");
      return toHash("#/dashboard");
    }
    if (!state.exam || state.examType !== type) {
      await startExam(type);
      return;
    }
    renderExam();
    startTimer();
    setView("exam");
    return;
  }

  if (view === "result") {
    renderResult();
    setView("result");
    return;
  }

  if (view === "admin") {
    if (state.me?.role !== "admin") {
      toast("bad", "Доступ запрещён", "Только администратор");
      toHash("#/dashboard");
      return;
    }
    setView("admin");
    await adminLoad();
    return;
  }

  if (view === "register") {
    setView("register");
    return;
  }
  setView("login");
}

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function wire() {
  qs("#btnLogout").addEventListener("click", () => {
    storage.token = "";
    storage.lastResult = null;
    state.me = null;
    toast("ok", "Выход", "Вы вышли из аккаунта");
    toHash("#/login");
  });

  qsa("[data-link]").forEach((el) => {
    el.addEventListener("click", () => toHash(el.getAttribute("data-link")));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") toHash(el.getAttribute("data-link"));
    });
  });

  // Tabs
  const tabStudent = qs("#tabStudent");
  const tabAdmin = qs("#tabAdmin");
  const formCode = qs("#formCodeLogin");
  const formAdmin = qs("#formAdminLogin");

  const setTab = (mode) => {
    const isStudent = mode === "student";
    tabStudent.classList.toggle("active", isStudent);
    tabAdmin.classList.toggle("active", !isStudent);
    formCode.classList.toggle("hidden", !isStudent);
    formAdmin.classList.toggle("hidden", isStudent);
  };
  tabStudent?.addEventListener("click", () => setTab("student"));
  tabAdmin?.addEventListener("click", () => setTab("admin"));
  setTab("student");

  // Student code login
  qs("#formCodeLogin")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const btn = form.querySelector("button[type='submit']");
    const name = form.name.value;
    const surname = form.surname.value;
    const code = form.code.value;
    try {
      setLoading(btn, true);
      const data = await api("/api/auth/code-login", { method: "POST", body: { name, surname, code }, auth: false });
      storage.token = data.token;
      setLoading(btn, false);
      toast("ok", "Успешно", "Вы вошли по коду");
      toHash("#/dashboard");
    } catch (err) {
      setLoading(btn, false);
      toast("bad", "Ошибка", err.message);
    }
  });

  // Admin login
  qs("#formAdminLogin")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const btn = form.querySelector("button[type='submit']");
    const login = form.login.value;
    const password = form.password.value;
    try {
      setLoading(btn, true);
      const data = await api("/api/auth/login", { method: "POST", body: { login, password }, auth: false });
      storage.token = data.token;
      setLoading(btn, false);
      toast("ok", "Успешно", "Вы вошли как администратор");
      toHash("#/admin");
    } catch (err) {
      setLoading(btn, false);
      toast("bad", "Ошибка", err.message);
    }
  });

  // Legacy register (не нужен для разового теста)
  qs("#formRegister")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const btn = form.querySelector("button[type='submit']");
    const name = form.name.value;
    const surname = form.surname.value;
    const login = form.login.value;
    const password = form.password.value;
    try {
      setLoading(btn, true);
      const data = await api("/api/auth/register", { method: "POST", body: { name, surname, login, password }, auth: false });
      storage.token = data.token;
      setLoading(btn, false);
      toast("ok", "Готово", "Аккаунт создан");
      toHash("#/dashboard");
    } catch (err) {
      setLoading(btn, false);
      toast("bad", "Ошибка", err.message);
    }
  });

  // Exam nav
  qs("#btnPrev")?.addEventListener("click", () => {
    state.cursor = Math.max(0, state.cursor - 1);
    saveDraft();
    renderExam();
  });
  qs("#btnNext")?.addEventListener("click", () => {
    const total = state.exam?.questions?.length || 0;
    state.cursor = Math.min(total - 1, state.cursor + 1);
    saveDraft();
    renderExam();
  });
  qs("#btnFinish")?.addEventListener("click", () => finishExam(false));

  qs("#btnRefreshMyResults")?.addEventListener("click", async () => {
    try {
      await loadMyResults();
      renderDashboard();
      toast("ok", "Обновлено", "Результаты обновлены");
    } catch (e) {
      toast("bad", "Ошибка", e.message);
    }
  });

  // Dashboard click handlers
  document.addEventListener("click", (e) => {
    const startBtn = e.target.closest("[data-start-exam]");
    if (startBtn) {
      const type = startBtn.getAttribute("data-start-exam");
      startExam(type).catch((err) => toast("bad", "Ошибка", err.message));
    }
    const openBtn = e.target.closest("[data-open-result]");
    if (openBtn) {
      const type = openBtn.getAttribute("data-open-result");
      api(`/api/results/my/${type}`)
        .then(({ result }) => {
          storage.lastResult = { examType: result.examType, total: 15, score: result.score, percent: result.percent, grade: "—", finishedAt: result.finishedAt };
          toHash(`#/result?type=${encodeURIComponent(type)}`);
        })
        .catch((err) => toast("warn", "Нет результата", err.message));
    }
  });

  // Admin handlers
  qs("#btnAdminReload")?.addEventListener("click", () => adminLoad().catch((e) => toast("bad", "Ошибка", e.message)));
  qs("#adminUsersSearch")?.addEventListener("input", debounce(() => adminLoad().catch(() => {}), 450));
  qs("#adminResultsSearch")?.addEventListener("input", debounce(() => adminLoad().catch(() => {}), 450));
  qs("#adminExamFilter")?.addEventListener("change", () => adminLoad().catch(() => {}));

  qs("#btnGenCodes")?.addEventListener("click", async () => {
    const countInput = document.createElement("input");
    countInput.className = "input";
    countInput.type = "number";
    countInput.min = "1";
    countInput.max = "200";
    countInput.value = "20";

    const btnCancel = document.createElement("button");
    btnCancel.className = "btn btn-ghost";
    btnCancel.textContent = "Отмена";
    btnCancel.onclick = closeModal;

    const btnOk = document.createElement("button");
    btnOk.className = "btn btn-primary";
    btnOk.textContent = "Создать";
    btnOk.onclick = async () => {
      try {
        const count = Number(countInput.value || 20);
        const data = await api("/api/admin/codes", { method: "POST", body: { count } });
        const codes = (data.codes || []).join("\n");
        closeModal();

        const pre = `<pre style="white-space:pre-wrap; user-select:text; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); padding:12px; border-radius:16px">${escapeHtml(
          codes
        )}</pre>`;

        const btnClose = document.createElement("button");
        btnClose.className = "btn btn-ghost";
        btnClose.textContent = "Закрыть";
        btnClose.onclick = closeModal;

        const btnCopy = document.createElement("button");
        btnCopy.className = "btn btn-primary";
        btnCopy.textContent = "Скопировать";
        btnCopy.onclick = async () => {
          await navigator.clipboard.writeText(codes);
          toast("ok", "Готово", "Коды скопированы");
        };

        openModal("Коды доступа", pre, [btnClose, btnCopy]);
      } catch (e) {
        toast("bad", "Ошибка", e.message);
      }
    };

    openModal("Генерация кодов", "<p>Сколько кодов создать?</p>", [btnCancel, btnOk]);
    qs("#modalBody").appendChild(countInput);
  });

  // Modal
  qs("#modalClose")?.addEventListener("click", closeModal);
  qs("#modal")?.addEventListener("click", (e) => {
    if (e.target?.dataset?.close) closeModal();
  });

  window.addEventListener("hashchange", () => onRoute().catch((e) => toast("bad", "Ошибка", e.message)));
}

wire();
onRoute().catch((e) => toast("bad", "Ошибка", e.message));

