import api from "./api";

export const getAllRecipes = async (params = {}) => {
  const response = await api.get("/recipes", { params });
  // Response interceptor yields { success: true, data: { recipes: [...] } }
  return response.data;
};

export const getRecommendedRecipes = async () => {
  const response = await api.get("/recipes/recommended");
  return response.data;
};

export const getRecipeById = async (id) => {
  const response = await api.get(`/recipes/${id}`);
  return response.data;
};

export const consumeRecipe = async (id, servings = 1) => {
  const response = await api.post(`/recipes/${id}/consume`, { servings });
  return response; // contains { success: true, report: [...] }
};
