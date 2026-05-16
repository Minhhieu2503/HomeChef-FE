import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  // --- Scan States ---
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanImage, setScanImage] = useState(null);
  const [scanPreview, setScanPreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [selectedIngredients, setSelectedIngredients] = useState({});
  const [expandedRecipe, setExpandedRecipe] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener("resize", handleResize);
    fetchData();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pantryRes, recipesRes] = await Promise.all([
        getPantryItems("All"),
        getAllRecipes()
      ]);
      const items = pantryRes.data || pantryRes || [];
      setIngredients(items);
      setRescueRecipes(recipesRes.recipes?.slice(0, 8) || []);
    } catch (err) {
      console.error("Pantry fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitIngredient = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updatePantryItem(editingItem._id, newItem);
        toast.success("Đã cập nhật!");
      } else {
        await addPantryItem(newItem);
        toast.success("Đã thêm!");
      }
      closeModal();
      fetchData();
    } catch (err) { toast.error("Lỗi xử lý."); }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setNewItem({ ...item, expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : "" });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setNewItem({ name: "", quantity: "", unit: "g", category: "Other", emoji: "📦", expiryDate: "" });
  };

  const handleAnalyze = async () => {
    if (!scanImage) return;
    setIsScanning(true);
    try {
      const result = await scanIngredientImage(scanImage);
      setScanResult(result);
      fetchData();
    } catch (err) { toast.error("Lỗi quét."); }
    finally { setIsScanning(false); }
  };

  const closeScanModal = () => {
    setIsScanModalOpen(false);
    setScanResult(null);
    setScanPreview(null);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    await deletePantryItem(itemToDelete._id);
    setIsConfirmModalOpen(false);
    fetchData();
  };

  // --- SHARED COMPONENTS ---
  const renderModals = () => (
    <>
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-popIn">
            <header className="modal-header">
              <h3>{editingItem ? "Sửa nguyên liệu" : "Thêm mới"}</h3>
              <button onClick={closeModal}><X /></button>
            </header>
            <form onSubmit={handleSubmitIngredient} className="pantry-form">
              <div className="form-group"><label>Tên</label><input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required /></div>
              <div className="form-row">
                <div className="form-group"><label>Số lượng</label><input type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} /></div>
                <div className="form-group"><label>Đơn vị</label><select value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})}><option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="quả">quả</option></select></div>
              </div>
              <div className="modal-footer"><button type="button" onClick={closeModal}>Hủy</button><button type="submit" className="btn-save">Lưu</button></div>
            </form>
          </div>
        </div>
      )}
      {isConfirmModalOpen && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>Xóa nguyên liệu?</h3>
            <div className="flex gap-4 mt-6"><button onClick={() => setIsConfirmModalOpen(false)}>Hủy</button><button onClick={confirmDelete} className="bg-red-500 text-white p-2 px-4 rounded-xl">Xóa</button></div>
          </div>
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <div className="pantry-v2-container mobile-version">
        <section className="fridge-pulse-section">
          <h3>Fridge Pulse</h3>
          <div className="pulse-grid">
            {[
              { label: "Produce", key: "Vegetable", color: "#10b981" },
              { label: "Dairy", key: "Dairy", color: "#6366f1" },
              { label: "Protein", key: "Meat", color: "#f43f5e" },
              { label: "Grains", key: "Other", color: "#f59e0b" }
            ].map(cat => (
              <div key={cat.label} className="pulse-card">
                <div className="pulse-label"><span>{cat.label}</span><span>{ingredients.filter(i => i.category === cat.key).length}</span></div>
                <div className="pulse-bar-bg"><div className="pulse-bar-fill" style={{ width: '60%', background: cat.color }}></div></div>
              </div>
            ))}
          </div>
        </section>

        <main className="inventory-main">
          <div className="inventory-header"><h3>My Pantry</h3><button className="btn-scan-fridge-compact" onClick={() => setIsScanModalOpen(true)}><Camera size={18} /></button></div>
          <div className="ingredient-cards-stack">
            {ingredients.map(item => (
              <div key={item._id} className="horizontal-ingredient-card-v2">
                <div className="card-left"><span className="item-emoji">{item.emoji || "📦"}</span><div className="item-info"><h4>{item.name}</h4><span className="days-text">7 days left</span></div></div>
                <div className="card-right"><span className="qty-text">{item.quantity}{item.unit}</span><div className="item-actions"><button onClick={() => handleEditClick(item)}><Edit2 size={14} /></button><button onClick={() => { setItemToDelete(item); setIsConfirmModalOpen(true); }}><Trash2 size={14} /></button></div></div>
              </div>
            ))}
          </div>
        </main>

        <button className="fab-add-pantry" onClick={() => setIsModalOpen(true)}><Plus size={28} /></button>
        {renderModals()}
      </div>
    );
  }

  // --- DESKTOP VERSION ---
  return (
    <div className="pantry-container desktop-version">
      <div className="pantry-header-desktop">
        <div className="header-info">
          <h1>Quản lý Tủ lạnh</h1>
          <p>Bạn đang có {ingredients.length} nguyên liệu trong kho.</p>
        </div>
        <div className="header-actions">
          <button className="btn-scan-fridge" onClick={() => setIsScanModalOpen(true)}><Camera size={18} /> Quét tủ lạnh AI</button>
          <button className="btn-add-item" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Thêm mới</button>
        </div>
      </div>

      <div className="pantry-layout">
        <div className="inventory-grid">
          {ingredients.map(item => (
            <div key={item._id} className="ingredient-card-desktop">
              <div className="card-emoji">{item.emoji || "📦"}</div>
              <div className="card-content">
                <h3>{item.name}</h3>
                <p>{item.quantity} {item.unit}</p>
                <div className="freshness-indicator"><div className="bar"><div className="fill" style={{ width: '80%' }}></div></div></div>
              </div>
              <div className="card-actions">
                <button onClick={() => handleEditClick(item)}><Edit2 size={16} /></button>
                <button onClick={() => { setItemToDelete(item); setIsConfirmModalOpen(true); }}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>

        <aside className="pantry-sidebar">
          <div className="sidebar-card">
            <h3>Fridge Pulse</h3>
            <div className="pulse-stats">
              <div className="stat-row"><span>Rau củ</span><span>70%</span></div>
              <div className="stat-row"><span>Thịt cá</span><span>40%</span></div>
            </div>
          </div>
        </aside>
      </div>
      {renderModals()}
    </div>
  );
}

export default Pantry;
