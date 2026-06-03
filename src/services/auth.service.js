import api from "./api";

export const authService = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile", data),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  googleLogin: (idToken) => api.post("/auth/google", { idToken }),
  uploadAvatar: (formData) => api.put("/auth/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }),
  toggleSavedRecipe: (recipeId) => api.post("/auth/saved-recipes", { recipeId }),
  getSavedRecipes: () => api.get("/auth/saved-recipes"),
  upgradeToPremium: () => api.post("/auth/upgrade"),
};
