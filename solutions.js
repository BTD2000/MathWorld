
console.log("solutions.js loaded");

const statusLine = document.getElementById("statusLine");
const solutionList = document.getElementById("solutionList");

const PAGE_SIZE = 50;

async function loadPublicSolutions() {
  console.log("loadPublicSolutions started");

  statusLine.textContent = "Loading...";
  solutionList.replaceChildren();

  try {
    const { data, error } = await db
      .from("solutions")
      .select(`
        id,
        problem_id,
        user_id,
        content,
        is_public,
        created_at,
        updated_at,
        problems(title),
        profiles(username)
      `)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      console.error("Supabase error:", error);
      statusLine.textContent =
        "Could not load the solutions. Please try again later.";
      return;
    }

    if (!data || data.length === 0) {
      statusLine.textContent = "No public solutions yet.";
      return;
    }

    statusLine.textContent =
      data.length === PAGE_SIZE
        ? `Showing the latest ${PAGE_SIZE} solutions.`
        : `${data.length} ${data.length === 1 ? "solution" : "solutions"}`;

    for (const row of data) {
      const username = row.profiles?.username || null;

      solutionList.append(
        makeSolutionCard(row, {
          authorName: username || "Anonymous",
          username: username,
          showVisibility: false
        })
      );
    }

    typesetMath(solutionList);

  } catch (error) {
    console.error("Unexpected error:", error);
    statusLine.textContent =
      "Something went wrong while loading solutions.";
  }
}

loadPublicSolutions();
