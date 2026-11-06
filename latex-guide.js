/* =====================================================
   FILE: latex-guide.js
   PURPOSE: Add interactive behavior to the LaTeX guide.
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  renderMathInElement(document.querySelector("main"), {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\[", right: "\\]", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false }
    ],
    throwOnError: false
  });
});