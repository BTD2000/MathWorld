const statusLine = document.getElementById("statusLine");
const solutionList = document.getElementById("solutionList");

const PAGE_SIZE = 50;

async function loadPublicSolutions() {
  statusLine.textContent = "Loading...";

  const { data, error } = await db
    .from("solutions")
    .select("id, problem_id, user_id, content, is_public, created_at, updated_at, problems(title), profiles(username)")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (error) {
    console.log(error);
    statusLine.textContent = "Could not load the solutions. Please try again later.";
    return;
  }

  if (data.length === 0) {
    statusLine.textContent = "No public solutions yet.";
    return;
  }

  statusLine.textContent = data.length === PAGE_SIZE
    ? "Showing the latest " + PAGE_SIZE + " solutions."
    : data.length + (data.length === 1 ? " solution" : " solutions");

  solutionList.replaceChildren();
  for (const row of data) {
    const name = row.profiles && row.profiles.username ? row.profiles.username : "Anonymous";
    solutionList.append(makeSolutionCard(row, { authorName: name, showVisibility: false }));
  }

  typesetMath(solutionList);
}

loadPublicSolutions();