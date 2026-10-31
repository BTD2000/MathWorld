const statusLine = document.getElementById("statusLine");
const accountContent = document.getElementById("accountContent");
const profileEmail = document.getElementById("profileEmail");
const profileUsername = document.getElementById("profileUsername");
const profileInitial = document.getElementById("profileInitial");

const solutionCount = document.getElementById("solutionCount");
const publicSolutionCount = document.getElementById("publicSolutionCount");
const usernameForm = document.getElementById("usernameForm");
const usernameInput = document.getElementById("usernameInput");
const usernameMessage = document.getElementById("usernameMessage");
const solutionsStatus = document.getElementById("solutionsStatus");
const solutionList = document.getElementById("solutionList");

const emailForm = document.getElementById("emailForm");
const newEmailInput = document.getElementById("newEmailInput");
const emailCurrentPassword = document.getElementById("emailCurrentPassword");
const emailMessage = document.getElementById("emailMessage");

const passwordForm = document.getElementById("passwordForm");
const passwordCurrentPassword = document.getElementById("passwordCurrentPassword");
const passwordMessage = document.getElementById("passwordMessage");

const MAX_SOLUTIONS = 100;
let currentUser = null;

function showUsernameMessage(text, isError) {
  usernameMessage.textContent = text;
  usernameMessage.classList.toggle("error", Boolean(isError));
}

function showFormMessage(element, text, isError = false) {
  element.textContent = text;
  element.classList.toggle("error", Boolean(isError));
}

// ---------- My solutions across all problems ----------
async function loadMySolutions() {
  solutionsStatus.textContent = "Loading...";
  const [totalResult, publicResult] = await Promise.all([
      db.from("solutions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", currentUser.id),

      db.from("solutions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", currentUser.id)
        .eq("is_public", true)
    ]);

    if (!totalResult.error) {
      solutionCount.textContent = totalResult.count ?? 0;
    }

    if (!publicResult.error) {
      publicSolutionCount.textContent = publicResult.count ?? 0;
    }
  const { data, error } = await db
    .from("solutions")
    .select("id, problem_id, user_id, content, is_public, created_at, updated_at, problems(title)")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false })
    .limit(MAX_SOLUTIONS);

  if (error) {
    console.log(error);
    solutionsStatus.textContent = "Could not load your solutions. Please try again later.";
    return;
  }

  solutionList.replaceChildren();
  if (data.length === 0) {
    solutionsStatus.textContent = "You have not saved any solutions yet. Open a problem to write one.";
    return;
  }

  solutionsStatus.textContent = data.length === MAX_SOLUTIONS
    ? "Showing your latest " + MAX_SOLUTIONS + " solutions. Open a problem to edit its solution."
    : data.length + (data.length === 1 ? " solution" : " solutions") + ". Open a problem to edit its solution.";

  for (const row of data) {
    solutionList.append(makeSolutionCard(row, { authorName: "You", showVisibility: true }));
  }
  typesetMath(solutionList);
}

// ---------- Change username ----------
usernameForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  showUsernameMessage("", false);
  const username = usernameInput.value.trim();

  if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) {
    showUsernameMessage("Use 3 to 30 letters, numbers or underscores.", true);
    return;
  }
  if (username === currentUser.username) {
    showUsernameMessage("That is already your username.", true);
    return;
  }

  const submitButton = usernameForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  try {
    const { data, error } = await db.from("profiles")
      .update({ username })
      .eq("id", currentUser.id)
      .select("username");

    if (error) {
      showUsernameMessage(error.code === "23505" ? "That username is already taken." : error.message, true);
      return;
    }
    if (!data || data.length === 0) {
      showUsernameMessage("Could not update the username.", true);
      return;
    }
    currentUser.username = username;
    profileUsername.textContent = username;
    profileInitial.textContent = username.charAt(0).toUpperCase();
    showUsernameMessage("Username updated.", false);
  } catch (error) {
    console.error(error);
    showUsernameMessage("Something went wrong. Please try again.", true);
  } finally {
    submitButton.disabled = false;
  }
});

// ---------- Change email ----------
emailForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  showFormMessage(emailMessage, "");
  const newEmail = newEmailInput.value.trim();
  const currentPassword = emailCurrentPassword.value;

  if (!currentUser?.email) {
    showFormMessage(emailMessage, "Could not identify your current email.", true);
    return;
  }
  if (newEmail.toLowerCase() === currentUser.email.toLowerCase()) {
    showFormMessage(emailMessage, "That is already your current email.", true);
    return;
  }

  const button = emailForm.querySelector("button[type='submit']");
  button.disabled = true;
  try {
    const { error: verifyError } = await db.auth.signInWithPassword({
      email: currentUser.email,
      password: currentPassword
    });
    if (verifyError) {
      showFormMessage(emailMessage, "Current password is incorrect.", true);
      return;
    }

    const redirectTo = new URL("account.html", window.location.href).href;
    const { error } = await db.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo: redirectTo }
    );
    if (error) {
      showFormMessage(emailMessage, error.message, true);
      return;
    }

    emailCurrentPassword.value = "";
    newEmailInput.value = "";
    showFormMessage(emailMessage, "Confirmation email sent. Follow the instructions in your email to complete the change.");
  } catch (error) {
    console.error(error);
    showFormMessage(emailMessage, "Something went wrong. Please try again.", true);
  } finally {
    button.disabled = false;
  }
});

// ---------- Start password-change flow ----------
passwordForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  showFormMessage(passwordMessage, "");
  if (!currentUser?.email) {
    showFormMessage(passwordMessage, "Could not identify your account email.", true);
    return;
  }

  const currentPassword = passwordCurrentPassword.value;
  const button = passwordForm.querySelector("button[type='submit']");
  button.disabled = true;
  try {
    const { error: verifyError } = await db.auth.signInWithPassword({
      email: currentUser.email,
      password: currentPassword
    });
    if (verifyError) {
      showFormMessage(passwordMessage, "Current password is incorrect.", true);
      return;
    }

    const redirectTo = new URL("update-password.html", window.location.href).href;
    const { error } = await db.auth.resetPasswordForEmail(currentUser.email, { redirectTo });
    if (error) {
      showFormMessage(passwordMessage, error.message, true);
      return;
    }

    passwordCurrentPassword.value = "";
    showFormMessage(passwordMessage, "Verification email sent. Open its link to choose your new password.");
  } catch (error) {
    console.error(error);
    showFormMessage(passwordMessage, "Something went wrong. Please try again.", true);
  } finally {
    button.disabled = false;
  }
});

// ---------- Start ----------
async function init() {
  currentUser = await getVerifiedUser();
  if (!currentUser) {
    const link = document.createElement("a");
    link.href = "login.html";
    link.textContent = "Log in";
    statusLine.replaceChildren(link, " to see your account.");
    return;
  }

  statusLine.textContent = "";
  const username = currentUser.username || "MathWorld Member";

  profileEmail.textContent = currentUser.email || "";
  profileUsername.textContent = username;
  profileInitial.textContent = username.charAt(0).toUpperCase();

  usernameInput.value = currentUser.username || "";
  accountContent.hidden = false;
  await loadMySolutions();
}
init();
