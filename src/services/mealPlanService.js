import api from "./api";

export const getMealPlan = async (startDate, endDate) => {
  const response = await api.get("/mealplan", {
    params: { start: startDate, end: endDate }
  });
  return response.data;
};

export const scheduleMeal = async (date, slot, recipeId) => {
  const response = await api.post("/mealplan", { date, slot, recipeId });
  return response.data;
};

export const unscheduleMeal = async (id) => {
  await api.delete(`/mealplan/${id}`);
};
