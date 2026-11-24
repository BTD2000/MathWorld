/* =====================================================
   FILE: auth.js
   PURPOSE: Handle user sign-up, login, and password recovery.
   ===================================================== */

const mode = document.body.dataset.mode; // "login" or "signup"
const authForm = document.getElementById("authForm");
const message = document.getElementById("message");
const forgotPasswordButton = document.getElementById("forgotPasswordButton");

function showMessage(text, isError) {
  message.textContent = text;
  message.classList.toggle("error", Boolean(isError));
}

// ---------- Forgot password ----------
if (forgotPasswordButton) {
  forgotPasswordButton.addEventListener("click", async function () {
    showMessage("", false);
    const email = document.getElementById("email").value.trim();

    if (!email) {
      showMessage("Enter your email address first.", true);
      document.getElementById("email").focus();
      return;
    }

    forgotPasswordButton.disabled = true;
    try {
      const redirectTo = "update-password.html";
      const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        showMessage(error.message, true);
      } else {
        showMessage("If an account exists for this email, a password-reset link will be sent. Check your inbox.", false);
      }
    } catch (error) {
      console.error(error);
      showMessage("Could not send the reset email. Please try again.", true);
    } finally {
      forgotPasswordButton.disabled = false;
    }
  });
}

// Show errors from failed or expired email links.
(function () {
  const fromHash = window.location.hash.replace(/^#/, "");
  const fromQuery = window.location.search.replace(/^\?/, "");
  const params = new URLSearchParams(fromHash || fromQuery);
  const description = params.get("error_description");
  if (description) {
    showMessage(description + " Please sign up again to get a new confirmation link.", true);
  }
})();

// Already logged in? Go to the home page.
(async function () {
  const user = await getVerifiedUser();
  if (user) window.location.replace("index.html");
})();

async function handleSignup(email, password) {
  const username = document.getElementById("username").value.trim();
  const confirmation = document.getElementById("confirmPassword").value;

  if (password !== confirmation) {
    showMessage("The two passwords do not match.", true);
    return;
  }

  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: "login.html"
    }
  });

  if (error) {
    showMessage(error.message.includes("Database error")
      ? "Could not create the account. That username may already be taken."
      : error.message, true);
    return;
  }

  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    showMessage("This email is already registered. Try logging in instead.", true);
    return;
  }
  if (data.session) {
    window.location.href = "index.html";
    return;
  }

  authForm.reset();
  showMessage("Account created. Check your email and click the confirmation link, then log in.", false);
}


async function handleLogin(identifier, password) {
  // If the user entered an email, use normal login.
  if (identifier.includes("@")) {
    const { error } = await db.auth.signInWithPassword({
      email: identifier,
      password
    });

    if (error) {
      showMessage(
        error.message.toLowerCase().includes("email not confirmed")
          ? "Please confirm your email first. Check your inbox."
          : error.message,
        true
      );
      return;
    }

    window.location.href = "index.html";
    return;
  }

  // Otherwise, use the username-to-email Edge Function.
  const { data, error } = await db.functions.invoke(
    "username-to-email",
    {
      body: {
        username: identifier,
        password
      }
    }
  );

  if (error || !data?.session) {
    showMessage("Invalid username or password.", true);
    return;
  }

  // Save the returned session in the browser's Supabase client.
  const { error: sessionError } = await db.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  });

  if (sessionError) {
    showMessage("Could not complete login. Please try again.", true);
    return;
  }

  window.location.href = "index.html";
}

authForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  showMessage("", false);
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const submitButton = authForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  try {
    if (mode === "signup") await handleSignup(email, password);
    else await handleLogin(email, password);
  } finally {
    submitButton.disabled = false;
  }
});
