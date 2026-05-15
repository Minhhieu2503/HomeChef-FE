import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { 
  Plus, Search, Edit3, Trash2, Eye, X, Save, PlusCircle, MinusCircle, Info, List, ChefHat, Target, Image as ImageIcon, Video 
} from "lucide-react";
import "./AdminLayout.css";
import "./AdminRecipes.css";

const AdminRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("Tất cả danh mục");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState({
    title: "", image: "", category: "main", cookTime: 30, description: "",
    calories: 0, protein: 0, fat: 0, carbs: 0,
    ingredients: [{ name: "", quantity: "" }],
    steps: [{ order: 1, instruction: "", image: "", video: "" }]
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, []);

  useEffect(() => {
    handleFilter();
  }, [searchTerm, filterCategory, recipes]);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/recipes");
      if (response.success) {
        setRecipes(response.data);
      }
    } catch (err) {
      console.error("Error fetching recipes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    let temp = [...recipes];
    if (searchTerm) {
      temp = temp.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterCategory !== "Tất cả danh mục") {
      temp = temp.filter(r => r.category.toLowerCase() === filterCategory.toLowerCase());
    }
    setFilteredRecipes(temp);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa vĩnh viễn món ăn này?")) return;
    try {
      const response = await api.delete(`/admin/recipes/${id}`);
      if (response.success) {
        setRecipes(recipes.filter(r => r._id !== id));
      }
    } catch (err) {
      alert("Lỗi khi xóa: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Clean data
    const cleanedIngredients = currentRecipe.ingredients.filter(ing => ing.name.trim() !== "" && ing.quantity.trim() !== "");
    const cleanedSteps = currentRecipe.steps.filter(step => step.instruction.trim() !== "");

    if (cleanedIngredients.length === 0 || cleanedSteps.length === 0) {
      alert("Vui lòng nhập ít nhất 1 nguyên liệu và 1 bước thực hiện!");
      return;
    }

    const payload = {
      ...currentRecipe,
      ingredients: cleanedIngredients,
      steps: cleanedSteps.map((s, i) => ({ ...s, order: i + 1 }))
    };

    try {
      if (isEditing) {
        const response = await api.put(`/admin/recipes/${currentRecipe._id}`, payload);
        if (response.success) {
          setRecipes(recipes.map(r => r._id === currentRecipe._id ? response.data : r));
        }
      } else {
        const response = await api.post("/admin/recipes", payload);
        if (response.success) {
          setRecipes([response.data, ...recipes]);
        }
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      alert("Lỗi khi lưu: " + (err.response?.data?.message || err.message));
    }
  };

  const openModal = (recipe = null) => {
    if (recipe) {
      setCurrentRecipe({
        ...recipe,
        ingredients: recipe.ingredients?.length > 0 ? [...recipe.ingredients] : [{ name: "", quantity: "" }],
        steps: recipe.steps?.length > 0 ? recipe.steps.map(s => ({ ...s, image: s.image || "", video: s.video || "" })) : [{ order: 1, instruction: "", image: "", video: "" }]
      });
      setIsEditing(true);
    } else {
      resetForm();
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setCurrentRecipe({
      title: "", image: "", category: "main", cookTime: 30, description: "",
      calories: 0, protein: 0, fat: 0, carbs: 0,
      ingredients: [{ name: "", quantity: "" }],
      steps: [{ order: 1, instruction: "", image: "", video: "" }]
    });
  };

  // Helper dynamic form functions
  const addIngredient = () => {
    setCurrentRecipe({
      ...currentRecipe,
      ingredients: [...currentRecipe.ingredients, { name: "", quantity: "" }]
    });
  };

  const removeIngredient = (idx) => {
    setCurrentRecipe({
      ...currentRecipe,
      ingredients: currentRecipe.ingredients.filter((_, i) => i !== idx)
    });
  };

  const addStep = () => {
    setCurrentRecipe({
      ...currentRecipe,
      steps: [...currentRecipe.steps, { order: currentRecipe.steps.length + 1, instruction: "", image: "", video: "" }]
    });
  };

  const removeStep = (idx) => {
    setCurrentRecipe({
      ...currentRecipe,
      steps: currentRecipe.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 }))
    });
  };

  return (
    <div className="view-container">
      <header className="view-header">
        <div className="header-main">
          <div>
            <h1>Quản lý công thức</h1>
            <p>Kiểm duyệt và tối ưu kho công thức ẩm thực thông minh</p>
          </div>
          <button className="btn-primary" onClick={() => openModal()}>
            <Plus size={24} />
            <span>Thêm món ăn mới</span>
          </button>
        </div>
      </header>

      <div className="filter-card">
        <div className="search-group">
          <Search className="icon" size={20} />
          <input 
            type="text" 
            placeholder="Tìm theo tên món ăn..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="custom-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option>Tất cả danh mục</option>
          <option value="main">Món chính</option>
          <option value="appetizer">Khai vị</option>
          <option value="dessert">Tráng miệng</option>
          <option value="drink">Đồ uống</option>
          <option value="snack">Ăn vặt</option>
          <option value="soup">Súp/Canh</option>
          <option value="salad">Salad</option>
          <option value="breakfast">Bữa sáng</option>
          <option value="vegetarian">Món chay</option>
          <option value="healthy">Healthy</option>
        </select>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Đang tải dữ liệu...</div>
        ) : (
          <table className="admin-table-pro">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Món ăn</th>
                <th>Tác giả</th>
                <th>Danh mục</th>
                <th>Calo</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecipes.map(recipe => (
                <tr key={recipe._id}>
                  <td>
                    <div className="dish-cell-pro">
                      <img src={recipe.image || "https://via.placeholder.com/100"} alt="" />
                      <div className="info">
                        <span className="title">{recipe.title}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="author-name-pro">{recipe.author?.name || "Admin"}</span></td>
                  <td><span className="badge-blue">{recipe.category}</span></td>
                  <td><span className="stats-text" style={{ color: '#f59e0b', fontWeight: 800 }}>{recipe.calories || 0} kcal</span></td>
                  <td><span className="stats-text">{recipe.cookTime} phút</span></td>
                  <td>
                    <span className={`badge-status ${recipe.status || 'approved'}`}>
                      {recipe.status === 'approved' ? 'Hoạt động' : 'Chờ duyệt'}
                    </span>
                  </td>
                  <td>
                    <div className="action-group-pro">
                      <button className="btn-sm" onClick={() => openModal(recipe)} title="Chỉnh sửa"><Edit3 size={20} /></button>
                      <button className="btn-sm danger" onClick={() => handleDelete(recipe._id)} title="Xóa bỏ"><Trash2 size={20} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL REDESIGN */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '12px' }}>
                  <ChefHat className="text-emerald" size={24} style={{ color: '#10b981' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{isEditing ? "Chỉnh sửa công thức" : "Thêm công thức mới"}</h2>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Vui lòng điền đầy đủ các thông tin bên dưới</p>
                </div>
              </div>
              <button className="btn-close-pro" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            
            <div className="modal-body-scroll">
              <form id="recipe-form" onSubmit={handleSave}>
                <div className="section-label" style={{ marginTop: 0 }}>
                  <Info size={18} color="#10b981" />
                  <h3>Thông tin cơ bản</h3>
                  <div className="line"></div>
                </div>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tên món ăn</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="VD: Phở Bò Nam Định"
                      value={currentRecipe.title}
                      onChange={(e) => setCurrentRecipe({...currentRecipe, title: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Thời gian nấu (phút)</label>
                    <input 
                      type="number" 
                      value={currentRecipe.cookTime}
                      onChange={(e) => setCurrentRecipe({...currentRecipe, cookTime: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Danh mục</label>
                    <select 
                      value={currentRecipe.category}
                      onChange={(e) => setCurrentRecipe({...currentRecipe, category: e.target.value})}
                    >
                      <option value="main">Món chính</option>
                      <option value="appetizer">Khai vị</option>
                      <option value="dessert">Tráng miệng</option>
                      <option value="drink">Đồ uống</option>
                      <option value="snack">Ăn vặt</option>
                      <option value="soup">Súp/Canh</option>
                      <option value="salad">Salad</option>
                      <option value="breakfast">Bữa sáng</option>
                      <option value="vegetarian">Món chay</option>
                      <option value="healthy">Healthy</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Link ảnh món ăn</label>
                    <input 
                      type="text" 
                      placeholder="https://images.unsplash.com/..."
                      value={currentRecipe.image}
                      onChange={(e) => setCurrentRecipe({...currentRecipe, image: e.target.value})}
                    />
                  </div>
                </div>

                <div className="section-label">
                  <Target size={18} color="#10b981" />
                  <h3>Chỉ số dinh dưỡng</h3>
                  <div className="line"></div>
                </div>

                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Calories (kcal)</label>
                    <input 
                      type="number" 
                      value={currentRecipe.calories}
                      onChange={(e) => setCurrentRecipe({...currentRecipe, calories: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Protein (g)</label>
                    <input 
                      type="number" 
                      value={currentRecipe.protein}
                      onChange={(e) => setCurrentRecipe({...currentRecipe, protein: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fat (g)</label>
                    <input 
                      type="number" 
                      value={currentRecipe.fat}
                      onChange={(e) => setCurrentRecipe({...currentRecipe, fat: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Carbs (g)</label>
                    <input 
                      type="number" 
                      value={currentRecipe.carbs}
                      onChange={(e) => setCurrentRecipe({...currentRecipe, carbs: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="section-label">
                  <List size={18} color="#10b981" />
                  <h3>Nguyên liệu</h3>
                  <div className="line"></div>
                </div>
                
                {currentRecipe.ingredients.map((ing, idx) => (
                  <div key={idx} className="dynamic-row">
                    <div style={{ flex: 1 }}>
                      <input 
                        placeholder="Tên nguyên liệu"
                        value={ing.name}
                        onChange={(e) => {
                          const newIng = [...currentRecipe.ingredients];
                          newIng[idx].name = e.target.value;
                          setCurrentRecipe({...currentRecipe, ingredients: newIng});
                        }}
                      />
                    </div>
                    <div style={{ width: '150px' }}>
                      <input 
                        placeholder="Định lượng"
                        value={ing.quantity}
                        onChange={(e) => {
                          const newIng = [...currentRecipe.ingredients];
                          newIng[idx].quantity = e.target.value;
                          setCurrentRecipe({...currentRecipe, ingredients: newIng});
                        }}
                      />
                    </div>
                    {currentRecipe.ingredients.length > 1 && (
                      <button type="button" className="btn-sm danger" style={{ border: 'none' }} onClick={() => removeIngredient(idx)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-add-line" onClick={addIngredient}>
                  <PlusCircle size={18} /> Thêm nguyên liệu mới
                </button>

                <div className="section-label">
                  <ChefHat size={18} color="#10b981" />
                  <h3>Các bước nấu</h3>
                  <div className="line"></div>
                </div>

                 {currentRecipe.steps.map((step, idx) => (
                  <div key={idx} className="step-edit-container">
                    <div className="step-main-row">
                      <div className="step-number">
                        {step.order}
                      </div>
                      <div className="step-content">
                        <textarea 
                          rows="2"
                          placeholder="Mô tả cách thực hiện bước này..."
                          value={step.instruction}
                          onChange={(e) => {
                            const newSteps = [...currentRecipe.steps];
                            newSteps[idx].instruction = e.target.value;
                            setCurrentRecipe({...currentRecipe, steps: newSteps});
                          }}
                        />
                        
                        <div className="step-assets">
                          <div className="asset-input">
                            <ImageIcon size={16} />
                            <input 
                              type="text"
                              placeholder="Link ảnh minh họa"
                              value={step.image || ""}
                              onChange={(e) => {
                                const newSteps = [...currentRecipe.steps];
                                newSteps[idx].image = e.target.value;
                                setCurrentRecipe({...currentRecipe, steps: newSteps});
                              }}
                            />
                          </div>
                          <div className="asset-input">
                            <Video size={16} />
                            <input 
                              type="text"
                              placeholder="Link video minh họa"
                              value={step.video || ""}
                              onChange={(e) => {
                                const newSteps = [...currentRecipe.steps];
                                newSteps[idx].video = e.target.value;
                                setCurrentRecipe({...currentRecipe, steps: newSteps});
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      {currentRecipe.steps.length > 1 && (
                        <button type="button" className="btn-remove-step" onClick={() => removeStep(idx)}>
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button type="button" className="btn-add-line" onClick={addStep}>
                  <PlusCircle size={18} /> Thêm bước thực hiện
                </button>
              </form>
            </div>

            <div className="modal-footer" style={{ padding: '1.5rem 2.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn-secondary" style={{ background: '#f1f5f9', border: 'none', padding: '0.85rem 1.5rem', borderRadius: '14px', fontWeight: 700, cursor: 'pointer' }} onClick={() => setIsModalOpen(false)}>Hủy bỏ</button>
              <button type="submit" form="recipe-form" className="btn-primary">
                <Save size={20} />
                Lưu công thức
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecipes;
