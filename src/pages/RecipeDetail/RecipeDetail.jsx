import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getRecipeById, consumeRecipe } from "../../services/recipeService";
import { useToast } from "../../context/ToastContext";
import CookingMode from "./CookingMode";
import "./RecipeDetail.css";

function RecipeDetail() {
  const toast = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location; 

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(1);
  const [handsFree, setHandsFree] = useState(false);
  
  const [isCooking, setIsCooking] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Check if this is an AI-generated recipe passed via state
      if (id === 'custom-ai-recipe' && state?.aiRecipe) {
        setRecipe(state.aiRecipe);
        setServings(state.aiRecipe.servings || 2);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getRecipeById(id);
        const actualRecipe = data.data || data;
        setRecipe(actualRecipe);
        setServings(actualRecipe.servings || 2);
      } catch (err) {
        console.error("Failed to load recipe", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, state]);

  const handleCookingComplete = () => {
    setShowCompleteModal(true);
  };

  const confirmFinalSave = async () => {
    setIsSubmitting(true);
    try {
      if (id === 'custom-ai-recipe') {
        // AI recipes don't exist in DB, so we skip the backend consume call
        setIsCooking(false);
        setShowCompleteModal(false);
        toast.success("Nấu thành công! (Món AI chưa tự động trừ nguyên liệu)");
        navigate('/pantry');
      } else {
        await consumeRecipe(id, servings);
        setIsCooking(false);
        setShowCompleteModal(false);
        toast.success("Khám phá thành công! Đã cập nhật kho của bạn.");
        navigate('/pantry'); 
      }
    } catch (err) {
      console.error("Failed to consume:", err);
      toast.error("Lỗi cập nhật kho tự động."); 
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{padding: "3rem", textAlign: "center"}}>Đang tải chi tiết...</div>;
  }

  if (!recipe) {
    return <div style={{padding: "3rem", textAlign: "center"}}>Không tìm thấy món ăn.</div>;
  }

  return (
    <div className="recipe-detail mobile-premium">
      {/* Edge-to-edge Hero Image with Floating Back Button */}
      <div className="hero-wrapper">
        <button className="float-back-btn" onClick={() => navigate(-1)}>←</button>
        <img src={recipe.image} alt={recipe.title} className="hero-img-full" />
        <div className="hero-shadow-overlay"></div>
      </div>

      {/* Sticky Content Layer shifted up slightly over the image */}
      <div className="content-sheet">
        <div className="title-row">
          <h1>{recipe.title}</h1>
          <p className="text-muted">{recipe.description || "Mô tả món ngon đặc biệt từ HomeChef"}</p>
        </div>

        {/* modernist Stats Widget Grid */}
        <div className="modern-stats-bar">
          <div className="stat-card">
            <Clock size={20} className="text-primary" />
            <div className="stat-info">
              <span className="s-val">{recipe.cookTime || 20}m</span>
              <span className="s-lbl">Thời gian</span>
            </div>
          </div>
          <div className="stat-card">
            <Star size={20} className="text-yellow-500" />
            <div className="stat-info">
              <span className="s-val">{recipe.difficulty || "Vừa"}</span>
              <span className="s-lbl">Độ khó</span>
            </div>
          </div>
          <div className="stat-card">
            <Flame size={20} className="text-orange-500" />
            <div className="stat-info">
              <span className="s-val">{recipe.calories || 0}</span>
              <span className="s-lbl">Kcal</span>
            </div>
          </div>
        </div>

        {/* Nutrition Info Tiny Pills */}
        {recipe.nutrition && (
          <div className="nutrition-pills">
            <span className="pill">Protein: <b>{recipe.nutrition.protein || "N/A"}</b></span>
            <span className="pill">Carb: <b>{recipe.nutrition.carbs || "N/A"}</b></span>
            <span className="pill">Fat: <b>{recipe.nutrition.fat || "N/A"}</b></span>
          </div>
        )}

        <hr className="divider" />

        {/* WIDGET: Hands-free Cooking Mode */}
        <div className="hands-free-card">
          <div className="hf-content">
            <div className="hf-icon">🗣️</div>
            <div className="hf-text">
              <h4>Hands-free Cooking</h4>
              <p>Điều khiển bằng giọng nói (Beta)</p>
            </div>
          </div>
          <label className="hf-switch">
            <input type="checkbox" checked={handsFree} onChange={() => setHandsFree(!handsFree)} />
            <span className="hf-slider"></span>
          </label>
        </div>

        {/* Ingredients Section */}
        <div className="recipe-section">
          <div className="section-h">
            <h3>Nguyên liệu cần chuẩn bị ({recipe.ingredients?.length})</h3>
          </div>
          <div className="ingredients-grid-v3">
            {(recipe.ingredients || []).map((ing, i) => (
              <div className="ing-item-v3" key={i}>
                <label className="ing-checkbox">
                  <input type="checkbox" />
                  <span className="ing-check-mark"></span>
                  <div className="ing-details">
                    <span className="ing-name-text">{ing.name}</span>
                    <span className="ing-qty-text">{ing.quantity || ing.qty} {ing.unit}</span>
                  </div>
                </label>
              </div>
            ))}
          </div>
          <button className="btn btn-outline-secondary w-full" style={{marginTop: '1rem'}}>
            🛒 Thêm nguyên liệu thiếu vào giỏ
          </button>
        </div>

        {/* Preparation Steps */}
        <div className="recipe-section" style={{marginBottom: '6rem'}}>
          <div className="section-h">
            <h3>Cách thực hiện</h3>
          </div>
          <div className={`numbered-steps ${handsFree ? 'zoom-mode' : ''}`}>
            {(recipe.steps || []).map((s, index) => (
              <div className="step-blob" key={index}>
                <div className="step-main">
                  <div className="step-num">{s.order || index + 1}</div>
                  <p className="step-txt">{s.instruction || s.text || s}</p>
                </div>
                
                {s.image && (
                  <div className="step-illustration">
                    <img src={s.image} alt={`Minh họa bước ${s.order || index + 1}`} className="step-img" />
                  </div>
                )}
                
                {s.video && (
                  <div className="step-illustration">
                    {s.video.includes('youtube.com') || s.video.includes('youtu.be') ? (
                      <iframe 
                        className="step-video-iframe"
                        src={s.video.replace('watch?v=', 'embed/').split('&')[0]} 
                        title={`Video minh họa bước ${s.order || index + 1}`}
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <video controls className="step-video">
                        <source src={s.video} type="video/mp4" />
                        Trình duyệt của bạn không hỗ trợ xem video.
                      </video>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FIXED BOTTOM BAR */}
      {!isCooking && (
        <div className="fixed-footer-actions">
          <div className="servings-control">
            <button onClick={() => setServings(Math.max(1, servings-1))}>−</button>
            <span className="serving-value">{servings} p</span>
            <button onClick={() => setServings(servings+1)}>+</button>
          </div>
          <button className="btn-primary-v3" onClick={() => setIsCooking(true)}>
            Start Cooking
          </button>
        </div>
      )}

      {/* OVERLAY: Cooking Step by Step */}
      {isCooking && (
        <CookingMode 
          recipe={recipe} 
          onClose={() => setIsCooking(false)} 
          onComplete={handleCookingComplete} 
        />
      )}

      {/* CUSTOM CONFIRM MODAL */}
      {showCompleteModal && (
        <div className="custom-modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }}>
          <div className="custom-modal-card" style={{
            backgroundColor: '#fff', borderRadius: '20px', width: '100%', maxWidth: '400px',
            padding: '2rem', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🎉</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem', color: '#1e293b' }}>
              Chúc mừng hoàn thành!
            </h3>
            
            {/* Live Calorie Counter Widget */}
            <div style={{
              width: '100px', height: '100px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(239, 68, 68, 0.1))',
              border: '3px solid #f97316', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
              boxShadow: '0 8px 20px rgba(249, 115, 22, 0.15)'
            }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ea580c' }}>
                {(parseInt(recipe.calories) || 0) * servings}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f97316', textTransform: 'uppercase' }}>
                Kcal
              </span>
            </div>

            <p style={{ color: '#64748b', lineHeight: 1.5, marginBottom: '1.75rem', fontSize: '0.9rem', padding: '0 0.5rem' }}>
              Bạn vừa nấu {servings} suất. Hệ thống sẽ tự động trừ nguyên liệu kho và cập nhật lượng calo hấp thụ vào nhật ký nhé!
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                onClick={confirmFinalSave} 
                disabled={isSubmitting}
                style={{
                  background: 'linear-gradient(135deg, #f97316, #ef4444)', color: 'white',
                  border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: 800,
                  fontSize: '1rem', cursor: 'pointer', transition: 'opacity 0.2s'
                }}
              >
                {isSubmitting ? "Đang cập nhật..." : "Đồng ý hoàn thành"}
              </button>
              <button 
                onClick={() => setShowCompleteModal(false)} 
                disabled={isSubmitting}
                style={{
                  background: '#f1f5f9', color: '#64748b',
                  border: 'none', padding: '0.8rem', borderRadius: '12px', fontWeight: 600,
                  fontSize: '0.9rem', cursor: 'pointer'
                }}
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecipeDetail;
