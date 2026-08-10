import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useStore } from '../../context/StoreContext';
import type { MenuItem, OrderStatus } from '../../types';
import { Search, Plus, SlidersHorizontal, Heart, ShoppingBag, Utensils, Clock, Check, ArrowRight, Minus, Trash2, Star, ChefHat, Gift } from 'lucide-react';
import { FoodDetailModal } from './FoodDetailModal';
import { SpinWheelGame } from './SpinWheelGame';

/**
 * Hook: enables click-and-drag horizontal scrolling for a container.
 * Also enables smooth touch scrolling on mobile.
 */
function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    isDragging.current = true;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeft.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    const el = ref.current;
    if (el) {
      el.style.cursor = 'grab';
      el.style.userSelect = '';
    }
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const el = ref.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    el.scrollLeft = scrollLeft.current - walk;
  }, []);

  const onMouseLeave = useCallback(() => {
    isDragging.current = false;
    const el = ref.current;
    if (el) {
      el.style.cursor = 'grab';
      el.style.userSelect = '';
    }
  }, []);

  return { ref, onMouseDown, onMouseUp, onMouseMove, onMouseLeave };
}

const CATEGORIES = [
  { id: 'All', label: 'All Dishes' },
  { id: 'Starters', label: 'Starters' },
  { id: 'Mains', label: 'Mains' },
  { id: 'Chef Specials', label: 'Chef Specials' },
  { id: 'Beverages', label: 'Drinks' },
  { id: 'Desserts', label: 'Desserts' },
];

interface CustomerViewProps {
  onOpenCart?: () => void;
  onOpenOrderTracker?: () => void;
}

export const CustomerView: React.FC<CustomerViewProps> = ({ onOpenCart, onOpenOrderTracker }) => {
  const {
    menuItems,
    selectedTableId,
    addToCart,
    cart,
    cartSubtotal,
    orders,
    removeFromCart,
    updateCartQuantity,
    placeOrder,
    addToast
  } = useStore();

  const [activeTab, setActiveTab] = useState<'menu' | 'cart' | 'status' | 'games'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItemModal, setActiveItemModal] = useState<MenuItem | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['dish-1', 'dish-2']));
  const allDishesSectionRef = useRef<HTMLDivElement>(null);
  const popularScroll = useDragScroll();
  
  // Filter panel state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [spiceFilter, setSpiceFilter] = useState<'all' | 'none' | 'mild' | 'spicy'>('all');

  // Allergen / dietary preferences
  const [allergenNote, setAllergenNote] = useState(() => localStorage.getItem('savour_allergen_note') || '');
  const [showAllergenEditor, setShowAllergenEditor] = useState(false);
  
  // Cart form state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [tipAmount, setTipAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFavorite = (e: React.MouseEvent, dishId: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(dishId)) next.delete(dishId);
      else next.add(dishId);
      return next;
    });
  };

  // Active order for current table
  const activeOrderForTable = useMemo(() => {
    return orders.find(
      (o) => o.table_id === selectedTableId && !o.isMock && ['placed', 'accepted', 'preparing', 'ready', 'served'].includes(o.status)
    );
  }, [orders, selectedTableId]);

  const tableOrders = useMemo(() => {
    return orders.filter((o) => o.table_id === selectedTableId && !o.isMock);
  }, [orders, selectedTableId]);

  const activeOrdersCount = useMemo(() => {
    return tableOrders.filter((o) => ['placed', 'accepted', 'preparing', 'ready'].includes(o.status)).length;
  }, [tableOrders]);

  const filteredDishes = useMemo(() => {
    return menuItems.filter((item) => {
      const cat = item.categoryName || (item as any).category;
      if (selectedCategory !== 'All' && cat !== selectedCategory) return false;
      // Veg filter toggle
      if (vegFilter === 'veg' && !item.is_veg) return false;
      if (vegFilter === 'non-veg' && item.is_veg) return false;
      // Spice level filter toggle
      if (spiceFilter !== 'all' && (item.spice_level || 'none') !== spiceFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        // Allow searching "veg" or "vegetarian" as a keyword
        const isVegSearch = q === 'veg' || q === 'vegetarian';
        const isNonVegSearch = q === 'non veg' || q === 'non-veg' || q === 'nonveg';
        if (isVegSearch) return item.is_veg === true;
        if (isNonVegSearch) return item.is_veg === false;
        return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [menuItems, selectedCategory, searchQuery, vegFilter, spiceFilter]);

  const popularDishes = useMemo(() => {
    return filteredDishes.filter((item) => item.is_bestseller || (item.rating && item.rating >= 4.8)).slice(0, 5);
  }, [filteredDishes]);

  const chefSpecialDish = useMemo(() => {
    return filteredDishes.find((item) => item.categoryName === 'Chef Specials') || filteredDishes[0];
  }, [filteredDishes]);

  const averageRating = useMemo(() => {
    const ratedItems = menuItems.filter((i) => i.rating != null && i.rating > 0);
    if (ratedItems.length === 0) return '4.8';
    const sum = ratedItems.reduce((acc, i) => acc + (i.rating || 0), 0);
    return (sum / ratedItems.length).toFixed(1);
  }, [menuItems]);

  const averagePrepTime = useMemo(() => {
    const itemsWithPrep = menuItems.filter((i) => i.prepTimeMinutes != null && i.prepTimeMinutes > 0);
    if (itemsWithPrep.length === 0) return 15;
    const sum = itemsWithPrep.reduce((acc, i) => acc + (i.prepTimeMinutes || 0), 0);
    return Math.round(sum / itemsWithPrep.length);
  }, [menuItems]);

  const totalCartQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (code === 'SAVOUR20') {
      setDiscountAmount(cartSubtotal * 0.2);
      setAppliedCoupon('SAVOUR20');
      addToast('Coupon applied', '20% discount added to cart', 'success');
    } else if (code === 'WELCOME10') {
      setDiscountAmount(Math.min(10, cartSubtotal));
      setAppliedCoupon('WELCOME10');
      addToast('Coupon applied', '₹10 off added to cart', 'success');
    } else {
      addToast('Invalid promo code', 'Try SAVOUR20 or WELCOME10', 'warning');
    }
  };

  const afterDiscount = Math.max(0, cartSubtotal - discountAmount);
  const tax = afterDiscount * 0.08;
  const grandTotal = afterDiscount + tax + tipAmount;

  const handleSendToKitchen = () => {
    if (isSubmitting || cart.length === 0) return;
    setIsSubmitting(true);

    try {
      // Include allergen note as special instructions
      placeOrder(allergenNote || '', appliedCoupon || undefined, tipAmount);
      setActiveTab('status');
    } catch (err: any) {
      addToast("Couldn't reach kitchen", err.message || 'Please try again', 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)', paddingBottom: 100 }} className="cust-glow-bg font-inter">
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* ═══════════════════ HERO HEADER ═══════════════════ */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #3D1A06 0%, #2A1208 40%, #1C0E06 70%, #1C1410 100%)',
          paddingBottom: 0,
        }}>
          {/* Decorative background orbs */}
          <div className="hero-orb" style={{
            position: 'absolute', top: -60, right: -60, width: 220, height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,138,52,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: -40, width: 160, height: 160,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(217,166,46,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
            animationDelay: '3s',
          }} className="hero-orb" />

          {/* Top action bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px 0',
          }}>
            {/* Table badge + switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,138,52,0.15)',
                border: '1px solid rgba(255,138,52,0.3)',
                borderRadius: 999, padding: '5px 12px',
              }}>
                <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-orange)', display: 'inline-block' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-orange)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Table
                </span>
                <span
                  style={{
                    color: 'var(--accent-orange)', fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                >
                  {selectedTableId}
                </span>
              </div>
            </div>

            {/* Right: Order tracker + Cart */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {activeOrderForTable && (
                <button
                  onClick={() => {
                    if (onOpenOrderTracker) {
                      onOpenOrderTracker();
                    } else {
                      window.dispatchEvent(new CustomEvent('open-order-tracker'));
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: '1px solid var(--accent-amber)',
                    background: 'rgba(217,166,46,0.15)',
                    fontSize: '0.7rem', fontWeight: 700,
                    color: 'var(--accent-amber)', cursor: 'pointer',
                    letterSpacing: '0.03em',
                  }}
                >
                  <Clock style={{ width: 12, height: 12 }} />
                  #{activeOrderForTable.orderNumber}
                </button>
              )}
              <button
                onClick={() => {
                  if (onOpenCart) {
                    onOpenCart();
                  } else {
                    window.dispatchEvent(new CustomEvent('open-cart-drawer'));
                  }
                }}
                style={{
                  position: 'relative', width: 40, height: 40,
                  borderRadius: 12,
                  background: totalCartQty > 0 ? 'var(--accent-orange)' : 'rgba(255,255,255,0.08)',
                  border: `1px solid ${totalCartQty > 0 ? 'var(--accent-orange)' : 'rgba(255,255,255,0.12)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: totalCartQty > 0 ? '0 4px 14px rgba(255,138,52,0.4)' : 'none',
                }}
              >
                <ShoppingBag style={{ width: 18, height: 18, color: totalCartQty > 0 ? '#FFF' : 'var(--text-secondary)' }} />
                {totalCartQty > 0 && (
                  <span style={{
                    position: 'absolute', top: -6, right: -6,
                    minWidth: 18, height: 18, borderRadius: 999,
                    background: '#FFF', color: 'var(--accent-orange)',
                    fontSize: '0.6rem', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}>{totalCartQty}</span>
                )}
              </button>
            </div>
          </div>

          {/* Restaurant Branding */}
          <div className="animate-slide-up" style={{ padding: '20px 20px 0', textAlign: 'center', position: 'relative', zIndex: 2 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(255,138,52,0.25) 0%, rgba(217,166,46,0.2) 100%)',
              border: '2px solid rgba(255,138,52,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 0 30px rgba(255,138,52,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}>
              <ChefHat style={{ width: 30, height: 30, color: 'var(--accent-orange)' }} />
            </div>

            <h1 className="font-sora" style={{
              fontSize: '2rem', fontWeight: 800,
              color: '#FFFFFF',
              margin: '0 0 6px',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}>
              Savour Bistro
            </h1>

            <p style={{
              fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)',
              margin: '0 0 18px', letterSpacing: '0.04em',
            }}>
              Fine Dining · Kerala Cuisine · Since 2018
            </p>

            {/* Stats bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24,
              padding: '14px 20px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '16px 16px 0 0',
              border: '1px solid rgba(255,255,255,0.06)',
              borderBottom: 'none',
              marginBottom: 0,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
                  <Star style={{ width: 13, height: 13, color: '#FFB800', fill: '#FFB800' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFF' }}>{averageRating}</span>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.03em' }}>RATING</span>
              </div>
              <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
                  <Clock style={{ width: 13, height: 13, color: 'var(--accent-green)' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFF' }}>{averagePrepTime}</span>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.03em' }}>MIN AVG</span>
              </div>
              <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
                  <Utensils style={{ width: 13, height: 13, color: 'var(--accent-blue)' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFF' }}>{menuItems.length}+</span>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.03em' }}>DISHES</span>
              </div>
            </div>
          </div>
        </div>
        {/* ═══════════════════ END HERO ═══════════════════ */}


        <div style={{ padding: '20px 16px 0' }}>

        {/* -------------------- MAIN MENU TAB -------------------- */}
        {activeTab === 'menu' && (
          <>
            {/* Search Bar + Filter Button */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search style={{ position: 'absolute', left: 14, width: 18, height: 18, color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search food, or type 'veg'..."
                  style={{
                    width: '100%',
                    height: 48,
                    padding: '0 16px 0 44px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--surface)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                style={{
                  width: 48, height: 48,
                  borderRadius: 'var(--radius-card)',
                  background: showFilterPanel || vegFilter !== 'all' || spiceFilter !== 'all' ? 'var(--accent-orange)' : 'var(--surface)',
                  border: `1px solid ${showFilterPanel || vegFilter !== 'all' || spiceFilter !== 'all' ? 'var(--accent-orange)' : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                <SlidersHorizontal style={{ width: 18, height: 18, color: showFilterPanel || vegFilter !== 'all' || spiceFilter !== 'all' ? '#FFF' : 'var(--text-primary)' }} />
                {(vegFilter !== 'all' || spiceFilter !== 'all') && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#34D399', border: '2px solid var(--bg-base)',
                  }} />
                )}
              </button>
            </div>

            {/* Filter Panel */}
            {showFilterPanel && (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-card)',
                padding: '14px 16px',
                marginBottom: 14,
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 60 }}>Diet:</span>
                  {([['all', '🍽️ All'], ['veg', '🥗 Veg Only'], ['non-veg', '🍖 Non-Veg Only']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setVegFilter(val)}
                      style={{
                        padding: '7px 14px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600,
                        border: `1px solid ${vegFilter === val ? 'var(--accent-orange)' : 'rgba(255,255,255,0.1)'}`,
                        background: vegFilter === val ? 'rgba(255,138,52,0.15)' : 'transparent',
                        color: vegFilter === val ? 'var(--accent-orange)' : 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >{label}</button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 60 }}>Spice:</span>
                  {([['all', '🌶️ All Spice'], ['none', '🟢 Sweet / Mild'], ['mild', '🌶️ Medium'], ['spicy', '🔥 Spicy']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setSpiceFilter(val)}
                      style={{
                        padding: '7px 14px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600,
                        border: `1px solid ${spiceFilter === val ? 'var(--accent-orange)' : 'rgba(255,255,255,0.1)'}`,
                        background: spiceFilter === val ? 'rgba(255,138,52,0.15)' : 'transparent',
                        color: spiceFilter === val ? 'var(--accent-orange)' : 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >{label}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Allergen / Dietary Preference Banner */}
            <div style={{
              background: allergenNote ? 'rgba(255,138,52,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${allergenNote ? 'rgba(255,138,52,0.3)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 12, padding: '10px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 14, cursor: 'pointer', gap: 10,
            }} onClick={() => setShowAllergenEditor(!showAllergenEditor)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1rem' }}>⚠️</span>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: allergenNote ? 'var(--accent-orange)' : 'var(--text-secondary)' }}>
                    {allergenNote ? 'Dietary Note Active' : 'Add Dietary / Allergy Note'}
                  </span>
                  {allergenNote && (
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
                      {allergenNote}
                    </p>
                  )}
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{showAllergenEditor ? 'Close ▲' : 'Edit ▼'}</span>
            </div>

            {showAllergenEditor && (
              <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  value={allergenNote}
                  onChange={(e) => {
                    setAllergenNote(e.target.value);
                    localStorage.setItem('savour_allergen_note', e.target.value);
                  }}
                  placeholder="e.g. Allergic to onions and peanuts. Please do not add them to any dish."
                  rows={3}
                  style={{
                    width: '100%', padding: '12px 14px',
                    borderRadius: 12,
                    background: 'var(--surface)',
                    border: '1px solid rgba(255,138,52,0.3)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none', resize: 'none',
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      setAllergenNote('');
                      localStorage.removeItem('savour_allergen_note');
                      setShowAllergenEditor(false);
                    }}
                    style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}
                  >Clear</button>
                  <button
                    onClick={() => setShowAllergenEditor(false)}
                    style={{ flex: 2, padding: '8px', borderRadius: 8, background: 'var(--accent-orange)', border: 'none', color: '#FFF', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                  >Save Note ✓</button>
                </div>
              </div>
            )}

            {/* Category Chips Horizontal Scroll */}
            <div className="no-scrollbar" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16, marginBottom: 16 }}>
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="font-sora"
                    style={{
                      flexShrink: 0,
                      padding: '10px 18px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      background: isActive ? 'var(--accent-orange)' : 'var(--surface)',
                      color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                      boxShadow: isActive ? '0 4px 14px rgba(255,138,52,0.4)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Chef's Special Feature Promo Banner */}
            {chefSpecialDish && selectedCategory === 'All' && !searchQuery && (
              <div
                onClick={() => setActiveItemModal(chefSpecialDish)}
                className="cust-card"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  padding: 20,
                  marginBottom: 24,
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #3D2415 0%, #2B1F17 100%)',
                  border: '1px solid rgba(255,138,52,0.25)',
                }}
              >
                <div style={{ width: '60%', zIndex: 2, position: 'relative' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent-orange)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    🔥 Chef's Special
                  </span>
                  <h3 className="font-sora" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFF', margin: '4px 0 8px', lineHeight: 1.2 }}>
                    {chefSpecialDish.name}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {chefSpecialDish.description}
                  </p>
                  <button
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--accent-orange)',
                      color: '#FFF',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Order Now — ₹{chefSpecialDish.price.toFixed(2)}
                  </button>
                </div>
                <img
                  src={chefSpecialDish.image_url || chefSpecialDish.image}
                  alt={chefSpecialDish.name}
                  style={{
                    position: 'absolute',
                    right: -10,
                    bottom: -10,
                    width: 140,
                    height: 140,
                    objectFit: 'cover',
                    borderRadius: '50%',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                />
              </div>
            )}

            {/* Popular Now Horizontal Scroll Row */}
            {selectedCategory === 'All' && !searchQuery && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h2 className="font-sora" style={{ fontSize: 'var(--cust-text-h2)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Popular Now
                  </h2>
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSearchQuery('');
                      setTimeout(() => {
                        allDishesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 50);
                    }}
                    style={{ fontSize: '0.75rem', color: 'var(--accent-orange)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
                  >
                    View All
                  </button>
                </div>

                <div
                  ref={popularScroll.ref}
                  onMouseDown={popularScroll.onMouseDown}
                  onMouseUp={popularScroll.onMouseUp}
                  onMouseMove={popularScroll.onMouseMove}
                  onMouseLeave={popularScroll.onMouseLeave}
                  className="no-scrollbar"
                  style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, paddingLeft: 16, paddingRight: 16, marginLeft: -16, marginRight: -16, cursor: 'grab', WebkitOverflowScrolling: 'touch' }}
                >
                  {popularDishes.map((dish) => {
                    const isFav = favorites.has(dish.id);
                    return (
                      <div
                        key={dish.id}
                        onClick={() => setActiveItemModal(dish)}
                        className="cust-card"
                        style={{
                          flexShrink: 0,
                          width: 200,
                          minWidth: 200,
                          padding: 12,
                          cursor: 'pointer',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        {/* Heart icon top-right */}
                        <button
                          onClick={(e) => toggleFavorite(e, dish.id)}
                          style={{
                            position: 'absolute',
                            top: 18,
                            right: 18,
                            zIndex: 3,
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(4px)',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Heart
                            style={{
                              width: 14,
                              height: 14,
                              color: isFav ? 'var(--favorite-red)' : '#FFF',
                              fill: isFav ? 'var(--favorite-red)' : 'transparent',
                            }}
                          />
                        </button>

                        <div style={{ width: '100%', height: 140, borderRadius: 'var(--radius-card)', overflow: 'hidden', marginBottom: 10, background: '#1C1410' }}>
                          <img src={dish.image_url || dish.image} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>

                        <div>
                          <h4 className="font-sora" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {dish.name}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                            <span className="font-sora" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-orange)' }}>
                              ₹{dish.price.toFixed(2)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(dish, 1);
                              }}
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--accent-orange)',
                                border: 'none',
                                color: '#FFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <Plus style={{ width: 16, height: 16 }} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Dishes Section Header */}
            <div ref={allDishesSectionRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 className="font-sora" style={{ fontSize: 'var(--cust-text-h2)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {selectedCategory === 'All' ? 'All Dishes' : selectedCategory} ({filteredDishes.length})
              </h2>
            </div>

            {/* Dishes Vertical List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filteredDishes.map((dish) => {
                const isAvailable = dish.is_available ?? dish.inStock ?? true;
                const isFav = favorites.has(dish.id);

                return (
                  <div
                    key={dish.id}
                    onClick={() => isAvailable && setActiveItemModal(dish)}
                    className="cust-card"
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: 12,
                      cursor: isAvailable ? 'pointer' : 'default',
                      opacity: isAvailable ? 1 : 0.5,
                      position: 'relative',
                    }}
                  >
                    <div style={{ width: 84, height: 84, borderRadius: 'var(--radius-card)', overflow: 'hidden', flexShrink: 0, position: 'relative', background: '#1C1410' }}>
                      <img src={dish.image_url || dish.image} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {!isAvailable && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,20,16,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--accent-red)', textTransform: 'uppercase' }}>Sold Out</span>
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                          <h3 className="font-sora" style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {dish.name}
                          </h3>
                          <button
                            onClick={(e) => toggleFavorite(e, dish.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            <Heart style={{ width: 14, height: 14, color: isFav ? 'var(--favorite-red)' : 'var(--text-secondary)', fill: isFav ? 'var(--favorite-red)' : 'transparent' }} />
                          </button>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {dish.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                        <span className="font-sora" style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent-orange)' }}>
                          ₹{dish.price.toFixed(2)}
                        </span>

                        {isAvailable ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(dish, 1);
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-pill)',
                              background: 'var(--accent-orange)',
                              border: 'none',
                              color: '#FFF',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              cursor: 'pointer',
                            }}
                          >
                            <Plus style={{ width: 14, height: 14 }} /> Add
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-red)', fontWeight: 600 }}>Sold Out</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredDishes.length === 0 && (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '0.875rem' }}>Nothing found in {selectedCategory}.</p>
                </div>
              )}
            </div>

            {/* Sticky Floating Cart Bar */}
            {totalCartQty > 0 && (
              <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: 448, zIndex: 40 }}>
                <button
                  onClick={() => setActiveTab('cart')}
                  className="font-sora animate-pop"
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--accent-orange)',
                    color: '#FFFFFF',
                    border: 'none',
                    boxShadow: '0 8px 24px rgba(255,138,52,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShoppingBag style={{ width: 20, height: 20 }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                      {totalCartQty} {totalCartQty === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700 }}>
                      View Cart · ₹{cartSubtotal.toFixed(2)}
                    </span>
                    <ArrowRight style={{ width: 18, height: 18 }} />
                  </div>
                </button>
              </div>
            )}
          </>
        )}

        {/* -------------------- CART TAB -------------------- */}
        {activeTab === 'cart' && (
          <div style={{ paddingTop: 10 }}>
            <h2 className="font-sora" style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              Your Cart
            </h2>

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 16px', background: 'var(--surface)', borderRadius: 'var(--radius-card)' }}>
                <ShoppingBag style={{ width: 48, height: 48, color: 'var(--text-secondary)', margin: '0 auto 12px' }} />
                <h3 className="font-sora" style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Your cart is empty
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                  Tap a dish from the menu to add it to your order.
                </p>
                <button
                  onClick={() => setActiveTab('menu')}
                  style={{ padding: '10px 24px', borderRadius: 'var(--radius-pill)', background: 'var(--accent-orange)', border: 'none', color: '#FFF', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Cart Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {cart.map((item) => (
                    <div key={item.id} className="cust-card" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                      <img src={item.image_url} alt={item.name} style={{ width: 60, height: 60, borderRadius: 'var(--radius-card)', objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 className="font-sora" style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                          {item.name}
                        </h4>
                        <p className="font-sora" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-orange)', margin: 0 }}>
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-raised)', padding: '4px 8px', borderRadius: 'var(--radius-pill)' }}>
                        <button
                          onClick={() => updateCartQuantity(item.id, -1)}
                          style={{ width: 24, height: 24, borderRadius: '50%', background: 'transparent', border: 'none', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <Minus style={{ width: 12, height: 12 }} />
                        </button>
                        <span className="font-sora" style={{ fontSize: '0.875rem', fontWeight: 700, minWidth: 16, textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.id, 1)}
                          style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-orange)', border: 'none', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <Plus style={{ width: 12, height: 12 }} />
                        </button>
                      </div>

                      <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: 4 }}>
                        <Trash2 style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Promo Code & Tip */}
                <div className="cust-card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Promo Code (SAVOUR20)"
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-raised)', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', fontSize: '0.875rem', outline: 'none' }}
                    />
                    <button onClick={handleApplyCoupon} style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-raised)', border: '1px solid var(--accent-orange)', color: 'var(--accent-orange)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                      Apply
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Tip Staff:</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[0, 20, 50].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setTipAmount(amt)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-pill)',
                            fontSize: '0.75rem',
                            fontWeight: tipAmount === amt ? 700 : 500,
                            background: tipAmount === amt ? 'var(--accent-orange)' : 'var(--surface-raised)',
                            color: tipAmount === amt ? '#FFF' : 'var(--text-secondary)',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {amt === 0 ? 'None' : `₹${amt}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bill Breakdown */}
                <div className="cust-card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    <span>Subtotal</span>
                    <span>₹{cartSubtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--accent-red)', marginBottom: 8 }}>
                      <span>Discount ({appliedCoupon})</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    <span>Taxes (8%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  {tipAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                      <span>Staff Tip</span>
                      <span>₹{tipAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <span>Grand Total</span>
                    <span className="font-sora" style={{ color: 'var(--accent-orange)' }}>
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Send Order to Kitchen Button */}
                <button
                  onClick={handleSendToKitchen}
                  disabled={isSubmitting}
                  className="font-sora"
                  style={{
                    width: '100%',
                    height: 52,
                    borderRadius: 'var(--radius-button)',
                    background: 'var(--accent-orange)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 8px 24px rgba(255,138,52,0.4)',
                  }}
                >
                  {isSubmitting ? 'Sending Order...' : 'Send Order to Kitchen'}
                  {!isSubmitting && <ArrowRight style={{ width: 20, height: 20 }} />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* -------------------- ORDER STATUS TAB -------------------- */}
        {activeTab === 'status' && (
          <div style={{ paddingTop: 10 }}>
            <h2 className="font-sora" style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              Track Your Orders
            </h2>

            {tableOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 16px', background: 'var(--surface)', borderRadius: 'var(--radius-card)' }}>
                <Clock style={{ width: 48, height: 48, color: 'var(--text-secondary)', margin: '0 auto 12px' }} />
                <h3 className="font-sora" style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  No Orders Placed Yet
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                  Place an order from the menu to track its preparation status.
                </p>
                <button
                  onClick={() => setActiveTab('menu')}
                  style={{ padding: '10px 24px', borderRadius: 'var(--radius-pill)', background: 'var(--accent-orange)', border: 'none', color: '#FFF', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  Go to Menu
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {tableOrders.map((ticket) => {
                  const dateStr = new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div key={ticket.id} className="cust-card animate-pop" style={{ padding: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 14, marginBottom: 16 }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                            Ticket #{ticket.orderNumber} · {dateStr}
                          </span>
                          <h3 className="font-sora" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                            Order Status
                          </h3>
                        </div>
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 700,
                          color: ticket.status === 'completed' || ticket.status === 'served' ? '#34D399' : 'var(--accent-orange)',
                          background: ticket.status === 'completed' || ticket.status === 'served' ? 'rgba(52,211,153,0.12)' : 'rgba(255,138,52,0.15)',
                          padding: '4px 10px', borderRadius: 'var(--radius-pill)', textTransform: 'uppercase'
                        }}>
                          {ticket.status}
                        </span>
                      </div>

                      {/* Progress Stepper for placed/preparing/ready/served */}
                      {ticket.status !== 'cancelled' && ticket.status !== 'completed' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', paddingLeft: 24, marginBottom: 20 }}>
                          <div style={{ position: 'absolute', left: 9, top: 8, bottom: 8, width: 2, background: 'rgba(255,255,255,0.06)' }} />
                          
                          {[
                            { key: 'placed', label: 'Order Received' },
                            { key: 'accepted', label: 'Accepted by Kitchen' },
                            { key: 'preparing', label: 'Chef Preparing' },
                            { key: 'ready', label: 'Ready for Serving' },
                            { key: 'served', label: 'Served to Table' },
                          ].map((step, idx) => {
                            const statusSequence: OrderStatus[] = ['placed', 'accepted', 'preparing', 'ready', 'served', 'completed'];
                            const currentIdx = statusSequence.indexOf(ticket.status);
                            const isDone = idx < currentIdx;
                            const isActive = idx === currentIdx;

                            return (
                              <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
                                <div
                                  style={{
                                    position: 'absolute',
                                    left: -20,
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    background: isActive ? 'var(--accent-orange)' : isDone ? '#2E7D32' : 'var(--surface-raised)',
                                    border: isActive || isDone ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#FFF',
                                  }}
                                >
                                  {isDone && <Check style={{ width: 12, height: 12, strokeWidth: 3 }} />}
                                  {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFF' }} />}
                                </div>
                                <span
                                  className="font-sora"
                                  style={{
                                    fontSize: '0.8rem',
                                    fontWeight: isActive ? 700 : 500,
                                    color: isActive ? 'var(--accent-orange)' : isDone ? 'var(--text-primary)' : 'var(--text-secondary)',
                                  }}
                                >
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Items row list */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                        <h4 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6, fontWeight: 700 }}>
                          Items
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {ticket.items.map((i, index) => (
                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                              <span>{i.qty}x {i.name}</span>
                              <span className="font-sora" style={{ fontWeight: 600 }}>₹{(i.price * i.qty).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        {ticket.specialInstructions && (
                          <p style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--accent-orange)', background: 'rgba(255,138,52,0.06)', padding: '6px 10px', borderRadius: 8 }}>
                            Dietary request: {ticket.specialInstructions}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* -------------------- GAMES TAB -------------------- */}
        {activeTab === 'games' && (
          <div style={{ paddingTop: 10 }}>
            <SpinWheelGame />
          </div>
        )}

        </div>{/* close padding wrapper div */}
      </div>{/* close maxWidth wrapper */}

      {/* -------------------- FIXED BOTTOM NAVIGATION BAR -------------------- */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'var(--surface)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          padding: '10px 16px 14px',
        }}
      >
        <div style={{ maxWidth: 440, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
          {[
            { key: 'menu', label: 'Menu', icon: Utensils },
            { key: 'cart', label: 'Cart', icon: ShoppingBag, badge: totalCartQty },
            { key: 'status', label: 'Status', icon: Clock, badge: activeOrdersCount },
            { key: 'games', label: 'Games', icon: Gift },
          ].map((nav) => {
            const Icon = nav.icon;
            const isActive = activeTab === nav.key;

            return (
              <button
                key={nav.key}
                onClick={() => setActiveTab(nav.key as any)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  background: 'none',
                  border: 'none',
                  color: isActive ? 'var(--accent-orange)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  position: 'relative',
                  padding: '4px 12px',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Icon style={{ width: 22, height: 22 }} />
                  {nav.badge != null && nav.badge > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -8,
                        minWidth: 16,
                        height: 16,
                        borderRadius: 999,
                        background: 'var(--accent-orange)',
                        color: '#FFF',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 3px',
                      }}
                    >
                      {nav.badge}
                    </span>
                  )}
                </div>
                <span className="font-sora" style={{ fontSize: '0.6875rem', fontWeight: isActive ? 700 : 500 }}>
                  {nav.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Item Detail Sheet Modal */}
      <FoodDetailModal item={activeItemModal} onClose={() => setActiveItemModal(null)} />
    </div>
  );
};
