// Loads the logged-in user, checking with the server that the account is still valid.
// db.auth.getSession() only reads what the browser has stored, so on its own it could
// still show a deleted account as "logged in".
//
// Returns the user (with user.username added) or null.
// An account whose row was removed from "profiles" counts as a removed account.
async function loadVerifiedUser() {
  if (typeof db === "undefined") return null;

  const { data: { session } } = await db.auth.getSession();
  if (!session) return null;

  // 1. Does this login still exist on the server?
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) {
    await db.auth.signOut({ scope: "local" });
    return null;
  }

  // 2. Does the account still have its profile?
  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("username")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profileError && !profile) {
    await db.auth.signOut({ scope: "local" });
    return null;
  }

  const user = data.user;
  user.username = profile ? profile.username : null;
  return user;
}

// Same thing, but only asks the server once per page load.
let verifiedUserPromise = null;
function getVerifiedUser() {
  if (!verifiedUserPromise) {
    verifiedUserPromise = loadVerifiedUser();
  }
  return verifiedUserPromise;
}

// Sidebar: when someone is logged in, show Account and Log out instead of Login and Signup.
(async function () {
  if (typeof db === "undefined") return;

  const loginLink = document.getElementById("loginLink");
  const signupLink = document.getElementById("signupLink");
  const accountLink = document.getElementById("accountLink");
  const logoutButton = document.getElementById("logoutButton");
  if (!loginLink || !signupLink || !accountLink || !logoutButton) return;

  const user = await getVerifiedUser();
  if (!user) return;

  loginLink.hidden = true;
  signupLink.hidden = true;
  accountLink.hidden = false;
  logoutButton.hidden = false;

  logoutButton.addEventListener("click", async function () {
    await db.auth.signOut();
    window.location.href = "index.html";
  });
})();