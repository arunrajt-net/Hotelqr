import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { IndianRupee, ShoppingBag, Users, QrCode, Check, Edit2, Search, TrendingUp, Plus, X, Save, Upload, Calendar } from 'lucide-react';
import { QrGeneratorModal } from './QrGeneratorModal';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

/* ── Helpers ── */
const statusBadgeClass: Record<string, string> = {
  placed:    'badge badge-placed',
  accepted:  'badge badge-accepted',
  preparing: 'badge badge-preparing',
  ready:     'badge badge-ready',
  served:    'badge badge-served',
  completed: 'badge badge-completed',
  cancelled: 'badge badge-cancelled',
};

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 'var(--radius-button)',
  background: 'var(--surface)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

export const AdminView: React.FC = () => {
  const { orders, menuItems, toggleMenuItemStock, updateMenuItemPrice, tables, updateOrderStatus, addMenuItem, updateMenuItem, updateOrderTable } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'menu' | 'tables'>('overview');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedTableForQr, setSelectedTableForQr] = useState('T-04');

  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);

  // Date Range Filter State for Sales & Analytics
  const [timeRange, setTimeRange] = useState<'today' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Full dish edit modal state
  const [editingItem, setEditingItem] = useState<null | { id: string; name: string; categoryName: string; price: number; description: string; image_url: string; is_veg: boolean; spice_level?: 'none' | 'mild' | 'spicy' }>(null);

  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Mains');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemVeg, setNewItemVeg] = useState(false);
  const [newItemSpice, setNewItemSpice] = useState<'none' | 'mild' | 'spicy'>('none');
  const [newItemImage, setNewItemImage] = useState('');

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tableFilter, setTableFilter]   = useState<string>('all');
  const [searchQuery, setSearchQuery]   = useState('');

  const analyticsOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((o) => {
      if (o.status === 'cancelled') return false;
      const d = new Date(o.created_at);

      if (timeRange === 'today') {
        const isSameDay = (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
        const isWithin24Hours = (now.getTime() - d.getTime()) <= 24 * 60 * 60 * 1000 && d <= now;
        return isSameDay || isWithin24Hours;
      }
      if (timeRange === 'weekly') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return d >= sevenDaysAgo;
      }
      if (timeRange === 'monthly') {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }
      if (timeRange === 'yearly') {
        return d.getFullYear() === now.getFullYear();
      }
      if (timeRange === 'custom') {
        if (customStartDate) {
          const start = new Date(customStartDate);
          if (d < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (d > end) return false;
        }
        return true;
      }
      return true;
    });
  }, [orders, timeRange, customStartDate, customEndDate]);

  const todayStats = useMemo(() => {
    const todayRevenue = analyticsOrders.reduce((sum, o) => sum + o.total, 0);
    const todayCount   = analyticsOrders.length;
    const avgValue     = todayCount > 0 ? todayRevenue / todayCount : 0;
    return { todayRevenue, todayCount, avgValue };
  }, [analyticsOrders]);

  const topSellingItems = useMemo(() => {
    const counts: Record<string, { name: string; qty: number; revenue: number }> = {};
    analyticsOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!counts[item.name]) counts[item.name] = { name: item.name, qty: 0, revenue: 0 };
        counts[item.name].qty     += item.qty;
        counts[item.name].revenue += item.price * item.qty;
      });
    });
    return Object.values(counts).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [analyticsOrders]);

  // ── REAL hourly / period revenue ──
  const revenueChartData = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();

    const HOURS = [8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
    const LABELS = ['8 AM','9 AM','10 AM','11 AM','12 PM','1 PM','2 PM',
                    '3 PM','4 PM','5 PM','6 PM','7 PM','8 PM','9 PM','10 PM','11 PM'];

    const hourlyRevenue: Record<number, number> = {};
    HOURS.forEach(h => { hourlyRevenue[h] = 0; });

    analyticsOrders.forEach(order => {
      const d = new Date(order.created_at);
      const h = d.getHours();
      if (h >= 8 && h <= 23) {
        hourlyRevenue[h] = (hourlyRevenue[h] || 0) + order.total;
      } else {
        hourlyRevenue[12] = (hourlyRevenue[12] || 0) + order.total; // Default bucket fallback
      }
    });

    return HOURS.map((h, i) => ({
      time:    LABELS[i],
      revenue: Math.round(hourlyRevenue[h] * 100) / 100,
      future:  timeRange === 'today' && h > currentHour,
      noData:  hourlyRevenue[h] === 0,
    }));
  }, [analyticsOrders, timeRange]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (tableFilter  !== 'all' && o.table_id !== tableFilter)  return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          o.orderNumber.includes(q) ||
          o.table_id.toLowerCase().includes(q) ||
          (o.customerName && o.customerName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [orders, statusFilter, tableFilter, searchQuery]);

  const handleSavePrice = (itemId: string) => {
    if (tempPrice > 0) updateMenuItemPrice(itemId, tempPrice);
    setEditingPriceId(null);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice) return;
    addMenuItem({
      name: newItemName,
      categoryName: newItemCategory,
      category_id: `cat-${newItemCategory.toLowerCase().replace(/\s+/g, '-')}`,
      price: parseFloat(newItemPrice),
      description: newItemDesc || "Chef's special creation.",
      image_url: newItemImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
      is_veg: newItemVeg,
      spice_level: newItemSpice,
      is_available: true,
      inStock: true,
      is_bestseller: false,
    });
    setNewItemName(''); setNewItemCategory('Mains'); setNewItemPrice('');
    setNewItemDesc(''); setNewItemVeg(false); setNewItemSpice('none'); setNewItemImage('');
    setIsAddItemOpen(false);
  };

  const handleOpenQrForTable = (tableId: string) => {
    setSelectedTableForQr(tableId);
    setIsQrModalOpen(true);
  };

  const TABS = ['overview', 'orders', 'menu', 'tables'] as const;

  /* ── Shared chart tooltip style ── */
  const tooltipStyle = {
    background: 'var(--surface-raised)',
    borderColor: 'var(--border-default)',
    color: 'var(--text-primary)',
    borderRadius: 12,
    fontSize: '0.8rem',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingBottom: 60 }} className="font-inter">

      {/* ── Header ── */}
      <div
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '20px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-orange)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Restaurant Control Panel
            </span>
            <h1 className="font-sora" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
              Admin Dashboard
            </h1>
          </div>
          <button
            onClick={() => {
              if (confirm('Reset all orders, menu price overrides, and service requests back to realistic demo data?')) {
                localStorage.removeItem('savour_orders');
                localStorage.removeItem('savour_menu_items');
                localStorage.removeItem('savour_waiter_requests');
                window.location.reload();
              }
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(225, 80, 80, 0.15)',
              border: '1px solid rgba(225, 80, 80, 0.3)',
              color: '#FF6b6b',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(225, 80, 80, 0.25)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(225, 80, 80, 0.15)' }}
          >
            Reset Demo Data
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex', gap: 4,
            background: 'var(--surface-raised)',
            padding: 4, borderRadius: 'var(--radius-button)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="font-sora"
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-button)',
                fontSize: '0.875rem',
                fontWeight: activeTab === tab ? 700 : 500,
                color: activeTab === tab ? '#FFFFFF' : 'var(--text-secondary)',
                background: activeTab === tab ? 'var(--accent-orange)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s ease',
                boxShadow: activeTab === tab ? '0 4px 12px rgba(255,138,52,0.35)' : 'none',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div style={{ padding: '28px 32px' }}>

        {/* ══════════════ TAB 1: OVERVIEW ══════════════ */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Sales & Analytics Date Filter Bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12, padding: '14px 18px',
              background: 'var(--surface-raised)', borderRadius: 'var(--radius-card)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar style={{ width: 18, height: 18, color: 'var(--accent-orange)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Analytics Period:
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {([
                  { key: 'today', label: 'Daily (Today)' },
                  { key: 'weekly', label: 'Weekly (7 Days)' },
                  { key: 'monthly', label: 'Monthly' },
                  { key: 'yearly', label: 'Yearly' },
                  { key: 'custom', label: 'Custom Range' },
                ] as const).map((t) => {
                  const isActive = timeRange === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTimeRange(t.key)}
                      style={{
                        padding: '6px 14px', borderRadius: 999,
                        fontSize: '0.78rem', fontWeight: isActive ? 700 : 500,
                        background: isActive ? 'var(--accent-orange)' : 'var(--surface)',
                        color: isActive ? '#FFF' : 'var(--text-secondary)',
                        border: `1px solid ${isActive ? 'var(--accent-orange)' : 'rgba(255,255,255,0.08)'}`,
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {timeRange === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    style={{ ...inputStyle, padding: '4px 10px', fontSize: '0.78rem', width: 'auto' }}
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    style={{ ...inputStyle, padding: '4px 10px', fontSize: '0.78rem', width: 'auto' }}
                  />
                </div>
              )}
            </div>

            {/* Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {[
                {
                  label: "Today's Revenue",
                  value: `₹${todayStats.todayRevenue.toFixed(2)}`,
                  sub: 'Excludes cancelled orders',
                  icon: <IndianRupee style={{ width: 20, height: 20, color: 'var(--accent-orange)' }} />,
                },
                {
                  label: 'Total Orders Today',
                  value: todayStats.todayCount.toString(),
                  sub: 'Live active sessions',
                  icon: <ShoppingBag style={{ width: 20, height: 20, color: 'var(--accent-orange)' }} />,
                },
                {
                  label: 'Avg Order Value',
                  value: `₹${todayStats.avgValue.toFixed(2)}`,
                  sub: 'Per ticket average',
                  icon: <TrendingUp style={{ width: 20, height: 20, color: 'var(--accent-orange)' }} />,
                },
                {
                  label: 'Table Occupancy',
                  value: `${tables.filter((t) => t.status === 'occupied').length} / ${tables.length}`,
                  sub: `${Math.round((tables.filter((t) => t.status === 'occupied').length / Math.max(tables.length, 1)) * 100)}% occupied`,
                  icon: <Users style={{ width: 20, height: 20, color: 'var(--accent-orange)' }} />,
                },
              ].map((card) => (
                <div key={card.label} className="admin-stat-card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {card.label}
                    </span>
                    {card.icon}
                  </div>
                  <h2 className="font-sora" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {card.value}
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                    {card.sub}
                  </span>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
              <div className="admin-card" style={{ padding: 20 }}>
                <h3 className="font-sora" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Today's Hourly Revenue (₹)
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  Real orders · 8 AM – 11 PM · updates live as orders come in
                </p>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#FF8A34" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#FF8A34" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} tick={{ fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} tick={{ fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                        labelStyle={{ color: 'var(--text-secondary)', fontSize: 12 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--accent-orange)"
                        strokeWidth={2.5}
                        fill="url(#revenueGrad)"
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          if (payload.future) return <circle key={cx} cx={cx} cy={cy} r={3} fill="rgba(255,138,52,0.3)" stroke="rgba(255,138,52,0.5)" strokeWidth={1} strokeDasharray="2" />;
                          return <circle key={cx} cx={cx} cy={cy} r={3} fill="var(--accent-orange)" stroke="#1C1410" strokeWidth={1.5} />;
                        }}
                        activeDot={{ r: 6, fill: 'var(--accent-orange)', stroke: '#FFF', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="admin-card" style={{ padding: 20 }}>
                <h3 className="font-sora" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
                  Top 5 Best-Selling Dishes
                </h3>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topSellingItems}>
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tick={{ width: 80 }} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="qty" fill="var(--accent-orange)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB 2: ORDERS ══════════════ */}
        {activeTab === 'orders' && (
          <div className="admin-card" style={{ padding: 24 }}>
            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <h3 className="font-sora" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Order Logs <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>({filteredOrders.length})</span>
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-secondary)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search orders…"
                    style={{ ...inputStyle, paddingLeft: 36, width: 200 }}
                  />
                </div>

                {/* Status Filter */}
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...selectStyle, width: 'auto' }}>
                  <option value="all">All Statuses</option>
                  <option value="placed">Placed</option>
                  <option value="accepted">Accepted</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="served">Served</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {/* Table Filter */}
                <select value={tableFilter} onChange={(e) => setTableFilter(e.target.value)} style={{ ...selectStyle, width: 'auto' }}>
                  <option value="all">All Tables</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>Table {t.id}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {['Ticket #', 'Table', 'Time', 'Items', 'Status', 'Total', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        No orders match your filters
                      </td>
                    </tr>
                  )}
                  {filteredOrders.map((o, idx) => (
                    <tr
                      key={o.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <td className="font-sora" style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--accent-orange)' }}>
                        #{o.orderNumber}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <select
                          value={o.table_id}
                          onChange={(e) => updateOrderTable && updateOrderTable(o.id, e.target.value)}
                          style={{
                            background: 'var(--surface-raised)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'var(--text-primary)',
                            borderRadius: 6,
                            padding: '4px 8px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          {tables.map((t) => (
                            <option key={t.id} value={t.id} style={{ background: '#1C1410' }}>
                              {t.id}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-primary)', maxWidth: 240 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className={statusBadgeClass[o.status] ?? 'badge'}>
                          {o.status}
                        </span>
                      </td>
                      <td className="font-sora" style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{o.total.toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {o.status === 'placed' && (
                          <button
                            onClick={() => updateOrderStatus(o.id, 'cancelled')}
                            style={{
                              padding: '4px 12px',
                              borderRadius: 'var(--radius-pill)',
                              background: 'transparent',
                              border: '1px solid var(--accent-red)',
                              color: 'var(--accent-red)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        )}
                        {o.status !== 'placed' && o.status !== 'cancelled' && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>In progress</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════ TAB 3: MENU ══════════════ */}
        {activeTab === 'menu' && (
          <div className="admin-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 className="font-sora" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Menu Management
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {menuItems.length} dishes · Manage availability & prices in real-time
                </p>
              </div>
              <button
                onClick={() => setIsAddItemOpen(true)}
                className="font-sora"
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--accent-orange)',
                  border: 'none',
                  fontSize: '0.875rem', fontWeight: 700,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 4px 14px rgba(255,138,52,0.35)',
                }}
              >
                <Plus style={{ width: 16, height: 16 }} /> Add Dish
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {['Dish', 'Category', 'Price (₹)', 'Stock Status', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map((item, idx) => {
                    const inStock  = item.is_available ?? item.inStock ?? true;
                    const imageUrl = item.image_url || item.image || '';
                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {imageUrl && (
                              <img
                                src={imageUrl}
                                alt={item.name}
                                style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }}
                              />
                            )}
                            <div>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{item.name}</span>
                              {item.is_veg && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--accent-green)' }}>● Veg</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                          {item.categoryName || (item as any).category}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {editingPriceId === item.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <input
                                type="number"
                                value={tempPrice}
                                onChange={(e) => setTempPrice(parseFloat(e.target.value))}
                                style={{ width: 80, padding: '6px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-raised)', border: '1px solid var(--accent-orange)', color: 'var(--text-primary)', outline: 'none' }}
                              />
                              <button onClick={() => handleSavePrice(item.id)} style={{ background: 'none', border: 'none', color: 'var(--accent-green)', cursor: 'pointer' }}>
                                <Check style={{ width: 16, height: 16 }} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span className="font-sora" style={{ fontWeight: 700, color: 'var(--accent-orange)' }}>
                                ₹{item.price.toFixed(2)}
                              </span>
                              <button
                                onClick={() => { setEditingPriceId(item.id); setTempPrice(item.price); }}
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                              >
                                <Edit2 style={{ width: 14, height: 14 }} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div
                            onClick={() => toggleMenuItemStock(item.id)}
                            className={`cust-toggle-track${inStock ? ' active' : ''}`}
                            title={inStock ? 'Click to mark sold out' : 'Click to mark in stock'}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="cust-toggle-thumb" />
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => setEditingItem({
                              id: item.id,
                              name: item.name,
                              categoryName: item.categoryName || (item as any).category || 'Mains',
                              price: item.price,
                              description: item.description,
                              image_url: item.image_url || item.image || '',
                              is_veg: item.is_veg,
                              spice_level: item.spice_level || 'none',
                            })}
                            style={{
                              padding: '6px 14px', borderRadius: 'var(--radius-pill)',
                              background: 'rgba(255,138,52,0.1)', border: '1px solid rgba(255,138,52,0.3)',
                              color: 'var(--accent-orange)', fontSize: '0.75rem', fontWeight: 600,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <Edit2 style={{ width: 12, height: 12 }} /> Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════ TAB 4: TABLES ══════════════ */}
        {activeTab === 'tables' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h3 className="font-sora" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Dining Tables
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Generate & print QR tent cards for each table
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {tables.map((t) => {
                const isOccupied = t.status === 'occupied';
                return (
                  <div key={t.id} className="admin-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="font-sora" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Table {t.id}
                      </span>
                      <span className={isOccupied ? 'badge badge-placed' : 'badge badge-served'}>
                        {t.status}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Capacity: {t.capacity || 4} guests
                    </p>

                    <button
                      onClick={() => handleOpenQrForTable(t.id)}
                      className="font-sora"
                      style={{
                        width: '100%', padding: '10px 12px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'var(--accent-orange)',
                        border: 'none',
                        fontSize: '0.875rem', fontWeight: 700,
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        boxShadow: '0 4px 14px rgba(255,138,52,0.3)',
                      }}
                    >
                      <QrCode style={{ width: 16, height: 16 }} /> Generate QR
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ── QR Generator Modal ── */}
      <QrGeneratorModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        defaultTableId={selectedTableForQr}
      />

      {/* ── Add Dish Modal ── */}
      {isAddItemOpen && (
        <div
          onClick={() => setIsAddItemOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
          }}
          className="animate-pop"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative', width: '100%', maxWidth: 460,
              borderRadius: 'var(--radius-card)',
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-default)',
              padding: 28,
              color: 'var(--text-primary)',
              display: 'flex', flexDirection: 'column', gap: 18,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
              <h3 className="font-sora" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Add New Dish
              </h3>
              <button
                onClick={() => setIsAddItemOpen(false)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--surface)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Dish Name *
                </label>
                <input
                  type="text" required value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Garlic Butter Naan"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Category */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Category
                  </label>
                  <select value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)} style={selectStyle}>
                    <option value="Starters">Starters</option>
                    <option value="Mains">Mains</option>
                    <option value="Chef Specials">Chef Specials</option>
                    <option value="Beverages">Drinks</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>
                {/* Price */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Price (₹) *
                  </label>
                  <input
                    type="number" step="0.01" required value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="e.g. 180"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Description
                </label>
                <textarea
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="Tell customers about this dish…"
                  rows={2}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>

              {/* Image URL & Gallery Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Dish Photo (URL or Upload from Gallery)
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="url" value={newItemImage}
                    onChange={(e) => setNewItemImage(e.target.value)}
                    placeholder="https://images.unsplash.com/…"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <label style={{
                    padding: '10px 14px', borderRadius: 'var(--radius-button)',
                    background: 'var(--accent-orange)', color: '#FFF',
                    fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                    whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(255,138,52,0.3)'
                  }}>
                    <Upload style={{ width: 14, height: 14 }} /> Gallery
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setNewItemImage(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {newItemImage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    <img src={newItemImage} alt="Preview" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} />
                    <span style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 600 }}>Image Ready ✓</span>
                  </div>
                )}
              </div>

              {/* Veg Toggle & Spice Level Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    onClick={() => setNewItemVeg(!newItemVeg)}
                    className={`cust-toggle-track${newItemVeg ? ' active' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="cust-toggle-thumb" />
                  </div>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => setNewItemVeg(!newItemVeg)}>
                    Vegetarian
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)' }} />
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Spice Level
                  </label>
                  <select value={newItemSpice} onChange={(e) => setNewItemSpice(e.target.value as any)} style={selectStyle}>
                    <option value="none">🟢 No Spice / Sweet</option>
                    <option value="mild">🌶️ Mild Spice</option>
                    <option value="spicy">🔥 Spicy</option>
                  </select>
                </div>
              </div>

              {/* Submit / Cancel */}
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setIsAddItemOpen(false)}
                  style={{
                    flex: 1, padding: 12,
                    borderRadius: 'var(--radius-button)',
                    background: 'transparent',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="font-sora"
                  style={{
                    flex: 1, padding: 12,
                    borderRadius: 'var(--radius-button)',
                    background: 'var(--accent-orange)', border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(255,138,52,0.35)',
                  }}
                >
                  Create Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Full Dish Edit Modal */}
      {editingItem && (
        <div
          onClick={() => setEditingItem(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1C1410', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, padding: 24, width: '100%', maxWidth: 440,
              boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 className="font-sora" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Edit Dish</h3>
              <button onClick={() => setEditingItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dish Name</label>
                <input
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
                  <select
                    value={editingItem.categoryName}
                    onChange={(e) => setEditingItem({ ...editingItem, categoryName: e.target.value })}
                    style={selectStyle}
                  >
                    {['Starters', 'Mains', 'Desserts', 'Beverages', 'Chef Specials'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price (₹)</label>
                  <input
                    type="number"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                <textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={3}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>
              {/* Image URL & Gallery Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dish Photo (URL or Upload from Gallery)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    value={editingItem.image_url}
                    onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                    placeholder="https://..."
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <label style={{
                    padding: '10px 14px', borderRadius: 'var(--radius-button)',
                    background: 'var(--accent-orange)', color: '#FFF',
                    fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                    whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(255,138,52,0.3)'
                  }}>
                    <Upload style={{ width: 14, height: 14 }} /> Gallery
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setEditingItem({ ...editingItem, image_url: reader.result });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {editingItem.image_url && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    <img src={editingItem.image_url} alt="Preview" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} />
                    <span style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 600 }}>Image Ready ✓</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <input
                    type="checkbox"
                    checked={editingItem.is_veg}
                    onChange={(e) => setEditingItem({ ...editingItem, is_veg: e.target.checked })}
                  />
                  Vegetarian (Veg)
                </label>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Spice Level</label>
                  <select
                    value={editingItem.spice_level || 'none'}
                    onChange={(e) => setEditingItem({ ...editingItem, spice_level: e.target.value as any })}
                    style={selectStyle}
                  >
                    <option value="none">🟢 No Spice / Sweet</option>
                    <option value="mild">🌶️ Mild Spice</option>
                    <option value="spicy">🔥 Spicy</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  onClick={() => setEditingItem(null)}
                  style={{ flex: 1, padding: 12, borderRadius: 'var(--radius-button)', background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                >Cancel</button>
                <button
                  onClick={() => {
                    updateMenuItem(editingItem.id, {
                      name: editingItem.name,
                      categoryName: editingItem.categoryName,
                      price: editingItem.price,
                      description: editingItem.description,
                      image_url: editingItem.image_url,
                      is_veg: editingItem.is_veg,
                      spice_level: editingItem.spice_level,
                    });
                    setEditingItem(null);
                  }}
                  className="font-sora"
                  style={{ flex: 2, padding: 12, borderRadius: 'var(--radius-button)', background: 'var(--accent-orange)', border: 'none', color: '#FFF', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Save style={{ width: 16, height: 16 }} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
