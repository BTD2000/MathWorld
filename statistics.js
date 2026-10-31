const statsStatus = document.getElementById("statsStatus");

async function getCount(table) {
  const { count, error } = await db
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function loadStatistics() {
  try {
    const [problems, solutions, members] = await Promise.all([
      getCount("problems"),
      getCount("solutions"),
      getCount("profiles")
    ]);

    document.getElementById("problemCount").textContent =
      problems.toLocaleString();

    document.getElementById("solutionCount").textContent =
      solutions.toLocaleString();

    document.getElementById("memberCount").textContent =
      members.toLocaleString();

    statsStatus.textContent = "";
  } catch (error) {
    console.error("Statistics error:", error);
    statsStatus.textContent = "Could not load statistics.";
  }
}

loadStatistics();