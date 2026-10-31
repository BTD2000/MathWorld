const params = new URLSearchParams(location.search);
const problemId = Number(params.get("id"));

const statusLine = document.getElementById("statusLine");
const problemBox = document.getElementById("problemBox");
const loginPrompt = document.getElementById("loginPrompt");
const solutionForm = document.getElementById("solutionForm");
const solutionText = document.getElementById("solutionText");
const solutionPreview = document.getElementById("solutionPreview");
const isPublicBox = document.getElementById("isPublic");
const formMessage = document.getElementById("formMessage");
const myList = document.getElementById("myList");
const publicList = document.getElementById("publicList");
const infoPanel = document.getElementById("infoPanel");
const infoRows = document.getElementById("infoRows");

let currentUser = null;

function typeset(element) {
  if (typeof renderMathInElement === "function") {
    renderMathInElement(element, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false}
      ],
      throwOnError: false
    });
  }
}

// ---------- Details table helpers ----------
function addInfoRow(label, content) {
  const row = document.createElement("tr");

  const th = document.createElement("th");
  th.scope = "row";
  th.textContent = label;

  const td = document.createElement("td");
  if (typeof content === "string") {
    td.textContent = content;
  } else {
    td.append(content);
  }

  row.append(th, td);
  infoRows.append(row);
  return td;
}

// Only allow normal web links (blocks things like "javascript:...")
function safeUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.href;
    }
  } catch (e) {
    // not a valid URL
  }
  return null;
}

// "https://site.com/page"  or  "Label | https://site.com/page"
function parseLink(entry) {
  const text = String(entry).trim();
  const separator = text.indexOf(" | ");
  const label = separator === -1 ? "" : text.slice(0, separator).trim();
  const url = separator === -1 ? text : text.slice(separator + 3).trim();

  const href = safeUrl(url);
  if (!href) return null;

  return {
    href: href,
    label: label || new URL(href).hostname.replace(/^www\./, "")
  };
}

function renderInfo(data) {
  infoRows.replaceChildren();

  if (data.source) {
    addInfoRow("Source", data.source);
  }
  if (data.proposer) {
    addInfoRow("Proposer", data.proposer);
  }
  if (data.topic) {
    addInfoRow("Topic", data.topic);
  }

  if (data.tags && data.tags.length > 0) {
    const list = document.createElement("div");
    list.className = "tag-list";
    for (const tag of data.tags) {
      const chip = document.createElement("span");
      chip.className = "badge badge-topic";
      chip.textContent = tag;
      list.append(chip);
    }
    addInfoRow("Tags", list);
  }

  addInfoRow("Difficulty", difficultyLabel(data.difficulty));

  if (data.proposer_note) {
    const noteCell = addInfoRow("Proposer's note", data.proposer_note);
    noteCell.className = "info-note";
  }

  // See also: external links that open in a new tab
  const entries = Array.isArray(data.see_also) ? data.see_also : [];
  const wrap = document.createElement("div");
  wrap.className = "see-also-list";

  for (const entry of entries) {
    const item = parseLink(entry);
    if (!item) continue;

    const line = document.createElement("div");
    const link = document.createElement("a");
    link.href = item.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = item.label + " \u2197";
    line.append(link);
    wrap.append(line);
  }

  if (wrap.children.length > 0) {
    addInfoRow("See also", wrap);
  }

  infoPanel.hidden = false;
  typeset(infoPanel);
}

// ---------- Load the problem ----------
async function loadProblem() {
  const { data, error } = await db
    .from("problems")
    .select("id, title, statement, topic, difficulty, source, proposer, tags, proposer_note, see_also")
    .eq("id", problemId)
    .single();

  if (error || !data) {
    statusLine.textContent = "Problem not found.";
    return false;
  }

  document.title = data.title + " - MathWorld";

  const card = document.createElement("div");
  card.className = "card";

  const title = document.createElement("h3");
  title.textContent = data.title;

  const statement = document.createElement("p");
  statement.className = "problem-statement";
  renderBBCode(statement, data.statement);

  card.append(title, statement);
  problemBox.replaceChildren(card);
  typeset(problemBox);

  renderInfo(data);
  return true;
}

// ---------- Live math preview while typing ----------
// Returns a function that redraws the preview right away.
function bindPreview(textarea, previewElement) {
  let timer = null;

  function update() {
    const text = textarea.value;
    if (text.trim() === "") {
      previewElement.hidden = true;
      previewElement.textContent = "";
      return;
    }
    previewElement.hidden = false;
    renderBBCode(previewElement, text);
    typeset(previewElement);
  }

  textarea.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(update, 200);
  });

  return update;
}

const updateFormPreview = bindPreview(solutionText, solutionPreview);

// ---------- Time text for a solution ----------
function describeTime(row) {
  const created = new Date(row.created_at);
  let text = created.toLocaleString("en-US");
  if (row.updated_at) {
    const updated = new Date(row.updated_at);
    if (updated - created > 2000) {
      text += " (updated " + updated.toLocaleString("en-US") + ")";
    }
  }
  return text;
}

// ---------- Edit a saved solution ----------
function openEditor(card, row) {
  card.replaceChildren();

  const label = document.createElement("label");
  label.className = "editor-label";
  label.append("Edit your solution");

  const textarea = document.createElement("textarea");
  textarea.rows = 8;
  textarea.maxLength = 20000;
  textarea.value = row.content;
  label.append(textarea);

  const preview = document.createElement("div");
  preview.className = "solution-preview";
  preview.hidden = true;
  const updatePreview = bindPreview(textarea, preview);

  const visibility = document.createElement("label");
  visibility.className = "inline";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = row.is_public;
  visibility.append(checkbox, "Make this solution public");

  const actions = document.createElement("div");
  actions.className = "solution-actions";

  const message = document.createElement("p");
  message.className = "editor-message";

  const save = document.createElement("button");
  save.type = "button";
  save.className = "btn btn-primary btn-small";
  save.textContent = "Save changes";
  save.addEventListener("click", async function () {
    const content = textarea.value.trim();
    if (!content) {
      message.textContent = "The solution cannot be empty.";
      return;
    }

    save.disabled = true;
    const { error } = await db
      .from("solutions")
      .update({ content: content, is_public: checkbox.checked })
      .eq("id", row.id);

    if (error) {
      message.textContent = error.message;
      save.disabled = false;
      return;
    }
    loadSolutions();
  });

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "btn btn-small";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", function () {
    loadSolutions();
  });

  actions.append(save, cancel);
  card.append(label, preview, visibility, actions, message);

  updatePreview();
  textarea.focus();
}

// ---------- Build one solution card ----------

function makeSolution(row, isMine) {
  const card = document.createElement("div");
  card.className = "card";

  const header = document.createElement("div");
  header.className = "card-header";

  const author = document.createElement("strong");
  const username = row.profiles?.username || null;

  if (isMine) {
    author.textContent = "You";
  } else if (username) {
    const authorLink = document.createElement("a");
    authorLink.href =
      "profile.html?username=" + encodeURIComponent(username);
    authorLink.textContent = username;
    author.append(authorLink);
  } else {
    author.textContent = "Anonymous";
  }

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = row.is_public ? "Public" : "Private";

  header.append(author, badge);

  const meta = document.createElement("p");
  meta.className = "solution-meta";
  meta.textContent = describeTime(row);

  const text = document.createElement("div");
  text.className = "solution-text";
  renderBBCode(text, row.content);

  card.append(header, meta, text);

  if (isMine) {
    const actions = document.createElement("div");
    actions.className = "solution-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "btn btn-small";
    edit.textContent = "Edit";
    edit.addEventListener("click", function () {
      openEditor(card, row);
    });

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "btn btn-small";
    toggle.textContent = row.is_public ? "Make private" : "Make public";
    toggle.addEventListener("click", async function () {
      const { error } = await db
        .from("solutions")
        .update({ is_public: !row.is_public })
        .eq("id", row.id);

      if (error) {
        alert(error.message);
        return;
      }
      loadSolutions();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn btn-small";
    remove.textContent = "Delete";
    remove.addEventListener("click", async function () {
      if (!confirm("Delete this solution?")) return;

      const { error } = await db
        .from("solutions")
        .delete()
        .eq("id", row.id);

      if (error) {
        alert(error.message);
        return;
      }
      loadSolutions();
    });

    actions.append(edit, toggle, remove);
    card.append(actions);
  }

  return card;
}


// ---------- Load the solutions ----------
async function loadSolutions() {
  const { data, error } = await db
    .from("solutions")
    .select("id, user_id, content, is_public, created_at, updated_at, profiles(username)")
    .eq("problem_id", problemId)
    .order("created_at", { ascending: false });

  if (error) {
    console.log(error);
    publicList.textContent = "Could not load the solutions.";
    return;
  }

  myList.replaceChildren();
  publicList.replaceChildren();

  for (const row of data) {
    const mine = currentUser !== null && row.user_id === currentUser.id;
    if (mine) {
      myList.append(makeSolution(row, true));
    } else {
      publicList.append(makeSolution(row, false));
    }
  }

  if (publicList.children.length === 0) {
    publicList.textContent = "No public solutions yet.";
  }

  typeset(myList);
  typeset(publicList);
}

// ---------- Save a new solution ----------
solutionForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const content = solutionText.value.trim();
  if (!content) return;

  const { error } = await db.from("solutions").insert({
    problem_id: problemId,
    content: content,
    is_public: isPublicBox.checked
  });

  if (error) {
    formMessage.textContent = error.message;
    return;
  }

  formMessage.textContent = "Saved.";
  solutionText.value = "";
  isPublicBox.checked = false;
  updateFormPreview();
  loadSolutions();
});

// ---------- Start ----------
async function init() {
  if (!problemId) {
    statusLine.textContent = "Invalid problem ID.";
    return;
  }

  currentUser = await getVerifiedUser();
  loginPrompt.hidden = currentUser !== null;
  solutionForm.hidden = currentUser === null;

  await Promise.all([loadProblem(), loadSolutions()]);
}

init();