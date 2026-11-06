/* =====================================================
   FILE: suggestions.js
   PURPOSE: Review and manage submitted problem suggestions.
   ===================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const suggestionsList = document.getElementById("suggestions-list");

  function createTextElement(tag, text, className = "") {
    const element = document.createElement(tag);
    element.textContent = text ?? "";
    if (className) element.className = className;
    return element;
  }

  try {
    const { data: { user }, error: authError } = await db.auth.getUser();

    if (authError || !user) {
      window.location.replace(mwUrl("index.html"));
      return;
    }

    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    if (!["host", "admin"].includes(profile.role)) {
      window.location.replace(mwUrl("index.html"));
      return;
    }

    await loadSuggestions();

  } catch (error) {
    console.error("Suggestions page error:", error);
    suggestionsList.textContent = "Could not load suggestions.";
  }

  async function loadSuggestions() {
    const { data: suggestions, error } = await db
      .from("problem_suggestions")
      .select(`
        id,
        title,
        statement,
        difficulty,
        topic,
        source,
        proposer,
        tags,
        proposer_note,
        see_also,
        created_at
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) throw error;

    suggestionsList.replaceChildren();

    if (!suggestions || suggestions.length === 0) {
      suggestionsList.textContent = "No pending suggestions.";
      return;
    }

    suggestions.forEach(suggestion => {
      const card = document.createElement("div");
      card.className = "card suggestion-card";

      card.append(
        createTextElement("h3", suggestion.title),
        createTextElement("p", suggestion.statement),
        createTextElement("p", `Topic: ${suggestion.topic || "Not specified"}`),
        createTextElement("p", `Difficulty: ${suggestion.difficulty ?? "Not specified"}`),
        createTextElement("p", `Source: ${suggestion.source || "Not specified"}`),
        createTextElement("p", `Proposer: ${suggestion.proposer || "Not specified"}`),
        createTextElement("p", `Tags: ${(suggestion.tags || []).join(", ") || "None"}`),
        createTextElement("p", `Additional note: ${suggestion.proposer_note || "None"}`),
        createTextElement("p", `See also: ${(suggestion.see_also || []).join(", ") || "None"}`),
        createTextElement(
          "small",
          `Submitted: ${new Date(suggestion.created_at).toLocaleString()}`
        )
      );

      const reviewNote = document.createElement("textarea");
      reviewNote.placeholder = "Optional review note...";
      reviewNote.rows = 2;

      const actions = document.createElement("div");
      actions.className = "suggestion-actions";

      const approveButton = document.createElement("button");
      approveButton.type = "button";
      approveButton.textContent = "Approve";

      const rejectButton = document.createElement("button");
      rejectButton.type = "button";
      rejectButton.textContent = "Reject";

      const message = document.createElement("p");

      async function reviewSuggestion(decision) {
        approveButton.disabled = true;
        rejectButton.disabled = true;
        message.textContent = "Processing...";

        try {
          const { error } = await db.rpc("review_problem_suggestion", {
            suggestion_id: suggestion.id,
            decision: decision,
            reviewer_note: reviewNote.value.trim() || null
          });

          if (error) throw error;

          card.remove();

          if (!suggestionsList.children.length) {
            suggestionsList.textContent = "No pending suggestions.";
          }

        } catch (error) {
          console.error("Suggestion review error:", error);
          message.textContent = error.message || "Could not review suggestion.";

          approveButton.disabled = false;
          rejectButton.disabled = false;
        }
      }

      approveButton.addEventListener("click", () => {
        reviewSuggestion("approved");
      });

      rejectButton.addEventListener("click", () => {
        reviewSuggestion("rejected");
      });

      actions.append(approveButton, rejectButton);
      card.append(reviewNote, actions, message);

      suggestionsList.appendChild(card);
    });
  }
});
