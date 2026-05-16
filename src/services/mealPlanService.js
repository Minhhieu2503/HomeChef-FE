import api from "./api";

export const getMealPlans = async (startDate, endDate) => {
  const response = await api.get("/mealplan", {
    params: { start: startDate, end: endDate }
  });
  return response.data;
};

export const addMealToPlan = async (data) => {
  const response = await api.post("/mealplan", data);
  return response.data;
};

export const removeMealFromPlan = async (day, slot) => {
  const response = await api.delete(`/mealplan/${day}/${slot}`);
  return response.data;
};

// Aliases for compatibility
export const getMealPlan = getMealPlans;
export const scheduleMeal = addMealToPlan;
export const unscheduleMeal = removeMealFromPlan;
