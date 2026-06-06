import api from "./api";

// In-memory cache to speed up navigation
const cache = {
  allRecipes: null,
  recommendedRecipes: null,
  recipeById: {}
};

export const getAllRecipes = async (params = {}) => {
  // If no params and cache exists, return cache instantly
  if (Object.keys(params).length === 0 && cache.allRecipes) {
    return cache.allRecipes;
  }
  
  const response = await api.get("/recipes", { params });
  
  // Cache the default list of all recipes
  if (Object.keys(params).length === 0) {
    cache.allRecipes = response.data;
  }
  
  return response.data;
};

export const getRecommendedRecipes = async (bypassCache = false) => {
  if (cache.recommendedRecipes && !bypassCache) {
    return cache.recommendedRecipes;
  }
  
  const response = await api.get("/recipes/recommended");
  if (!bypassCache) {
    cache.recommendedRecipes = response.data;
  }
  
  return response.data;
};

export const getRecipeById = async (id) => {
  if (cache.recipeById[id]) {
    return cache.recipeById[id];
  }

  const response = await api.get(`/recipes/${id}`);
  cache.recipeById[id] = response.data;
  
  return response.data;
};

export const consumeRecipe = async (id, servings = 1) => {
  const response = await api.post(`/recipes/${id}/consume`, { servings });
  return response; // contains { success: true, report: [...] }
};

export const generateAIRecommendations = async (userIngredients) => {
  const response = await api.post("/recipes/generate-ai", { userIngredients });
  return response.data;
};
