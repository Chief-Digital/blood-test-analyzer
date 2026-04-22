/* ═══════════════════════════════════════════════════
   Blood Test Analyzer — Frontend Logic
   ═══════════════════════════════════════════════════ */

// ─── State ───────────────────────────────────────────
let lang = "he";
let currentFolder = "all";
let currentAnalysis = null;
let folders = [];
let selectedFile = null;
let chatHistory = [];

// ─── i18n ─────────────────────────────────────────────
const T = {
  he: {
    appTitle: "מנתח בדיקות דם",
    appSubtitle: "ניתוח לפי רפואה מערבית ורפואה סינית",
    langBtn: "English",
    btnNew: "ניתוח חדש",
    sidebarAll: "כל הניתוחים",
    navAll: "כל הניתוחים",
    navNoFolder: "ללא תיקייה",
    listAll: "כל הניתוחים",
    listNoFolder: "ניתוחים ללא תיקייה",
    emptyTitle: "אין ניתוחים עדיין",
    emptyDesc: "העלה בדיקת דם כדי להתחיל",
    emptyBtn: "+ ניתוח חדש",
    modalUpload: "ניתוח בדיקת דם חדשה",
    labelName: "שם הניתוח (אופציונלי)",
    labelNamePlaceholder: "למשל: מטופל א׳ - מרץ 2025",
    labelFolder: "תיקייה",
    optNoFolder: "ללא תיקייה",
    labelFile: "קובץ PDF",
    dropText: "גרור PDF לכאן או לחץ לבחירה",
    dropHint: "PDF בלבד, עד 500MB",
    btnCancel: "ביטול",
    btnAnalyze: "נתח",
    analyzing: "מנתח בדיקות — זה עלול לקחת מספר דקות...",
    analyzingWestern: "מנתח לפי רפואה מערבית...",
    analyzingChinese: "מנתח לפי רפואה סינית...",
    btnBack: "חזרה",
    renameLabel: "שנה שם",
    moveLabel: "העבר לתיקייה",
    deleteLabel: "מחק",
    tabWestern: "🏥 רפואה מערבית",
    tabChinese: "☯ רפואה סינית",
    modalFolderTitle: "תיקייה חדשה",
    labelFolderName: "שם התיקייה",
    folderPlaceholder: "לדוגמה: מטופלים 2025",
    btnCreateFolder: "צור",
    modalRename: "שנה שם",
    btnSaveRename: "שמור",
    modalMove: "העבר לתיקייה",
    btnConfirmMove: "העבר",
    modalConfirmTitle: "מחיקת ניתוח",
    confirmMsg: "האם למחוק את הניתוח? פעולה זו אינה הפיכה.",
    btnCancelDelete: "ביטול",
    btnConfirmDelete: "מחק",
    newFolderTooltip: "תיקייה חדשה",
    renameFolderTitle: "שנה שם לתיקייה",
    deleteFolderConfirm: "האם למחוק את התיקייה? הניתוחים לא יימחקו.",
    analysisOf: "ניתוח של",
    file: "קובץ",
    errNoFile: "נא לבחור קובץ PDF",
    errOnlyPDF: "רק קובצי PDF נתמכים",
    errAnalysis: "שגיאה בניתוח",
    btnLogout: "יציאה",
    chatTitle: "💬 שאל על הממצאים",
    chatPlaceholder: "שאל שאלה על הבדיקות...",
    chatSend: "שלח",
    chatThinking: "...חושב",
  },
  en: {
    appTitle: "Blood Test Analyzer",
    appSubtitle: "Western & Traditional Chinese Medicine Analysis",
    langBtn: "עברית",
    btnNew: "New Analysis",
    sidebarAll: "All Analyses",
    navAll: "All Analyses",
    navNoFolder: "No Folder",
    listAll: "All Analyses",
    listNoFolder: "Analyses Without Folder",
    emptyTitle: "No analyses yet",
    emptyDesc: "Upload a blood test to get started",
    emptyBtn: "+ New Analysis",
    modalUpload: "New Blood Test Analysis",
    labelName: "Analysis Name (optional)",
    labelNamePlaceholder: "e.g., Patient A - March 2025",
    labelFolder: "Folder",
    optNoFolder: "No Folder",
    labelFile: "PDF File",
    dropText: "Drag & drop PDF here or click to browse",
    dropHint: "PDF only, up to 500MB",
    btnCancel: "Cancel",
    btnAnalyze: "Analyze",
    analyzing: "Analyzing blood test — this may take a few minutes...",
    analyzingWestern: "Running Western medicine analysis...",
    analyzingChinese: "Running TCM analysis...",
    btnBack: "Back",
    renameLabel: "Rename",
    moveLabel: "Move to Folder",
    deleteLabel: "Delete",
    tabWestern: "🏥 Western Medicine",
    tabChinese: "☯ Chinese Medicine",
    modalFolderTitle: "New Folder",
    labelFolderName: "Folder Name",
    folderPlaceholder: "e.g., Patients 2025",
    btnCreateFolder: "Create",
    modalRename: "Rename",
    btnSaveRename: "Save",
    modalMove: "Move to Folder",
    btnConfirmMove: "Move",
    modalConfirmTitle: "Delete Analysis",
    confirmMsg: "Delete this analysis? This action cannot be undone.",
    btnCancelDelete: "Cancel",
    btnConfirmDelete: "Delete",
    newFolderTooltip: "New Folder",
    renameFolderTitle: "Rename Folder",
    deleteFolderConfirm: "Delete this folder? Analyses inside will not be deleted.",
    analysisOf: "Analysis of",
    file: "File",
    errNoFile: "Please select a PDF file",
    errOnlyPDF: "Only PDF files are supported",
    errAnalysis: "Analysis failed",
    btnLogout: "Logout",
    chatTitle: "💬 Ask about findings",
    chatPlaceholder: "Ask a question about the results...",
    chatSend: "Send",
    chatThinking: "Thinking...",
  }
};

function t(key) { return T[lang][key] || key; }

// ─── Language Toggle ───────────────────────────────────
function toggleLang() {
  lang = lang === "he" ? "en" : "he";
  document.documentElement.lang = lang;
  document.body.className = lang === "he" ? "rtl" : "ltr";
  applyTranslations();
  renderFolders();
  if (currentAnalysis) renderDetail(currentAnalysis);
}

function applyTranslations() {
  setText("app-title", t("appTitle"));
  setText("app-subtitle", t("appSubtitle"));
  setText("lang-toggle", t("langBtn"));
  setText("btn-new-text", t("btnNew"));
  setText("sidebar-all-label", t("sidebarAll"));
  setText("nav-all", t("navAll"));
  setText("nav-nofolder", t("navNoFolder"));
  setText("empty-title", t("emptyTitle"));
  setText("empty-desc", t("emptyDesc"));
  setText("empty-btn", t("emptyBtn"));
  setText("modal-upload-title", t("modalUpload"));
  setText("label-name", t("labelName"));
  setAttr("analysis-name", "placeholder", t("labelNamePlaceholder"));
  setText("label-folder", t("labelFolder"));
  setText("opt-no-folder", t("optNoFolder"));
  setText("label-file", t("labelFile"));
  setText("drop-text", t("dropText"));
  setText("drop-hint", t("dropHint"));
  setText("btn-cancel", t("btnCancel"));
  setText("btn-analyze-text", t("btnAnalyze"));
  setText("back-label", t("btnBack"));
  setText("rename-label", t("renameLabel"));
  setText("move-label", t("moveLabel"));
  setText("delete-label", t("deleteLabel"));
  setText("tab-western-label", t("tabWestern"));
  setText("tab-chinese-label", t("tabChinese"));
  setText("modal-folder-title", t("modalFolderTitle"));
  setText("label-folder-name", t("labelFolderName"));
  setAttr("new-folder-name", "placeholder", t("folderPlaceholder"));
  setText("btn-create-folder", t("btnCreateFolder"));
  setText("modal-rename-title", t("modalRename"));
  setText("btn-save-rename", t("btnSaveRename"));
  setText("modal-move-title", t("modalMove"));
  setText("btn-confirm-move", t("btnConfirmMove"));
  setText("modal-confirm-title", t("modalConfirmTitle"));
  setText("confirm-msg", t("confirmMsg"));
  setText("btn-cancel-delete", t("btnCancelDelete"));
  setText("btn-confirm-delete", t("btnConfirmDelete"));
  setText("btn-logout", t("btnLogout"));
  setText("chat-title", t("chatTitle"));
  setAttr("chat-input", "placeholder", t("chatPlaceholder"));
  setText("btn-send-chat", t("chatSend"));
  // Update list title if in list view
  updateListTitle();
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function setAttr(id, attr, val) {
  const el = document.getElementById(id);
  if (el) el[attr] = val;
}

// ─── Init ──────────────────────────────────────────────
async function init() {
  // Load user info
  try {
    const res = await fetch("/api/me");
    if (res.ok) {
      const user = await res.json();
      const el = document.getElementById("user-name");
      if (el) el.textContent = user.name;
    }
  } catch (e) {}

  await loadFolders();
  await loadAnalyses("all");
  applyTranslations();
}

// ─── Folders ───────────────────────────────────────────
async function loadFolders() {
  const res = await fetch("/api/folders");
  folders = await res.json();
  renderFolders();
  populateFolderSelects();
}

function renderFolders() {
  const container = document.getElementById("folders-container");
  if (!folders.length) { container.innerHTML = ""; return; }

  container.innerHTML = `
    <div class="folder-group">
      ${folders.map(f => `
        <div class="folder-item-wrapper">
          <div class="folder-item ${currentFolder == f.id ? 'active' : ''}"
            data-folder="${f.id}" onclick="selectFolder(${f.id}, this)">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
            </svg>
            <span class="folder-item-label">${escHtml(f.name)}</span>
            <div class="folder-actions">
              <button class="folder-action-btn" onclick="event.stopPropagation(); renameFolderPrompt(${f.id}, '${escHtml(f.name)}')" title="${t("renameLabel")}">✏️</button>
              <button class="folder-action-btn" onclick="event.stopPropagation(); deleteFolderConfirm(${f.id})" title="${t("deleteLabel")}">🗑</button>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function populateFolderSelects() {
  const noFolderOpt = `<option value="">${t("optNoFolder")}</option>`;
  const opts = folders.map(f => `<option value="${f.id}">${escHtml(f.name)}</option>`).join("");

  const uploadSelect = document.getElementById("folder-select");
  if (uploadSelect) uploadSelect.innerHTML = noFolderOpt + opts;

  const moveSelect = document.getElementById("move-folder-select");
  if (moveSelect) moveSelect.innerHTML = noFolderOpt + opts;
}

function selectFolder(folderId, el) {
  currentFolder = folderId;
  // Update active styles
  document.querySelectorAll(".sidebar-item, .folder-item").forEach(i => i.classList.remove("active"));
  if (el) el.classList.add("active");
  updateListTitle();
  loadAnalyses(folderId);
}

function updateListTitle() {
  const el = document.getElementById("list-title");
  if (!el) return;
  if (currentFolder === "all") el.textContent = t("listAll");
  else if (currentFolder === "none") el.textContent = t("listNoFolder");
  else {
    const f = folders.find(x => x.id == currentFolder);
    el.textContent = f ? f.name : "";
  }
}

async function openNewFolderModal() {
  document.getElementById("new-folder-name").value = "";
  openModal("folder-modal");
  setTimeout(() => document.getElementById("new-folder-name").focus(), 100);
}

async function createFolder() {
  const name = document.getElementById("new-folder-name").value.trim();
  if (!name) return;
  const res = await fetch("/api/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  if (res.ok) {
    closeModal("folder-modal");
    await loadFolders();
  }
}

async function renameFolderPrompt(folderId, currentName) {
  const newName = prompt(t("renameFolderTitle"), currentName);
  if (!newName || newName === currentName) return;
  await fetch(`/api/folders/${folderId}/rename`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName })
  });
  await loadFolders();
}

async function deleteFolderConfirm(folderId) {
  if (!confirm(t("deleteFolderConfirm"))) return;
  await fetch(`/api/folders/${folderId}`, { method: "DELETE" });
  if (currentFolder == folderId) { currentFolder = "all"; }
  await loadFolders();
  await loadAnalyses(currentFolder);
}

// ─── Analyses List ─────────────────────────────────────
async function loadAnalyses(folderId) {
  let url = "/api/analyses";
  if (folderId !== "all") url += `?folder_id=${folderId}`;
  const res = await fetch(url);
  const analyses = await res.json();
  renderAnalysesList(analyses);
}

function renderAnalysesList(analyses) {
  const grid = document.getElementById("analyses-grid");
  const empty = document.getElementById("empty-state");
  const count = document.getElementById("list-count");

  if (!analyses.length) {
    grid.style.display = "none";
    empty.style.display = "block";
    count.textContent = "";
    return;
  }

  grid.style.display = "grid";
  empty.style.display = "none";
  count.textContent = analyses.length;

  grid.innerHTML = analyses.map(a => {
    const date = formatDate(a.created_at);
    const summary = a.summary ? a.summary.substring(0, 120) : "";
    return `
      <div class="analysis-card" onclick="openAnalysis(${a.id})">
        <div class="card-icon">🩸</div>
        <div class="card-name">${escHtml(a.name)}</div>
        ${summary ? `<div class="card-summary">${escHtml(summary)}</div>` : ""}
        <div class="card-meta">
          <span class="card-date">📅 ${date}</span>
          <span class="card-file">📄 ${escHtml(a.file_name || "")}</span>
        </div>
      </div>
    `;
  }).join("");
}

// ─── Analysis Detail ───────────────────────────────────
async function openAnalysis(analysisId) {
  const res = await fetch(`/api/analyses/${analysisId}`);
  if (!res.ok) return;
  currentAnalysis = await res.json();
  // Reset chat for new analysis
  chatHistory = [];
  document.getElementById("chat-messages").innerHTML = "";
  renderDetail(currentAnalysis);
  document.getElementById("list-view").style.display = "none";
  document.getElementById("detail-view").style.display = "block";
  window.scrollTo(0, 0);
  switchTab("western");
}

function renderDetail(analysis) {
  document.getElementById("detail-name").textContent = analysis.name;
  document.getElementById("detail-date").textContent = "📅 " + formatDate(analysis.created_at) + (analysis.file_name ? ` · 📄 ${analysis.file_name}` : "");
  document.getElementById("detail-summary").textContent = analysis.summary || "";

  // Render markdown
  document.getElementById("panel-western").innerHTML = renderMarkdown(analysis.western_analysis || "");
  document.getElementById("panel-chinese").innerHTML = renderMarkdown(analysis.chinese_analysis || "");

  // Update tab labels
  setText("tab-western-label", t("tabWestern"));
  setText("tab-chinese-label", t("tabChinese"));
  setText("back-label", t("btnBack"));
  setText("rename-label", t("renameLabel"));
  setText("move-label", t("moveLabel"));
  setText("delete-label", t("deleteLabel"));
}

function renderMarkdown(text) {
  if (!text) return "";
  try {
    return marked.parse(text);
  } catch (e) {
    return `<p>${escHtml(text)}</p>`;
  }
}

function showListView() {
  document.getElementById("list-view").style.display = "block";
  document.getElementById("detail-view").style.display = "none";
  currentAnalysis = null;
  loadAnalyses(currentFolder);
}

function switchTab(tab) {
  document.getElementById("tab-western").classList.toggle("active", tab === "western");
  document.getElementById("tab-chinese").classList.toggle("active", tab === "chinese");
  document.getElementById("panel-western").style.display = tab === "western" ? "block" : "none";
  document.getElementById("panel-chinese").style.display = tab === "chinese" ? "block" : "none";
}

// ─── Rename Analysis ────────────────────────────────────
function startRenameAnalysis() {
  if (!currentAnalysis) return;
  document.getElementById("rename-input").value = currentAnalysis.name;
  openModal("rename-modal");
  setTimeout(() => document.getElementById("rename-input").focus(), 100);
}

async function submitRename() {
  const newName = document.getElementById("rename-input").value.trim();
  if (!newName || !currentAnalysis) return;
  const res = await fetch(`/api/analyses/${currentAnalysis.id}/rename`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName })
  });
  if (res.ok) {
    currentAnalysis.name = newName;
    document.getElementById("detail-name").textContent = newName;
    closeModal("rename-modal");
  }
}

// ─── Move Analysis ─────────────────────────────────────
function openMoveModal() {
  if (!currentAnalysis) return;
  populateFolderSelects();
  const sel = document.getElementById("move-folder-select");
  sel.value = currentAnalysis.folder_id || "";
  openModal("move-modal");
}

async function submitMove() {
  if (!currentAnalysis) return;
  const folderId = document.getElementById("move-folder-select").value || null;
  const res = await fetch(`/api/analyses/${currentAnalysis.id}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder_id: folderId })
  });
  if (res.ok) {
    currentAnalysis.folder_id = folderId;
    closeModal("move-modal");
  }
}

// ─── Delete Analysis ────────────────────────────────────
function confirmDeleteAnalysis() {
  if (!currentAnalysis) return;
  openModal("confirm-modal");
}

async function executeDelete() {
  if (!currentAnalysis) return;
  const res = await fetch(`/api/analyses/${currentAnalysis.id}`, { method: "DELETE" });
  if (res.ok) {
    closeModal("confirm-modal");
    showListView();
  }
}

// ─── Upload ────────────────────────────────────────────
function openUploadModal() {
  selectedFile = null;
  document.getElementById("analysis-name").value = "";
  document.getElementById("file-input").value = "";
  document.getElementById("file-selected-name").style.display = "none";
  document.getElementById("drop-text").style.display = "block";
  document.getElementById("upload-progress").style.display = "none";
  document.getElementById("upload-error").style.display = "none";
  document.getElementById("btn-analyze").disabled = false;
  populateFolderSelects();
  openModal("upload-modal");
}

function fileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    showUploadError(t("errOnlyPDF"));
    return;
  }
  selectedFile = file;
  document.getElementById("drop-text").style.display = "none";
  const nameEl = document.getElementById("file-selected-name");
  nameEl.textContent = "📄 " + file.name;
  nameEl.style.display = "block";
  document.getElementById("upload-error").style.display = "none";
}

function dragOver(e) {
  e.preventDefault();
  document.getElementById("drop-zone").classList.add("drag-over");
}
function dragLeave() {
  document.getElementById("drop-zone").classList.remove("drag-over");
}
function dropFile(e) {
  e.preventDefault();
  document.getElementById("drop-zone").classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    showUploadError(t("errOnlyPDF"));
    return;
  }
  selectedFile = file;
  document.getElementById("drop-text").style.display = "none";
  const nameEl = document.getElementById("file-selected-name");
  nameEl.textContent = "📄 " + file.name;
  nameEl.style.display = "block";
}

async function submitUpload() {
  if (!selectedFile) { showUploadError(t("errNoFile")); return; }

  const name = document.getElementById("analysis-name").value.trim();
  const folderId = document.getElementById("folder-select").value;

  const formData = new FormData();
  formData.append("file", selectedFile);
  formData.append("lang", lang);
  if (name) formData.append("name", name);
  if (folderId) formData.append("folder_id", folderId);

  // Show progress
  document.getElementById("upload-progress").style.display = "block";
  document.getElementById("btn-analyze").disabled = true;
  document.getElementById("upload-error").style.display = "none";

  // Animate progress bar
  let progress = 0;
  const steps = [
    { pct: 15, delay: 500, msg: t("analyzing") },
    { pct: 40, delay: 8000, msg: t("analyzingWestern") },
    { pct: 70, delay: 12000, msg: t("analyzingChinese") },
    { pct: 90, delay: 8000, msg: t("analyzing") },
  ];
  let stepIndex = 0;
  function advanceProgress() {
    if (stepIndex >= steps.length) return;
    const s = steps[stepIndex++];
    setTimeout(() => {
      setProgress(s.pct, s.msg);
      advanceProgress();
    }, s.delay);
  }
  advanceProgress();

  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      body: formData
    });

    setProgress(100, "✅");

    if (!res.ok) {
      const err = await res.json();
      showUploadError(t("errAnalysis") + ": " + (err.error || res.statusText));
      document.getElementById("btn-analyze").disabled = false;
      setProgress(0, "");
      return;
    }

    const analysis = await res.json();
    closeModal("upload-modal");
    await loadFolders();
    await loadAnalyses(currentFolder);
    // Open the new analysis
    setTimeout(() => openAnalysis(analysis.id), 200);

  } catch (err) {
    showUploadError(t("errAnalysis") + ": " + err.message);
    document.getElementById("btn-analyze").disabled = false;
    setProgress(0, "");
  }
}

function setProgress(pct, msg) {
  document.getElementById("progress-fill").style.width = pct + "%";
  if (msg) document.getElementById("progress-text").textContent = msg;
}

function showUploadError(msg) {
  const el = document.getElementById("upload-error");
  el.textContent = msg;
  el.style.display = "block";
  document.getElementById("upload-progress").style.display = "none";
}

// ─── Modal Helpers ─────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add("open");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

// Keyboard: Escape closes modals
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.open").forEach(m => m.classList.remove("open"));
  }
});

// ─── Utilities ─────────────────────────────────────────
function escHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatDate(isoStr) {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    if (lang === "he") {
      return d.toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" });
    }
    return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
  } catch (e) {
    return isoStr.split("T")[0];
  }
}

// ─── Chat ──────────────────────────────────────────────
async function sendChatMessage() {
  if (!currentAnalysis) return;
  const input = document.getElementById("chat-input");
  const message = input.value.trim();
  if (!message) return;

  input.value = "";
  input.disabled = true;
  document.getElementById("btn-send-chat").disabled = true;

  appendChatBubble("user", message);

  // Thinking indicator
  const thinkingId = "thinking-" + Date.now();
  const thinkingEl = document.createElement("div");
  thinkingEl.id = thinkingId;
  thinkingEl.className = "chat-bubble ai chat-thinking";
  thinkingEl.textContent = t("chatThinking");
  document.getElementById("chat-messages").appendChild(thinkingEl);
  scrollChatToBottom();

  try {
    const res = await fetch(`/api/analyses/${currentAnalysis.id}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: chatHistory, lang })
    });

    document.getElementById(thinkingId)?.remove();

    if (!res.ok) {
      const err = await res.json();
      appendChatBubble("ai", "❌ " + (err.error || "שגיאה"));
    } else {
      const data = await res.json();
      // Update history for multi-turn context
      chatHistory.push({ role: "user", content: message });
      chatHistory.push({ role: "assistant", content: data.reply });
      appendChatBubble("ai", data.reply);
    }
  } catch (e) {
    document.getElementById(thinkingId)?.remove();
    appendChatBubble("ai", "❌ " + e.message);
  }

  input.disabled = false;
  document.getElementById("btn-send-chat").disabled = false;
  input.focus();
}

function appendChatBubble(role, text) {
  const el = document.createElement("div");
  el.className = "chat-bubble " + role;
  el.innerHTML = renderMarkdown(text);
  document.getElementById("chat-messages").appendChild(el);
  scrollChatToBottom();
}

function clearChat() {
  chatHistory = [];
  document.getElementById("chat-messages").innerHTML = "";
  document.getElementById("chat-input").focus();
}

function scrollChatToBottom() {
  const msgs = document.getElementById("chat-messages");
  msgs.scrollTop = msgs.scrollHeight;
}

// ─── Boot ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", init);
