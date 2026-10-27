const updatePasswordForm = document.getElementById("updatePasswordForm");
const updatePasswordMessage = document.getElementById("updatePasswordMessage");

function showUpdatePasswordMessage(text, isError = false) {
  updatePasswordMessage.textContent = text;
  updatePasswordMessage.classList.toggle("error", Boolean(isError));
}

async function initPasswordUpdate() {
  const { data, error } = await db.auth.getSession();
  if (error || !data.session) {
    updatePasswordForm.hidden = true;
    showUpdatePasswordMessage(
      "This password link is invalid or expired. Please request a new one from the login page.",
      true
    );
  }
}

updatePasswordForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  showUpdatePasswordMessage("");

  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmNewPassword").value;

  if (newPassword.length < 8) {
    showUpdatePasswordMessage("Your password must be at least 8 characters long.", true);
    return;
  }
  if (newPassword !== confirmPassword) {
    showUpdatePasswordMessage("The two passwords do not match.", true);
    return;
  }

  const button = updatePasswordForm.querySelector("button[type='submit']");
  button.disabled = true;
  try {
    const { error } = await db.auth.updateUser({ password: newPassword });
    if (error) {
      showUpdatePasswordMessage(error.message, true);
      return;
    }

    updatePasswordForm.reset();
    showUpdatePasswordMessage("Password updated successfully. You can now log in with your new password.");
    await db.auth.signOut();
    updatePasswordForm.hidden = true;
  } catch (error) {
    console.error(error);
    showUpdatePasswordMessage("Something went wrong. Please request a new link and try again.", true);
  } finally {
    button.disabled = false;
  }
});

initPasswordUpdate();
