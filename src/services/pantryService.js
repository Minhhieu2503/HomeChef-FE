import api from "./api";

export const getPantryItems = async (category = "All") => {
  const url = category && category !== "All" ? `/pantry?category=${category}` : "/pantry";
  const response = await api.get(url);
  return response.data;
};

export const addPantryItem = async (data) => {
  const response = await api.post("/pantry", data);
  return response.data;
};

export const updatePantryItem = async (id, data) => {
  const response = await api.put(`/pantry/${id}`, data);
  return response.data;
};

export const deletePantryItem = async (id) => {
  await api.delete(`/pantry/${id}`);
};

export const scanIngredientImage = async (imageFile, type = "fridge") => {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("type", type);
  
  // Explicitly set multipart/form-data content-type to override instance defaults
  const response = await api.post("/vision/scan", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  
  // The interceptor already unwraps response.data, so we just return response
  return response;
};
