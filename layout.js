// The sidebar and footer live here, so they are edited in one place.
const NAV_HTML = `
  <h2>Contents</h2>
  <ul>
    <li><a href="index.html">Home</a></li>
    <li><a href="problems.html">Problems</a></li>
    <li><a href="solutions.html">Solutions</a></li>
    <li><a href="contests.html">Contests</a></li>
    <li><a href="theme.html">Themes</a></li>
    <li><a href="about.html">About</a></li>
  </ul>
  <div class="sidebar-actions">
    <a href="account.html" class="btn btn-primary" id="accountLink" hidden>Account</a>
    <button type="button" class="btn" id="logoutButton" hidden>Log out</button>
    <a href="login.html" class="btn" id="loginLink">Login</a>
    <a href="signup.html" class="btn btn-primary" id="signupLink">Signup</a>
  </div>
`;

const FOOTER_HTML = `
  <span>&copy; 2026 MathWorld</span>
  <a href="index.html">Home</a>
  <a href="problems.html">Problems</a>
  <a href="about.html">About</a>
`;

const sidebarElement = document.getElementById("sidebar");
if (sidebarElement) {
  sidebarElement.innerHTML = NAV_HTML;
}

const footerElement = document.getElementById("siteFooter");
if (footerElement) {
  footerElement.innerHTML = FOOTER_HTML;
}