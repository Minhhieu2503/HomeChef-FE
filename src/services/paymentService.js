import api from "./api";

export const paymentService = {
  createPaymentUrl: (data) => api.post("/payment/create-payment", data),
  vnpayReturn: (queryParams) => api.get(`/payment/vnpay-return${queryParams}`),
};
