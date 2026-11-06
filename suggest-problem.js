/* =====================================================
   FILE: suggest-problem.js
   PURPOSE: Handle community problem suggestions.
   ===================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("suggestionForm");
  const submitButton = document.getElementById("submitSuggestion");
  const message = document.getElementById("suggestionMessage");

  if (!form || !submitButton || !message) return;

  let currentUser = null;

  // Check authentication
  try {
    const { data: userData, error: userError } =
      await db.auth.getUser();

    if (userError || !userData.user) {
      message.textContent = "Please log in to suggest a problem.";
      submitButton.disabled = true;
      return;
    }

    currentUser = userData.user;

    // Check user role
    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("role, username")
      .eq("id", currentUser.id)
      .single();

    if (profileError) throw profileError;

    if (!["member", "moderator"].includes(profile.role)) {
      message.textContent =
        "Your role does not have permission to suggest problems.";

      submitButton.disabled = true;
      return;
    }

    // Fill proposer automatically with username
    const proposerInput = document.getElementById("proposer");

    if (proposerInput && profile.username) {
      proposerInput.value = profile.username;
    }

  } catch (error) {
    console.error("Suggestion page error:", error);

    message.textContent =
      "Could not verify your account. Please try again.";

    submitButton.disabled = true;
    return;
  }

  // Convert comma-separated text into an array
  function parseList(value) {
    return value
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);
  }

  // Submit suggestion
  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentUser) return;

    submitButton.disabled = true;
    message.textContent = "Submitting suggestion...";

    try {
      const title = document.getElementById("title").value.trim();
      const statement = document.getElementById("statement").value.trim();
      const topic = document.getElementById("topic").value;

      const difficultyValue =
        document.getElementById("difficulty").value;

      const source =
        document.getElementById("source").value.trim();

      const tags = parseList(
        document.getElementById("tags").value
      );

      const proposer =
        document.getElementById("proposer").value.trim();

      const proposerNote =
        document.getElementById("proposerNote").value.trim();

      const seeAlso = parseList(
        document.getElementById("seeAlso").value
      );

      if (!title || !statement || !topic) {
        throw new Error("Please complete all required fields.");
      }

      const suggestion = {
        title,
        statement,
        topic,
        difficulty: difficultyValue
          ? Number(difficultyValue)
          : null,
        source: source || null,
        tags,
        proposer: proposer || null,
        proposer_note: proposerNote || null,
        see_also: seeAlso,
        suggested_by: currentUser.id
      };

      const { error } = await db
        .from("problem_suggestions")
        .insert(suggestion);

      if (error) throw error;

      message.textContent =
        "Your suggestion has been submitted successfully! It is now pending review.";

      form.reset();

    } catch (error) {
      console.error("Suggestion submission error:", error);

      message.textContent =
        error.message || "Failed to submit suggestion.";

    } finally {
      submitButton.disabled = false;
    }
  });
});