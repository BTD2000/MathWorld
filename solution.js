
/* =====================================================
   FILE: solution.js
   PURPOSE: Display a single solution and its problem.
   ===================================================== */

// =====================================================
// 1. Get solution ID from URL
// =====================================================

const params = new URLSearchParams(location.search);
const solutionId = Number(params.get("solution"));

// =====================================================
// 2. HTML elements
// =====================================================

const solutionStatus = document.getElementById("solutionStatus");
const problemBox = document.getElementById("problemBox");
const solutionContent = document.getElementById("solutionContent");
const backToProblem = document.getElementById("backToProblem");

const infoPanel = document.getElementById("infoPanel");
const problemInfoRows = document.getElementById("problemInfoRows");
const solutionInfoRows = document.getElementById("solutionInfoRows");

// Current logged-in user
let currentUser = null;

// =====================================================
// 3. Validate solution ID
// =====================================================

if (!Number.isInteger(solutionId) || solutionId <= 0) {
    solutionStatus.textContent = "Invalid solution ID.";
} else {
    loadSolution();
}

// =====================================================
// 4. Format date
// =====================================================

function formatDate(value) {
    if (!value) return "Unknown";

    return new Date(value).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

// =====================================================
// 5. Add information row
// =====================================================

function addInfoRow(tableBody, label, content) {
    const row = document.createElement("tr");

    const heading = document.createElement("th");
    heading.scope = "row";
    heading.textContent = label;

    const cell = document.createElement("td");

    if (content instanceof Node) {
        cell.append(content);
    } else {
        cell.textContent = content ?? "—";
    }

    row.append(heading, cell);
    tableBody.append(row);
}

// =====================================================
// 6. Create author link
// =====================================================

function createAuthorLink(solution) {
    const username = solution.profiles?.username;

    if (!username) {
        const text = document.createElement("span");
        text.textContent = "Anonymous";
        return text;
    }

    const link = document.createElement("a");
    link.textContent = username;

    if (currentUser && solution.user_id === currentUser.id) {
        link.href = "account.html";
    } else {
        link.href =
            `profile.html?username=${encodeURIComponent(username)}`;
    }

    return link;
}

// =====================================================
// 7. Display problem information
// =====================================================

function renderProblem(problem) {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h3");
    title.textContent = problem.title;

    const statement = document.createElement("p");
    statement.className = "problem-statement";

    renderBBCode(statement, problem.statement);

    card.append(title, statement);
    problemBox.replaceChildren(card);
}

// =====================================================
// 8. Display solution
// =====================================================

function renderSolution(solution) {
    const card = document.createElement("div");
    card.className = "card";

    const heading = document.createElement("h3");
    heading.textContent = "Solution";

    const author = document.createElement("p");
    author.className = "solution-meta";
    author.append("By ", createAuthorLink(solution));

    const content = document.createElement("div");
    content.className = "solution-text";

    renderBBCode(content, solution.content);

    card.append(heading, author, content);
    solutionContent.replaceChildren(card);
}

// =====================================================
// 9. Display information tables
// =====================================================

function renderInfo(problem, solution) {
    problemInfoRows.replaceChildren();
    solutionInfoRows.replaceChildren();

    // Problem Info
    addInfoRow(problemInfoRows, "Topic", problem.topic || "—");
    addInfoRow(problemInfoRows, "Source", problem.source || "—");
    addInfoRow(problemInfoRows, "Proposer", problem.proposer || "—");

    addInfoRow(
        problemInfoRows,
        "Difficulty",
        difficultyLabel(problem.difficulty)
    );

    // Solution Info
    addInfoRow(
        solutionInfoRows,
        "Author",
        createAuthorLink(solution)
    );

    addInfoRow(
        solutionInfoRows,
        "Published",
        formatDate(solution.created_at)
    );

    if (
        solution.updated_at &&
        Math.abs(
            new Date(solution.updated_at) -
            new Date(solution.created_at)
        ) > 2000
    ) {
        addInfoRow(
            solutionInfoRows,
            "Updated",
            formatDate(solution.updated_at)
        );
    }

    infoPanel.hidden = false;
}

// =====================================================
// 10. Load solution from Supabase
// =====================================================

async function loadSolution() {
    solutionStatus.textContent = "Loading solution...";

    // Get logged-in user
    currentUser = await loadVerifiedUser();

    // Get solution and related problem
    const { data, error } = await db
        .from("solutions")
        .select(`
            id,
            problem_id,
            user_id,
            content,
            created_at,
            updated_at,
            profiles(username),
            problems(
                id,
                title,
                statement,
                topic,
                difficulty,
                source,
                proposer
            )
        `)
        .eq("id", solutionId)
        .single();

    // Handle errors
    if (error) {
        solutionStatus.textContent = "Could not load solution.";
        console.error(error);
        return;
    }

    // Check related problem
    if (!data.problems) {
        solutionStatus.textContent = "Associated problem not found.";
        return;
    }

    // Display problem
    renderProblem(data.problems);

    // Display solution
    renderSolution(data);

    // Display information tables
    renderInfo(data.problems, data);

    // Set back link
    backToProblem.href =
        `problem.html?problem=${data.problem_id}`;

    // Render mathematical expressions
    if (typeof renderMathInElement === "function") {
        renderMathInElement(document.body, {
            delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "\\[", right: "\\]", display: true },
                { left: "$", right: "$", display: false },
                { left: "\\(", right: "\\)", display: false }
            ],
            throwOnError: false
        });
    }

    // Clear status
    solutionStatus.textContent = "";
}
