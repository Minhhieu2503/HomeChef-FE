import api from "./api";

export const getShoppingList = async () => {
  const response = await api.get("/shopping");
  return response.data;
};

export const addShoppingItem = async (data) => {
  const response = await api.post("/shopping", data);
  return response.data;
};

export const updateShoppingItem = async (id, data) => {
  const response = await api.put(`/shopping/${id}`, data);
  return response.data;
};

export const deleteShoppingItem = async (id) => {
  await api.delete(`/shopping/${id}`);
};

export const clearCheckedItems = async () => {
  await api.delete("/shopping/checked");
};
