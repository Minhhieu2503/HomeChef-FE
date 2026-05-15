import React from 'react';
import { Check, Sparkles, Zap, Shield, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { paymentService } from '../../services/paymentService';
import './Pricing.css';

const Pricing = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const plans = [
    {
      id: 'free',
      name: 'Gói Miễn Phí',
      price: '0đ',
      amount: 0,
      period: 'mãi mãi',
      description: 'Dành cho người mới bắt đầu khám phá thế giới ẩm thực.',
      features: [
        'Truy cập 500+ công thức cơ bản',
        '3 lượt quét tủ lạnh bằng AI',
        'Lên kế hoạch bữa ăn cơ bản',
        'Lưu tối đa 10 công thức yêu thích'
      ],
      buttonText: 'Đang sử dụng',
      isPopular: false,
      isPremium: false
    },
    {
      id: 'premium',
      name: 'Gói Premium',
      price: '49.000đ',
      amount: 49000,
      period: '/tháng',
      description: 'Mở khóa toàn bộ sức mạnh của AI và kho công thức khổng lồ.',
      features: [
        'Mọi tính năng của gói Miễn Phí',
        'Quét tủ lạnh & Hóa đơn không giới hạn',
        'Gợi ý thực đơn AI cá nhân hóa',
        'Không quảng cáo',
        'Hỗ trợ chế độ nấu ăn rảnh tay'
      ],
      buttonText: 'Nâng cấp ngay',
      isPopular: true,
      isPremium: true
    },
    {
      id: 'family',
      name: 'Gói Family',
      price: '99.000đ',
      amount: 99000,
      period: '/tháng',
      description: 'Giải pháp hoàn hảo cho cả gia đình cùng chăm sóc sức khỏe.',
      features: [
        'Mọi tính năng của gói Premium',
        'Kết nối tối đa 5 thành viên',
        'Chia sẻ giỏ hàng & thực đơn gia đình',
        'Báo cáo dinh dưỡng hàng tuần',
        'Ưu tiên hỗ trợ 24/7'
      ],
      buttonText: 'Chọn gói Family',
      isPopular: false,
      isPremium: true
    }
  ];

  const handleSelectPlan = async (plan) => {
    console.log("Selecting plan:", plan);
    if (!plan.isPremium) {
      toast.info('Bạn đang sử dụng gói này.');
      return;
    }
    
    toast.loading('Đang khởi tạo thanh toán VNPay...');
    console.log("Calling createPaymentUrl with:", { amount: plan.amount, planId: plan.id });
    try {
      const res = await paymentService.createPaymentUrl({
        amount: plan.amount,
        planId: plan.id
      });

      if (res.success && res.url) {
        toast.success('Đang chuyển hướng đến VNPay...');
        window.location.href = res.url;
      } else {
        toast.error('Không thể tạo liên kết thanh toán.');
      }
    } catch (err) {
      toast.error('Lỗi khi kết nối với máy chủ.');
      console.error(err);
    }
  };

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <Sparkles className="header-icon" />
        <h1>Nâng cấp trải nghiệm ẩm thực</h1>
        <p>Chọn gói phù hợp để mở khóa các tính năng cao cấp và bắt đầu hành trình sống khỏe cùng HomeChef.</p>
      </div>

      <div className="plans-container">
        {plans.map((plan) => (
          <div key={plan.id} className={`plan-card ${plan.isPopular ? 'popular' : ''}`}>
            {plan.isPopular && <div className="popular-badge">Phổ biến nhất</div>}
            
            <div className="plan-name">
              {plan.id === 'free' ? <Shield size={20} /> : plan.id === 'premium' ? <Zap size={20} /> : <Sparkles size={20} />}
              <span>{plan.name}</span>
            </div>

            <div className="plan-price">
              <span className="amount">{plan.price}</span>
              <span className="period">{plan.period}</span>
            </div>

            <p className="plan-description">{plan.description}</p>

            <ul className="plan-features">
              {plan.features.map((feature, idx) => (
                <li key={idx}>
                  <Check size={18} className="text-green-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              className={`plan-button ${plan.isPremium ? 'btn-premium' : 'btn-free'}`}
              onClick={() => handleSelectPlan(plan)}
            >
              {plan.buttonText}
              {plan.isPremium && <ChevronRight size={18} />}
            </button>
          </div>
        ))}
      </div>

      <div className="pricing-faq">
        <h3>Tại sao nên chọn HomeChef Premium?</h3>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>Tiết kiệm thời gian</h4>
            <p>AI giúp bạn quyết định món ăn chỉ trong vài giây dựa trên nguyên liệu sẵn có.</p>
          </div>
          <div className="faq-item">
            <h4>Sức khỏe vàng</h4>
            <p>Báo cáo dinh dưỡng chi tiết giúp bạn kiểm soát cân nặng và năng lượng nạp vào.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
