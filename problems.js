const problemRows = document.getElementById("problemRows");
const statusLine = document.getElementById("statusLine");
const resultCount = document.getElementById("resultCount");
const searchInput = document.getElementById("searchInput");
const topicSelect = document.getElementById("topicSelect");
const minDiff = document.getElementById("minDiff");
const maxDiff = document.getElementById("maxDiff");
const tagFilter = document.getElementById("tagFilter");
const clearButton = document.getElementById("clearFilters");
const sortButtons = document.querySelectorAll(".sort-btn");

const CACHE_KEY = "problemsCache3";

let allProblems = [];
let sortKey = "id";
let sortDir = 1; // 1 = ascending, -1 = descending
const selectedTags = new Set();
let solvedIds = new Set();

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

// ---------- Filtering ----------
function matches(problem) {
  const query = searchInput.value.trim().toLowerCase();
  if (query && !String(problem.title).toLowerCase().includes(query)) {
    return false;
  }

  if (topicSelect.value && problem.topic !== topicSelect.value) {
    return false;
  }

  const min = minDiff.value === "" ? null : Number(minDiff.value);
  const max = maxDiff.value === "" ? null : Number(maxDiff.value);
  const level = problem.difficulty;

  if (min !== null && !(typeof level === "number" && level >= min)) {
    return false;
  }
  if (max !== null && !(typeof level === "number" && level <= max)) {
    return false;
  }

  // every selected tag must be on the problem
  for (const tag of selectedTags) {
    if (!Array.isArray(problem.tags) || !problem.tags.includes(tag)) {
      return false;
    }
  }

  return true;
}

// ---------- Sorting ----------
function sortList(list) {
  const copy = list.slice();

  copy.sort(function (a, b) {
    const av = a[sortKey];
    const bv = b[sortKey];
    const aEmpty = !hasValue(av);
    const bEmpty = !hasValue(bv);

    // problems with no value always go to the end
    if (aEmpty && bEmpty) return a.id - b.id;
    if (aEmpty) return 1;
    if (bEmpty) return -1;

    let result;
    if (typeof av === "number" && typeof bv === "number") {
      result = av - bv;
    } else {
      result = String(av).localeCompare(String(bv), "en", {
        sensitivity: "base",
        numeric: true
      });
    }

    if (result !== 0) return result * sortDir;
    return a.id - b.id;
  });

  return copy;
}

function updateSortIndicators() {
  sortButtons.forEach(function (button) {
    const arrow = button.querySelector(".sort-arrow");
    if (button.dataset.sort === sortKey) {
      arrow.textContent = sortDir === 1 ? "\u25B2" : "\u25BC";
    } else {
      arrow.textContent = "";
    }
  });
}

// ---------- Drawing the table ----------
function makeRow(problem) {
  const row = document.createElement("tr");

  const idCell = document.createElement("td");
  idCell.textContent = problem.id;

  const titleCell = document.createElement("td");
  const link = document.createElement("a");
  link.href = "problem.html?id=" + problem.id;
  link.textContent = problem.title;
  titleCell.append(link);
  if (solvedIds.has(problem.id)) {
    const solved = document.createElement("span");
    solved.className = "badge badge-solved";
    solved.textContent = "\u2713 Solved";
    titleCell.append(solved);
  }

  const topicCell = document.createElement("td");
  topicCell.textContent = problem.topic || "-";

  const tagsCell = document.createElement("td");
  if (Array.isArray(problem.tags) && problem.tags.length > 0) {
    const list = document.createElement("div");
    list.className = "tag-list";
    for (const tag of problem.tags) {
      const chip = document.createElement("span");
      chip.className = "badge badge-topic";
      chip.textContent = tag;
      list.append(chip);
    }
    tagsCell.append(list);
  } else {
    tagsCell.textContent = "-";
  }

  const levelCell = document.createElement("td");
  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = difficultyLabel(problem.difficulty);
  levelCell.append(badge);

  row.append(idCell, titleCell, topicCell, tagsCell, levelCell);
  return row;
}

function render() {
  const visible = sortList(allProblems.filter(matches));

  problemRows.replaceChildren();

  if (visible.length === 0 && allProblems.length > 0) {
    const row = document.createElement("tr");
    row.className = "empty-row";
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "No problems match your filters.";
    row.append(cell);
    problemRows.append(row);
  }

  for (const problem of visible) {
    problemRows.append(makeRow(problem));
  }

  resultCount.textContent = allProblems.length === 0
    ? ""
    : "Showing " + visible.length + " of " + allProblems.length + " problems";

  updateSortIndicators();
}

// ---------- Build the topic list and tag chips from the data ----------
function populateFilters() {
  const topics = Array.from(
    new Set(allProblems.map(function (p) { return p.topic; }).filter(Boolean))
  ).sort(function (a, b) { return a.localeCompare(b); });

  const previousTopic = topicSelect.value;
  topicSelect.replaceChildren(new Option("All topics", ""));
  for (const topic of topics) {
    topicSelect.append(new Option(topic, topic));
  }
  topicSelect.value = topics.includes(previousTopic) ? previousTopic : "";

  const tags = Array.from(
    new Set(
      allProblems.flatMap(function (p) {
        return Array.isArray(p.tags) ? p.tags : [];
      })
    )
  ).sort(function (a, b) { return a.localeCompare(b); });

  // forget selected tags that no longer exist
  for (const tag of Array.from(selectedTags)) {
    if (!tags.includes(tag)) selectedTags.delete(tag);
  }

  tagFilter.replaceChildren();

  if (tags.length === 0) {
    tagFilter.hidden = true;
    return;
  }

  tagFilter.hidden = false;

  const label = document.createElement("span");
  label.className = "tag-filter-label";
  label.textContent = "Tags:";
  tagFilter.append(label);

  for (const tag of tags) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip" + (selectedTags.has(tag) ? " selected" : "");
    chip.textContent = tag;
    chip.setAttribute("aria-pressed", selectedTags.has(tag) ? "true" : "false");

    chip.addEventListener("click", function () {
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
      } else {
        selectedTags.add(tag);
      }
      chip.classList.toggle("selected", selectedTags.has(tag));
      chip.setAttribute("aria-pressed", selectedTags.has(tag) ? "true" : "false");
      render();
    });

    tagFilter.append(chip);
  }
}

// ---------- Events ----------
searchInput.addEventListener("input", render);
topicSelect.addEventListener("change", render);
minDiff.addEventListener("input", render);
maxDiff.addEventListener("input", render);

clearButton.addEventListener("click", function () {
  searchInput.value = "";
  topicSelect.value = "";
  minDiff.value = "";
  maxDiff.value = "";
  selectedTags.clear();
  populateFilters();
  render();
});

sortButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const key = button.dataset.sort;
    if (sortKey === key) {
      sortDir = -sortDir;
    } else {
      sortKey = key;
      sortDir = 1;
    }
    render();
  });
});

// ---------- Cache ----------
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeCache(list) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch (e) {
    // storage may be unavailable; the page still works without it
  }
}

// ---------- Load ----------
async function loadProblems() {
  const cached = readCache();
  if (cached && cached.length > 0) {
    allProblems = cached;
    populateFilters();
    render();
    statusLine.textContent = "";
  } else {
    statusLine.textContent = "Loading...";
  }

  const startedAt = performance.now();
  const { data, error } = await db
    .from("problems")
    .select("id, title, topic, difficulty, tags")
    .order("id");
  console.log("Supabase request took", Math.round(performance.now() - startedAt), "ms");

  if (error) {
    console.log(error);
    if (!cached) {
      statusLine.textContent = "Could not load the problems. Please try again later.";
    }
    return;
  }

  statusLine.textContent = data.length === 0 ? "No problems yet." : "";
  allProblems = data;
  populateFilters();
  render();
  writeCache(data);
}

// ---------- Mark the problems this person has already saved a solution for ----------
async function loadSolved() {
  const user = await getVerifiedUser();
  if (!user) return;

  const { data, error } = await db
    .from("solutions")
    .select("problem_id")
    .eq("user_id", user.id);

  if (error) {
    console.log(error);
    return;
  }

  solvedIds = new Set(data.map(function (row) { return row.problem_id; }));
  render();
}

updateSortIndicators();
loadProblems();
loadSolved();