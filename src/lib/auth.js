export const ROLE_APOTEKER = "apoteker";
export const ROLE_ADMIN = "admin";

// Demo accounts for local development / demo mode
export const DEMO_ACCOUNTS = {
  [ROLE_APOTEKER]: { username: "apoteker", password: "apoteker" },
  [ROLE_ADMIN]: { username: "admin", password: "admin" },
};

export function validateCredentials(username, password, role) {
  if (!username || !password || !role) return false;
  const acct = DEMO_ACCOUNTS[role];
  if (!acct) return false;
  return username === acct.username && password === acct.password;
}

export function getAuthState() {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, role: null, username: null };
  }

  const authToken = localStorage.getItem("authToken");
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");
  let profile = null;
  try {
    const raw = localStorage.getItem("authProfile");
    profile = raw ? JSON.parse(raw) : null;
  } catch {
    profile = null;
  }

  return {
    isAuthenticated: Boolean(authToken),
    role,
    username,
    profile,
  };
}

export function getHomePathForRole(role) {
  return role === ROLE_ADMIN ? "/admin" : "/";
}

export function clearAuthState() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("username");
  localStorage.removeItem("loginTime");
  localStorage.removeItem("rememberMe");
  localStorage.removeItem("role");
  localStorage.removeItem("authProfile");
}

export function getAuthProfile() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("authProfile");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuthProfile(profile) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("authProfile", JSON.stringify(profile || {}));
  } catch {
    // ignore
  }
}
