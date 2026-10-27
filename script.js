// ===== 1. Dark / light mode toggle =====
const themeToggle = document.getElementById("themeToggle");

function updateToggleLabel() {
  if (!themeToggle) return;
  const isDark = document.documentElement.dataset.theme === "dark";
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
}

if (themeToggle) {
  themeToggle.addEventListener("click", function () {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
    updateToggleLabel();
  });
}

updateToggleLabel();


// ===== 2. Highlight the link for the current page =====
(function () {
  let page = (location.pathname.split("/").pop() || "index").replace(".html", "");
  if (page === "problem") {
    page = "problems";
  }

  document.querySelectorAll(".sidebar ul a").forEach(function (link) {
    link.classList.remove("active");
    const target = link.getAttribute("href").replace(".html", "");
    if (target === page) {
      link.classList.add("active");
    }
  });
})();


// ===== 3. Typeset the math with KaTeX (only on pages that load it) =====
if (typeof renderMathInElement === "function") {
  renderMathInElement(document.body, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\[", right: "\\]", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false }
    ]
  });
}


// ===== 4. Show a difficulty number nicely (scale 1 to 14) =====
function difficultyLabel(value) {
  if (value === null || value === undefined || value === "") {
    return "Unrated";
  }
  if (typeof value === "number") {
    return value + " / 14";
  }
  return String(value);
}
