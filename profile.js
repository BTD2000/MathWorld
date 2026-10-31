
const profileStatus = document.getElementById("profileStatus");
const profileContent = document.getElementById("profileContent");

const profileInitial = document.getElementById("profileInitial");
const profileUsername = document.getElementById("profileUsername");
const profileJoined = document.getElementById("profileJoined");

const publicSolutionCount = document.getElementById("publicSolutionCount");
const solutionsStatus = document.getElementById("solutionsStatus");
const solutionList = document.getElementById("solutionList");

const MAX_SOLUTIONS = 100;

// ---------- Load public solutions ----------
async function loadPublicSolutions(userId, username) {
  solutionsStatus.textContent = "Loading solutions...";

  const { data, error, count } = await db
    .from("solutions")
    .select(
      "id, problem_id, user_id, content, is_public, created_at, updated_at, problems(title)",
      { count: "exact" }
    )
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(MAX_SOLUTIONS);

  if (error) {
    console.error(error);
    solutionsStatus.textContent = "Could not load solutions.";
    return;
  }

  publicSolutionCount.textContent = count ?? 0;
  solutionList.replaceChildren();

  if (data.length === 0) {
    solutionsStatus.textContent =
      "This user has not shared any public solutions yet.";
    return;
  }

  solutionsStatus.textContent = data.length === MAX_SOLUTIONS
    ? `Showing the latest ${MAX_SOLUTIONS} public solutions.`
    : `${data.length} public ${data.length === 1 ? "solution" : "solutions"}.`;

  for (const row of data) {
    solutionList.append(
      makeSolutionCard(row, {
        authorName: username,
        username: username,
        showVisibility: false
      })
    );
  }

  typesetMath(solutionList);
}

// ---------- Load profile ----------
async function loadProfile() {
  const params = new URLSearchParams(window.location.search);
  const username = params.get("username");

  if (!username) {
    profileStatus.textContent = "No username was provided.";
    return;
  }

  const { data: profile, error } = await db
    .from("profiles")
    .select("id, username, created_at")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    console.error(error);
    profileStatus.textContent = "Could not load this profile.";
    return;
  }

  if (!profile) {
    profileStatus.textContent = "User not found.";
    return;
  }

  profileStatus.textContent = "";
  profileContent.hidden = false;

  profileUsername.textContent = profile.username;
  profileInitial.textContent =
    profile.username.charAt(0).toUpperCase();

  const joinedDate = new Date(profile.created_at);

  profileJoined.textContent = "Joined " +
    joinedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

  await loadPublicSolutions(profile.id, profile.username);
}

// ---------- Start ----------
loadProfile();
