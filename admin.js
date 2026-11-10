/* =====================================================
   FILE: admin.js
   PURPOSE: Manage the MathWorld administration dashboard.
   ===================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Verify the current user
    const user = await getVerifiedUser();

    // Allow only admins and hosts
    if (!user || !["admin", "host"].includes(user.role)) {
      window.location.replace("index.html");
      return;
    }

  } catch (error) {
    console.error("Admin access error:", error);
    window.location.replace("index.html");
  }
});