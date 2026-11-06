
/* =====================================================
   FILE: contests.js
   PURPOSE: Load and display available contests.
   ===================================================== */

// =====================================================
// 1. DOM ELEMENTS
// =====================================================

const contestsContainer = document.getElementById("contestsContainer");


// =====================================================
// 2. HELPER FUNCTIONS
// =====================================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}


// =====================================================
// 3. CONTEST CARD
// =====================================================

function createContestCard(contest) {
    const statusLabels = {
        draft: "Pending verification",
        published: "Published",
        finished: "Finished"
    };

    const statusLabel = statusLabels[contest.status] || contest.status;

    return `
        <article class="card contest-card">
            <div class="card-header">
                <h3>${escapeHTML(contest.title)}</h3>
                <span class="badge">
                    ${escapeHTML(statusLabel)}
                </span>
            </div>

            <p>
                ${escapeHTML(contest.description || "No description provided.")}
            </p>

            <div class="contest-info">
                <p>
                    <strong>Start:</strong>
                    ${formatDate(contest.start_date)}
                </p>

                <p>
                    <strong>Registration deadline:</strong>
                    ${formatDate(contest.registration_deadline)}
                </p>

                <p>
                    <strong>Duration:</strong>
                    ${contest.duration_minutes} minutes
                </p>
            </div>
        </article>
    `;
}


// =====================================================
// 4. CONTEST SECTION
// =====================================================

function renderContestSection(title, contests) {
    if (contests.length === 0) {
        return "";
    }

    return `
        <section class="contest-section">
            <h2>${title}</h2>

            <div class="contest-list">
                ${contests.map(createContestCard).join("")}
            </div>
        </section>
    `;
}


// =====================================================
// 5. LOAD CONTESTS
// =====================================================

async function loadContests() {
    contestsContainer.innerHTML = "<p>Loading contests...</p>";

    const { data: contests, error } = await db
        .from("contests")
        .select("*")
        .order("start_date", { ascending: true });

    if (error) {
        console.error("Error loading contests:", error);

        contestsContainer.innerHTML = `
            <p class="note">
                Unable to load contests. Please try again later.
            </p>
        `;
        return;
    }

    const now = new Date();

    const drafts = contests.filter(
        contest => contest.status === "draft"
    );

    const upcoming = contests.filter(
        contest =>
            contest.status === "published" &&
            new Date(contest.start_date) > now
    );

    const ongoing = contests.filter(
        contest =>
            contest.status === "published" &&
            new Date(contest.start_date) <= now
    );

    const past = contests.filter(
        contest => contest.status === "finished"
    );

    contestsContainer.innerHTML = [
        renderContestSection("Pending Verification", drafts),
        renderContestSection("Upcoming Contests", upcoming),
        renderContestSection("Ongoing Contests", ongoing),
        renderContestSection("Past Contests", past)
    ].join("");

    if (!contestsContainer.innerHTML.trim()) {
        contestsContainer.innerHTML = "<p>No contests available yet.</p>";
    }
}


// =====================================================
// 6. INITIALIZE
// =====================================================

loadContests();
