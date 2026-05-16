import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { getPantryItems, addPantryItem, updatePantryItem, deletePantryItem, scanIngredientImage } from "../../services/pantryService";
import { getAllRecipes } from "../../services/recipeService";
import { authService } from "../../services/auth.service";
import { useToast } from "../../context/ToastContext";
import { Thermometer, Zap, AlertTriangle, ChevronRight, Plus, X, Package, Edit2, Trash2, Camera, Upload, Loader, ChefHat, Clock, Flame, CheckCircle2, Circle, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import "./Pantry.css";

function Pantry() {
  const toast = useToast();
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState([]);
  const [rescueRecipes, setRescueRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ name: "", quantity: "", unit: "g", category: "Other", emoji: "📦", expiryDate: "" });
  const [user, setUser] = useState(null);

  // --- Scan Feature States ---
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanImage, setScanImage] = useState(null);
  const [scanPreview, setScanPreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [selectedIngredients, setSelectedIngredients] = useState({});
  const [expandedRecipe, setExpandedRecipe] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // --- Scan Handlers ---
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh quá lớn! Tối đa 5MB.");
      return;
    }
    setScanImage(file);
    setScanPreview(URL.createObjectURL(file));
    setScanResult(null);
  };

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const handleAnalyze = async () => {
    if (!scanImage) return;
    setIsScanning(true);
    try {
      const result = await scanIngredientImage(scanImage);
      // result is { success: true, message: "...", data: [savedItems], type: "..." }

      toast.success(result.message || "Đã quét và thêm vào tủ lạnh thành công!");
      setScanResult(result);

      // Refresh the user/pantry list
      fetchData();
    } catch (err) {
      console.error("Scan error:", err);
      if (err.response?.status === 403) {
        setIsUpgradeModalOpen(true);
        toast.error("Bạn đã hết lượt dùng thử tính năng cao cấp!");
      } else {
        toast.error(err.response?.data?.message || "Không thể phân tích ảnh. Vui lòng thử lại!");
      }
    } finally {
      setIsScanning(false);
    }
  };

  const toggleIngredient = (idx) => {
    setSelectedIngredients(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleBulkAdd = async () => {
    if (!scanResult?.ingredients) return;
    const toAdd = scanResult.ingredients.filter((_, i) => selectedIngredients[i]);
    if (toAdd.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 nguyên liệu!");
      return;
    }
    let added = 0;
    for (const ing of toAdd) {
      try {
        await addPantryItem({
          name: ing.name,
          quantity: parseInt(ing.quantity) || 1,
          unit: "g",
          category: "Other",
          emoji: ing.emoji || "📦"
        });
        added++;
      } catch (e) { console.error("Add error:", e); }
    }
    toast.success(`Đã thêm ${added} nguyên liệu vào tủ lạnh! 🎉`);
    closeScanModal();
    fetchData();
  };

  const closeScanModal = () => {
    setIsScanModalOpen(false);
    setScanImage(null);
    setScanPreview(null);
    setScanResult(null);
    setSelectedIngredients({});
    setExpandedRecipe(null);
    setIsScanning(false);
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch both simultaneously
      const [pantryRes, recipesRes] = await Promise.all([
        getPantryItems("All"),
        getAllRecipes()
      ]);

      const items = Array.isArray(pantryRes.data || pantryRes) ? (pantryRes.data || pantryRes) : [];
      setIngredients(items);

      const allRecipes = recipesRes?.recipes || (Array.isArray(recipesRes) ? recipesRes : []);

      // 3. Smart Matching Logic
      if (items.length > 0 && allRecipes.length > 0) {
        const pantryNames = items.map(i => i.name.toLowerCase().trim());

        const scoredRecipes = allRecipes.map(recipe => {
          // Flatten recipe ingredients for easy matching
          const recipeIngredients = recipe.ingredients.map(ri => ri.name.toLowerCase());

          // Find which pantry items are in this recipe (more flexible matching)
          const matches = pantryNames.filter(pn =>
            recipeIngredients.some(ri => ri.includes(pn) || pn.includes(ri))
          );

          return { ...recipe, matches, matchCount: matches.length };
        });

        // Sort by most matches first, then pick top 8
        const topMatches = scoredRecipes
          .filter(r => r.matchCount > 0)
          .sort((a, b) => b.matchCount - a.matchCount)
          .slice(0, 8);

        setRescueRecipes(topMatches.length > 0 ? topMatches : allRecipes.slice(0, 8));
      } else {
        setRescueRecipes(allRecipes.slice(0, 8));
      }
    } catch (err) {
      console.error("Pantry refresh error:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalItems = ingredients.length;
    const fillPercent = Math.min(Math.round((totalItems / 20) * 100), 100);

    const now = new Date();
    const fortyEightHours = 48 * 60 * 60 * 1000;
    const expiringCount = ingredients.filter(item => {
      if (!item.expiryDate) return false;
      const diff = new Date(item.expiryDate) - now;
      return diff > 0 && diff < fortyEightHours;
    }).length;

    return { fillPercent, expiringCount };
  };

  const { fillPercent, expiringCount } = calculateStats();

  useEffect(() => {
    const init = async () => {
      const me = await authService.getMe();
      setUser(me.data);
      fetchData();
    };
    init();
  }, []);

  const handleSubmitIngredient = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.quantity) {
      toast.error("Vui lòng nhập đầy đủ tên và số lượng!");
      return;
    }
    try {
      const dataToSend = {
        ...newItem,
        quantity: Number(newItem.quantity)
      };

      if (editingItem) {
        await updatePantryItem(editingItem._id, dataToSend);
        toast.success(`Đã cập nhật ${newItem.name}!`);
      } else {
        await addPantryItem(dataToSend);
        toast.success(`Đã thêm ${newItem.name} vào tủ lạnh!`);
      }

      closeModal();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi xử lý dữ liệu.");
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || "g",
      category: item.category || "Other",
      emoji: item.emoji || "📦",
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : ""
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deletePantryItem(itemToDelete._id);
      toast.success(`Đã xóa ${itemToDelete.name}.`);
      setIsConfirmModalOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (err) {
      toast.error("Lỗi khi xóa nguyên liệu.");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setNewItem({ name: "", quantity: "", unit: "g", category: "Other", emoji: "📦", expiryDate: "" });
  };

  const getFreshnessColor = (days) => {
    if (days < 0) return "#1f2937"; // Expired
    if (days <= 2) return "#ef4444";
    if (days <= 5) return "#f59e0b";
    return "#22c55e";
  };

  return (
    <div className="pantry-container">
      {/* Inventory Main Content */}
      <main className="inventory-main">
        {!Capacitor.isNativePlatform() ? (
          <div className="inventory-header">
            <h2 translate="no">Tủ đựng thức ăn của tôi</h2>
            <div className="header-actions">
              <button className="btn-scan-fridge" onClick={() => setIsScanModalOpen(true)}>
                <Camera size={18} />
                <span>Quét Tủ Lạnh / Hóa Đơn</span>
                <Sparkles size={14} className="scan-sparkle" />
              </button>
              <button className="btn-view-plan flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
                <Plus size={18} /> Thêm mục
              </button>
            </div>
          </div>
        ) : (
          <div className="mobile-pantry-header">
            <div className="pantry-title-row">
              <h2>My Pantry</h2>
              <div className="pantry-header-icons">
                <button className="icon-circle-btn" onClick={() => setIsScanModalOpen(true)}><Camera size={20} /></button>
              </div>
            </div>
            
            {/* Fridge Pulse Grid */}
            <div className="fridge-pulse-grid">
              <div className="pulse-item">
                <div className="pulse-info">
                  <span className="pulse-label">Produce</span>
                  <span className="pulse-val">75%</span>
                </div>
                <div className="pulse-bar"><div className="pulse-fill" style={{ width: '75%', backgroundColor: '#4ADE80' }}></div></div>
              </div>
              <div className="pulse-item">
                <div className="pulse-info">
                  <span className="pulse-label">Dairy</span>
                  <span className="pulse-val">40%</span>
                </div>
                <div className="pulse-bar"><div className="pulse-fill" style={{ width: '40%', backgroundColor: '#3B82F6' }}></div></div>
              </div>
              <div className="pulse-item">
                <div className="pulse-info">
                  <span className="pulse-label">Protein</span>
                  <span className="pulse-val">90%</span>
                </div>
                <div className="pulse-bar"><div className="pulse-fill" style={{ width: '90%', backgroundColor: '#F97316' }}></div></div>
              </div>
              <div className="pulse-item">
                <div className="pulse-info">
                  <span className="pulse-label">Grains</span>
                  <span className="pulse-val">60%</span>
                </div>
                <div className="pulse-bar"><div className="pulse-fill" style={{ width: '60%', backgroundColor: '#FACC15' }}></div></div>
              </div>
            </div>
          </div>
        )}

        {/* FAB for Mobile */}
        {Capacitor.isNativePlatform() && (
          <button className="mobile-fab" onClick={() => setIsModalOpen(true)}>
            <Plus size={32} />
          </button>
        )}

        <div className="ingredient-cards-stack">
          {loading ? (
            <p className="text-muted p-4">Đang kiểm tra kho hàng...</p>
          ) : (
            ingredients.length > 0 ? (
              ingredients.map(item => {
                // Real freshness calculation
                let daysLeft = 7; // Default
                if (item.expiryDate) {
                  const diffTime = new Date(item.expiryDate) - new Date();
                  daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }
                const color = getFreshnessColor(daysLeft);
                const displayName = item.name && item.name.length > 1 ? item.name : "Nguyên liệu mới";

                return (
                  <div key={item._id} className="horizontal-ingredient-card">
                    <div className="ingredient-icon">{item.emoji || "📦"}</div>
                    <div className="ingredient-info-main">
                      <div className="info-top">
                        <h4 translate="no">{displayName}</h4>
                        <span className="date-in">Nhập: {new Date(item.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="freshness-tracker">
                        <div className="freshness-bar-container">
                          <div
                            className="freshness-bar-fill"
                            style={{ width: `${Math.min(daysLeft * 10, 100)}%`, backgroundColor: color }}
                          ></div>
                        </div>
                        <span className="freshness-text" style={{ color }}>{daysLeft} ngày nữa</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <div className="quantity-badge">
                        <span className="font-bold text-lg">{item.quantity}</span>
                        <span className="text-xs text-muted block">{item.unit || "đv"}</span>
                      </div>
                      <div className="action-buttons">
                        <button className="action-btn edit" title="Sửa" onClick={() => handleEditClick(item)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn delete" title="Xóa" onClick={() => handleDeleteClick(item)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-pantry">
                <Package size={48} className="text-muted mb-4" />
                <p>Tủ lạnh đang trống. Hãy thêm nguyên liệu mới!</p>
              </div>
            )
          )}
        </div>

        {/* 3. Rescue Recipes */}
        {ingredients.length > 0 && (
          <section className="rescue-recipes-section">
            <h3 translate="no">
              <Zap size={20} className="text-orange-500" />
              Giải cứu nguyên liệu
            </h3>
            <div className="rescue-grid">
              {rescueRecipes.map(recipe => (
                <Link to={`/recipes/${recipe._id}`} key={recipe._id} className="rescue-card">
                  <img src={recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"} alt={recipe.title} />
                  <h5 translate="no">{recipe.title}</h5>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-xs text-muted">
                      Sử dụng: {recipe.matches && recipe.matches.length > 0
                        ? recipe.matches.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(", ")
                        : "Nguyên liệu sẵn có"}
                    </span>
                    <ChevronRight size={16} className="text-primary" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-popIn">
            <header className="modal-header">
              <h3>{editingItem ? "Sửa nguyên liệu" : "Thêm nguyên liệu mới"}</h3>
            </header>

            <form onSubmit={handleSubmitIngredient} className="pantry-form">
              <div className="form-group">
                <label>Tên nguyên liệu</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cà chua, Thịt bò..."
                  value={newItem.name}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Số lượng</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newItem.quantity}
                    onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Đơn vị</label>
                  <select
                    value={newItem.unit}
                    onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                  >
                    <option value="g">gram (g)</option>
                    <option value="kg">kilogram (kg)</option>
                    <option value="ml">mililit (ml)</option>
                    <option value="l">lít (l)</option>
                    <option value="quả">quả</option>
                    <option value="chai">chai</option>
                    <option value="túi">túi</option>
                    <option value="gói">gói</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Phân loại</label>
                <select
                  value={newItem.category}
                  onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                >
                  <option value="Meat">Thịt & Hải sản</option>
                  <option value="Vegetable">Rau củ quả</option>
                  <option value="Fruit">Trái cây</option>
                  <option value="Dairy">Sữa & Trứng</option>
                  <option value="Spice">Gia vị</option>
                  <option value="Other">Khác</option>
                </select>
              </div>

              <div className="form-group">
                <label>Ngày hết hạn</label>
                <input
                  type="date"
                  value={newItem.expiryDate}
                  onChange={e => setNewItem({ ...newItem, expiryDate: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  Hủy
                </button>
                <button type="submit" className="btn-save-ingredient">
                  {editingItem ? "Cập nhật thay đổi" : "Lưu vào tủ lạnh"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scan Modal */}
      {isScanModalOpen && (
        <div className="modal-overlay">
          <div className="scan-modal animate-popIn">
            <header className="scan-modal-header">
              <div className="scan-title">
                <Camera size={22} />
                <h3>Quét tủ lạnh thông minh</h3>
              </div>
              <button className="close-btn" onClick={closeScanModal}>
                <X size={20} />
              </button>
            </header>

            <div className="scan-modal-body">
              {/* Step 1: Image Selection */}
              {!scanResult && (
                <div className="scan-upload-area">
                  {!scanPreview ? (
                    <div className="upload-zone">
                      <div className="upload-icon-wrapper">
                        <Camera size={40} />
                      </div>
                      <p className="upload-title">Chụp ảnh nguyên liệu trong tủ lạnh</p>
                      <p className="upload-desc">AI sẽ nhận diện và gợi ý món ăn cho bạn</p>
                      <div className="upload-buttons">
                        <button className="upload-btn camera" onClick={() => cameraInputRef.current?.click()}>
                          <Camera size={18} /> Camera
                        </button>
                        <button className="upload-btn gallery" onClick={() => fileInputRef.current?.click()}>
                          <Upload size={18} /> Chọn ảnh
                        </button>
                      </div>
                      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} hidden />
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} hidden />
                    </div>
                  ) : (
                    <div className="preview-area">
                      <div className="preview-image-wrapper">
                        <img src={scanPreview} alt="Preview" className="preview-image" />
                        {isScanning && (
                          <div className="scanning-overlay">
                            <div className="scan-line"></div>
                            <div className="scan-pulse">
                              <Loader size={32} className="spin" />
                              <span>AI đang phân tích...</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {!isScanning && (
                        <div className="preview-actions">
                          <button className="btn-change-image" onClick={() => { setScanPreview(null); setScanImage(null); }}>
                            Chọn ảnh khác
                          </button>
                          <button className="btn-analyze" onClick={handleAnalyze}>
                            <Sparkles size={18} /> Phân tích nguyên liệu
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Results (Success Message & Recipes) */}
              {scanResult && (
                <div className="scan-results-success">
                  <div className="success-header">
                    <div className="success-icon">
                      <CheckCircle2 size={48} />
                    </div>
                    <h4>{scanResult.type === 'bill' ? 'Đã quét hóa đơn!' : 'Đã quét xong tủ lạnh!'}</h4>
                    <p>{scanResult.message}</p>
                  </div>

                  <div className="detected-items-list">
                    <h5>Danh sách các nguyên liệu đã quét:</h5>
                    <div className="items-grid">
                      {(scanResult.data || []).map((item, idx) => (
                        <div key={idx} className="mini-item-card">
                          <span className="mini-emoji">{item.emoji}</span>
                          <span className="mini-name">{item.name}</span>
                          <span className="mini-qty">{item.quantity} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Recipes (if any) */}
                  {scanResult.recipes && scanResult.recipes.length > 0 && (
                    <div className="result-section">
                      <h4><ChefHat size={18} /> Gợi ý món ăn từ AI</h4>
                      <div className="suggested-recipes">
                        {scanResult.recipes.map((recipe, idx) => (
                          <div key={idx} className="suggested-recipe-card">
                            <div className="suggested-recipe-top">
                              <img src={recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'} alt={recipe.title} />
                              <div className="suggested-recipe-info">
                                <h5>{recipe.title}</h5>
                                <div className="recipe-meta-tags">
                                  <span><Clock size={13} /> {recipe.cookTime} phút</span>
                                  <span><Flame size={13} /> {recipe.calories} kcal</span>
                                  <span className={`difficulty ${recipe.difficulty === 'Dễ' ? 'easy' : recipe.difficulty === 'Khó' ? 'hard' : 'medium'}`}>{recipe.difficulty}</span>
                                </div>
                              </div>
                              <div className="suggested-recipe-actions flex gap-2">
                                <button className="btn-cook-this" onClick={() => navigate('/recipes/custom-ai-recipe', { state: { aiRecipe: { ...recipe, _id: 'custom-ai-recipe', ingredients: scanResult.data.map(ing => ({ name: ing.name, quantity: ing.quantity, unit: ing.unit })) } } })}>
                                  <Flame size={16} /> Nấu
                                </button>
                                <button className="btn-expand-recipe" onClick={() => setExpandedRecipe(expandedRecipe === idx ? null : idx)}>
                                  {expandedRecipe === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                              </div>
                            </div>
                            {expandedRecipe === idx && recipe.steps && (
                              <div className="recipe-steps">
                                {recipe.steps.map((step, sIdx) => (
                                  <div key={sIdx} className="recipe-step">
                                    <div className="step-number">{step.order || sIdx + 1}</div>
                                    <p>{step.instruction}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="scan-success-footer">
                    <button className="btn-done" onClick={closeScanModal}>
                      Xong
                    </button>
                    <button className="btn-scan-again-simple" onClick={() => { setScanResult(null); setScanPreview(null); setScanImage(null); }}>
                      Quét thêm
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Confirm Delete Modal */}
      {isConfirmModalOpen && (
        <div className="modal-overlay">
          <div className="confirm-modal animate-popIn">
            <div className="confirm-modal-icon">
              <AlertTriangle size={32} />
            </div>
            <div className="confirm-modal-content">
              <h3>Xác nhận xóa</h3>
              <p>
                Bạn có chắc chắn muốn xóa <strong>{itemToDelete?.name}</strong>? 
                Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="confirm-modal-footer">
              <button className="btn-cancel-confirm" onClick={() => setIsConfirmModalOpen(false)}>
                Hủy
              </button>
              <button className="btn-delete-confirm" onClick={confirmDelete}>
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Upgrade Modal */}
      {isUpgradeModalOpen && (
        <div className="modal-overlay">
          <div className="upgrade-modal animate-popIn">
            <button className="close-upgrade-btn" onClick={() => setIsUpgradeModalOpen(false)}>
              <X size={20} />
            </button>
            <div className="upgrade-header">
              <div className="premium-crown">
                <Sparkles size={40} className="text-yellow-400" />
              </div>
              <h3>Trải nghiệm Full tính năng</h3>
              <p>Bạn đã sử dụng hết 3 lượt dùng thử miễn phí.</p>
            </div>
            
            <div className="upgrade-benefits">
              <div className="benefit-item">
                <CheckCircle2 size={20} className="text-green-500" />
                <span>Quét tủ lạnh & Hóa đơn không giới hạn</span>
              </div>
              <div className="benefit-item">
                <CheckCircle2 size={20} className="text-green-500" />
                <span>Gợi ý thực đơn AI chuyên sâu</span>
              </div>
              <div className="benefit-item">
                <CheckCircle2 size={20} className="text-green-500" />
                <span>Theo dõi dinh dưỡng cá nhân hóa</span>
              </div>
              <div className="benefit-item">
                <CheckCircle2 size={20} className="text-green-500" />
                <span>Tải công thức nấu ăn Offline</span>
              </div>
            </div>

            <div className="upgrade-footer">
              <div className="price-tag">
                <span className="amount">49.000đ</span>
                <span className="period">/tháng</span>
              </div>
              <button className="btn-upgrade-now" onClick={() => {
                setIsUpgradeModalOpen(false);
                navigate('/pricing');
              }}>
                Nâng cấp ngay <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pantry;
