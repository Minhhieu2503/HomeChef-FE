import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Home, CreditCard } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { useToast } from '../../context/ToastContext';
import './PaymentResult.css';

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Send all query params to backend for verification
        const res = await paymentService.payosReturn(location.search);
        setResult(res);
      } catch (err) {
        console.error("Payment verification error:", err);
        setResult({ success: false, message: "Lỗi hệ thống khi xác thực thanh toán." });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [location.search]);

  if (loading) {
    return (
      <div className="payment-result-page">
        <div className="result-card loading">
          <Loader2 className="animate-spin" size={64} />
          <h2>Đang xác thực giao dịch...</h2>
          <p>Vui lòng không tắt trình duyệt trong lúc này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-page">
      <div className={`result-card ${result?.success ? 'success' : 'failed'}`}>
        {result?.success ? (
          <>
            <div className="result-icon">
              <CheckCircle size={80} />
            </div>
            <h1>Thanh toán thành công!</h1>
            <p>{result.message || "Chúc mừng bạn đã nâng cấp lên tài khoản Premium thành công. Giờ đây bạn có thể sử dụng toàn bộ tính năng cao cấp của HomeChef."}</p>
            <div className="result-actions">
              <button className="btn-home" onClick={() => navigate('/')}>
                <Home size={18} /> Về Trang Chủ
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="result-icon">
              <XCircle size={80} />
            </div>
            <h1>Thanh toán thất bại</h1>
            <p>{result?.message || "Có lỗi xảy ra trong quá trình thanh toán hoặc giao dịch đã bị hủy."}</p>
            <div className="result-actions">
              <button className="btn-retry" onClick={() => navigate('/pricing')}>
                <CreditCard size={18} /> Thử lại
              </button>
              <button className="btn-home-outline" onClick={() => navigate('/')}>
                Về Trang Chủ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResult;
