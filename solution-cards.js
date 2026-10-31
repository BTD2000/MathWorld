
// Shared by solutions.js (public solutions)
// and account.js (my solutions).

function typesetMath(element) {
  if (typeof renderMathInElement === "function") {
    renderMathInElement(element, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false }
      ],
      throwOnError: false
    });
  }
}

function formatSolutionTime(row) {
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

// options.authorName: name for the "By ..." line
// options.username: username for profile link
// options.showVisibility: show a Public / Private badge

function makeSolutionCard(row, options = {}) {
  const card = document.createElement("div");
  card.className = "card";

  const header = document.createElement("div");
  header.className = "card-header";

  const title = document.createElement("h3");
  const problemLink = document.createElement("a");

  problemLink.href = "problem.html?id=" + encodeURIComponent(row.problem_id);
  problemLink.textContent = row.problems?.title ||
    "Problem " + row.problem_id;

  title.append(problemLink);
  header.append(title);

  if (options.showVisibility) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = row.is_public ? "Public" : "Private";
    header.append(badge);
  }

  const meta = document.createElement("p");
  meta.className = "solution-meta";

  meta.append("By ");

  if (options.username) {
    const authorLink = document.createElement("a");

    authorLink.href = options.profileUrl ||
      "profile.html?username=" + encodeURIComponent(options.username);

    authorLink.textContent = options.authorName || options.username;
    meta.append(authorLink);
  } else {
    meta.append(options.authorName || "Anonymous");
  }

  meta.append(" on " + formatSolutionTime(row));

  const text = document.createElement("div");
  text.className = "solution-text";

  renderBBCode(text, row.content);

  card.append(header, meta, text);

  return card;
}
