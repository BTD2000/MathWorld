/* =====================================================
   FILE: add-problem.js
   PURPOSE: Handle problem submission by authorized contributors.
   ===================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("problemForm");
  const message = document.getElementById("problemMessage");
  const submitButton = document.getElementById("submitProblem");

  const { data: { user }, error: authError } = await db.auth.getUser();

  if (authError || !user) {
    message.textContent = "Please log in to access this page.";
    form.hidden = true;
    return;
  }

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("role, username")
    .eq("id", user.id)
    .single();

  if (profileError || !profile ||
      !["admin", "host"].includes(profile.role)) {
    message.textContent = "You do not have permission to add problems.";
    form.hidden = true;
    return;
  }

  document.getElementById("proposer").value = profile.username || "";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    submitButton.disabled = true;
    message.textContent = "Adding problem...";

    const splitValues = (value) =>
      value.split(",").map(item => item.trim()).filter(Boolean);

    const problem = {
      title: document.getElementById("title").value.trim(),
      statement: document.getElementById("statement").value.trim(),
      topic: document.getElementById("topic").value,
      difficulty: document.getElementById("difficulty").value
        ? Number(document.getElementById("difficulty").value)
        : null,
      source: document.getElementById("source").value.trim() || null,
      proposer: document.getElementById("proposer").value.trim() || null,
      tags: splitValues(document.getElementById("tags").value),
      proposer_note: document.getElementById("proposerNote").value.trim() || null,
      see_also: splitValues(document.getElementById("seeAlso").value)
    };

    const { error } = await db
      .from("problems")
      .insert(problem);

    if (error) {
      console.error("Problem insertion error:", error);
      message.textContent = "Error: " + error.message;
    } else {
      message.textContent = "Problem added successfully!";
      form.reset();
      document.getElementById("proposer").value = profile.username || "";
    }

    submitButton.disabled = false;
  });
});
