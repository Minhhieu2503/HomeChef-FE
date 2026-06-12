import api from "./api";

export const feedbackService = {
  submitFeedback: (data) => api.post("/feedback", data),
  getFeedbacks: (params) => api.get("/feedback/admin", { params }),
  updateFeedbackStatus: (id, status) => api.put(`/feedback/admin/${id}`, { status }),
};
