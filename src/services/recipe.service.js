import api from "./api";

export const recipeService = {
  getAll: (params) => api.get("/recipes", { params }),
  getById: (id) => api.get(`/recipes/${id}`),
  create: (data) => api.post("/recipes", data),
  update: (id, data) => api.put(`/recipes/${id}`, data),
  remove: (id) => api.delete(`/recipes/${id}`),
};
