const TOKEN_KEY = "token";
const USER_KEY = "user";

export const authUtils = {
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  setUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser: () => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Reset states to allow full flow re-testing easily on mobile
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("hasSeenOnboarding");
  },

  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  isAdmin: () => {
    const user = authUtils.getUser();
    return user && user.role === "admin";
  }
};
