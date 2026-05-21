import api from "./api";

export const paymentService = {
  createPaymentUrl: (data) => api.post("/payment/create-payment", data),
  payosReturn: (queryParams) => api.get(`/payment/payos-return${queryParams}`),
};
