/* =====================================================
   FILE: layout.js
   PURPOSE: Render the shared sidebar navigation and site footer.
   ===================================================== */

// The sidebar and footer live here, so they are edited in one place.
const NAV_HTML = `
  <h2>Contents</h2>
  <ul>
    <li><a href="/index.html">Home</a></li>
    <li><a href="/pages/problems/problems.html">Problems</a></li>
    <li><a href="/pages/contests/contests.html">Contests</a></li>
    <li><a href="/pages/info/theme.html">Themes</a></li>
    <li><a href="/pages/info/about.html">About</a></li>
  </ul>
  <div class="sidebar-actions">
    <a href="/pages/community/account.html" class="btn btn-primary" id="accountLink" hidden>Account</a>
    <button type="button" class="btn" id="logoutButton" hidden>Log out</button>
    <a href="/pages/auth/login.html" class="btn" id="loginLink">Login</a>
    <a href="/pages/auth/signup.html" class="btn btn-primary" id="signupLink">Signup</a>
  </div>
`;

const FOOTER_HTML = `
  <span>&copy; 2026 MathWorld</span>
  <a href="/index.html">Home</a>
  <a href="/pages/problems/problems.html">Problems</a>
  <a href="/pages/info/about.html">About</a>
`;

const sidebarElement = document.getElementById("sidebar");
if (sidebarElement) {
  sidebarElement.innerHTML = NAV_HTML;
}

const footerElement = document.getElementById("siteFooter");
if (footerElement) {
  footerElement.innerHTML = FOOTER_HTML;
}