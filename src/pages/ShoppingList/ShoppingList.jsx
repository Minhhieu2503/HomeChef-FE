import { useState, useEffect } from "react";
import "./ShoppingList.css";
import { getShoppingList, addShoppingItem, updateShoppingItem, deleteShoppingItem, clearCheckedItems } from "../../services/shoppingService";
import { useToast } from "../../context/ToastContext";

function ShoppingList() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState("");

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await getShoppingList();
      setItems(data || []);
    } catch (err) {
      console.error("Failed to load shopping list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const toggleItem = async (id, currentChecked) => {
    await updateShoppingItem(id, { checked: !currentChecked });
    setItems(items.map(i => i._id === id ? {...i, checked: !currentChecked} : i));
  };

  const removeItem = async (id) => {
    await deleteShoppingItem(id);
    setItems(items.filter(i => i._id !== id));
  };

  const addItem = async () => {
    if (!newItem.trim()) return;
    const created = await addShoppingItem({ name: newItem, quantity: "1" });
    setItems([created, ...items]);
    setNewItem("");
  };

  const handleClearChecked = async () => {
    await clearCheckedItems();
    loadItems();
  };

  // Grouping logic (Basic regex for demo mock grouping)
  const categorize = (name) => {
    const n = name.toLowerCase();
    if (n.includes('thịt') || n.includes('chicken') || n.includes('bò') || n.includes('meat')) return "🥩 Thịt & Cá";
    if (n.includes('rau') || n.includes('cà') || n.includes('bơ') || n.includes('vegetable') || n.includes('tomato')) return "🥬 Rau củ";
    return "🥫 Khác / Gia vị";
  };

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  // Group items by category
  const grouped = unchecked.reduce((acc, item) => {
    const cat = categorize(item.name);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Calc simulated total cost
  const estTotal = unchecked.length * 45000; // simulated price per item avg 45k

  return (
    <div className="shopping-page mobile-premium">
      <div className="page-header simple-header">
        <div>
          <h1>Đi chợ</h1>
          <p className="text-muted">Còn {unchecked.length} món chưa mua</p>
        </div>
        <button className="btn btn-ghost text-red" onClick={handleClearChecked} style={{color: '#ef4444', fontWeight: 700}}>
          Xóa hết
        </button>
      </div>

      {/* Add Field */}
      <div className="minimal-add-bar">
        <input
          type="text"
          placeholder="+ Nhập nhanh đồ cần mua..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
        />
      </div>

      {loading ? (
        <div className="loading-state">Đang tải...</div>
      ) : (
        <div className="shopping-content-scroll">
          {/* GROUPED ACTIVE ITEMS */}
          {Object.keys(grouped).map(category => (
            <div className="cat-block" key={category}>
              <h3 className="cat-title">{category}</h3>
              <div className="check-stack">
                {grouped[category].map(item => (
                  <div className="shop-row" key={item._id} onClick={() => toggleItem(item._id, item.checked)}>
                    <div className={`shop-check ${item.checked ? 'on' : ''}`}></div>
                    <span className="shop-name">{item.name}</span>
                    <span className="shop-q">x{item.quantity || 1}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {unchecked.length === 0 && !loading && (
            <div className="empty-state" style={{paddingTop: '4rem'}}>Không còn món nào! 🥳</div>
          )}

          {/* COMPLETED ACCORDION MOCK */}
          {checked.length > 0 && (
            <div className="completed-block">
              <h4 className="text-muted">Đã xong ({checked.length})</h4>
              <div className="check-stack dimmer">
                {checked.map(item => (
                  <div className="shop-row strike" key={item._id} onClick={() => toggleItem(item._id, item.checked)}>
                    <div className="shop-check on">✓</div>
                    <span className="shop-name">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STICKY BOTTOM ORDER BAR */}
      {unchecked.length > 0 && (
        <div className="sticky-order-bar">
          <div className="cost-info">
            <span className="lbl">Tổng dự kiến</span>
            <span className="val">{estTotal.toLocaleString('vi-VN')} đ</span>
          </div>
          <button className="btn btn-sunset btn-lg" onClick={() => toast.info("Kết nối dịch vụ giao hàng đang phát triển!")}>
            🛵 Đặt ngay
          </button>
        </div>
      )}
    </div>
  );
}

export default ShoppingList;
