/* =====================================================
   FILE: users.js
   PURPOSE: Load and manage the user administration list.
   ===================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const usersList = document.getElementById("users-list");

  let currentUser;
  let currentRole;

  function createTextElement(tag, text, className = "") {
    const element = document.createElement(tag);
    element.textContent = text ?? "";
    if (className) element.className = className;
    return element;
  }

  try {
    const { data: { user }, error: authError } = await db.auth.getUser();

    if (authError || !user) {
      window.location.replace("index.html");
      return;
    }

    currentUser = user;

    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (profileError) throw profileError;

    currentRole = profile.role;

    if (!["host", "admin"].includes(currentRole)) {
      window.location.replace("index.html");
      return;
    }

    await loadUsers();

  } catch (error) {
    console.error("Users page error:", error);
    usersList.textContent = "Could not load users.";
  }

  async function loadUsers() {
    const { data: users, error } = await db
      .from("profiles")
      .select("id, username, role")
      .order("username");

    if (error) throw error;

    usersList.replaceChildren();

    if (!users || users.length === 0) {
      usersList.textContent = "No users found.";
      return;
    }

    users.forEach(user => {
      const card = document.createElement("div");
      card.className = "card";

      const username = createTextElement(
        "h3",
        user.username || "No username"
      );

      const role = createTextElement(
        "p",
        `Current role: ${user.role}`
      );

      const roleSelect = document.createElement("select");

      const availableRoles = currentRole === "host"
        ? ["member", "moderator", "admin"]
        : ["member", "moderator"];

      availableRoles.forEach(roleName => {
        const option = document.createElement("option");
        option.value = roleName;
        option.textContent = roleName;
        option.selected = user.role === roleName;
        roleSelect.appendChild(option);
      });

      if (!availableRoles.includes(user.role)) {
        const option = document.createElement("option");
        option.value = user.role;
        option.textContent = user.role;
        option.selected = true;
        roleSelect.appendChild(option);
      }

      const saveButton = document.createElement("button");
      saveButton.type = "button";
      saveButton.textContent = "Save role";

      const message = document.createElement("p");

      if (user.id === currentUser.id) {
        roleSelect.disabled = true;
        saveButton.disabled = true;
        message.textContent = "You cannot change your own role.";
      } else if (user.role === "host") {
        roleSelect.disabled = true;
        saveButton.disabled = true;
        message.textContent = "The host role cannot be changed.";
      }

      saveButton.addEventListener("click", async () => {
        const newRole = roleSelect.value;

        if (newRole === user.role) {
          message.textContent = "No changes to save.";
          return;
        }

        saveButton.disabled = true;
        roleSelect.disabled = true;
        message.textContent = "Saving...";

        try {
          const { error } = await db.rpc("admin_set_user_role", {
            target_user_id: user.id,
            new_role: newRole
          });

          if (error) throw error;

          user.role = newRole;
          role.textContent = `Current role: ${newRole}`;
          message.textContent = "Role updated successfully.";

        } catch (error) {
          console.error("Role update error:", error);
          message.textContent = error.message || "Failed to update role.";
          roleSelect.value = user.role;

        } finally {
          if (user.id !== currentUser.id && user.role !== "host") {
            saveButton.disabled = false;
            roleSelect.disabled = false;
          }
        }
      });

      card.append(username, role, roleSelect, saveButton, message);
      usersList.appendChild(card);
    });
  }
});
