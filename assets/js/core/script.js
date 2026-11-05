/* =====================================================
   FILE: script.js
   PURPOSE: Provide shared theme, navigation, and page utilities.
   ===================================================== */

// ===== 1. Theme toggle =====

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
  updateToggleLabel();
}


// ===== 2. Highlight the link for the current page =====
(function () {
  let page = (location.pathname.split("/").pop() || "index").replace(".html", "");
  if (page === "problem") {
    page = "problems";
  }

  document.querySelectorAll(".sidebar ul a").forEach(function (link) {
    link.classList.remove("active");

    const target = new URL(link.href, window.location.origin)
      .pathname.split("/")
      .pop()
      .replace(".html", "");

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
      { left: "\\(", right: "\\)", display: false}
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


// ===== 5. Theme selection =====

const themeButtons = document.querySelectorAll("[data-theme-choice]");

themeButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const selectedTheme = button.dataset.themeChoice;

    applyTheme(selectedTheme);
  });
});
