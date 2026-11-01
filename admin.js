
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const { data: { user }, error: authError } = await db.auth.getUser();

    if (authError || !user) {
      window.location.replace("index.html");
      return;
    }

    const { data: profile, error } = await db
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || !profile || !["host", "admin"].includes(profile.role)) {
      window.location.replace("index.html");
    }
  } catch (error) {
    console.error("Admin access error:", error);
    window.location.replace("index.html");
  }
});
