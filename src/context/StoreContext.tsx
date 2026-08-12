import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { RoleMode, MenuItem, CartItem, Order, OrderStatus, WaiterRequest, WaiterRequestType, TableInfo } from '../types';
import { INITIAL_MENU_ITEMS, INITIAL_TABLES, INITIAL_ORDERS } from '../data/mockData';
import { sounds } from '../utils/soundEffects';

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning';
}

interface StoreContextType {
  role: RoleMode;
  setRole: (r: RoleMode) => void;
  selectedTableId: string;
  setSelectedTableId: (t: string) => void;
  menuItems: MenuItem[];
  cart: CartItem[];
  orders: Order[];
  waiterRequests: WaiterRequest[];
  tables: TableInfo[];
  toasts: ToastMessage[];
  
  // Cart Actions
  addToCart: (item: MenuItem, quantity: number, options?: any[], specialNote?: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  
  // Order Actions
  placeOrder: (specialInstructions?: string, couponApplied?: string, tipAmount?: number) => Order;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  undoOrderStatus: (orderId: string) => void;
  updateOrderTable: (orderId: string, newTableId: string) => void;
  
  // Waiter Request Actions
  createWaiterRequest: (type: WaiterRequestType, label: string) => void;
  resolveWaiterRequest: (requestId: string) => void;
  
  // Admin & Menu Actions
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  toggleMenuItemStock: (id: string) => void;
  updateMenuItemPrice: (id: string, newPrice: number) => void;
  addToast: (title: string, message: string, type?: 'info' | 'success' | 'warning') => void;
  removeToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const BROADCAST_CHANNEL_NAME = 'savour_os_sync_v2';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<RoleMode>('customer');
  const [selectedTableId, setSelectedTableIdState] = useState<string>('T-04');
  
  // Initial state loaded from LocalStorage or default mock data
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('savour_menu_items');
    return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('savour_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('savour_orders');
    const parsed: Order[] = saved ? JSON.parse(saved) : INITIAL_ORDERS;
    return parsed.map((o) =>
      o.isMock && ['placed', 'accepted', 'preparing', 'ready'].includes(o.status)
        ? { ...o, status: 'completed' as const }
        : o
    );
  });

  const [waiterRequests, setWaiterRequests] = useState<WaiterRequest[]>(() => {
    const saved = localStorage.getItem('savour_waiter_requests');
    return saved ? JSON.parse(saved) : [];
  });

  const [tables, setTables] = useState<TableInfo[]>(INITIAL_TABLES);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persist State to LocalStorage
  useEffect(() => {
    localStorage.setItem('savour_menu_items', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('savour_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('savour_waiter_requests', JSON.stringify(waiterRequests));
  }, [waiterRequests]);

  const CLOUD_ORDERS_URL = 'https://savour-hotel.asia-southeast1.firebasedatabase.app/orders';
  const CLOUD_REQUESTS_URL = 'https://savour-hotel.asia-southeast1.firebasedatabase.app/requests';

  // Push individual order to Firebase
  const pushOrderToCloud = useCallback(async (order: Order) => {
    try {
      await fetch(`${CLOUD_ORDERS_URL}/${order.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
    } catch {
      // Ignore network errors
    }
  }, []);

  // Push individual request to Firebase
  const pushWaiterRequestToCloud = useCallback(async (req: WaiterRequest) => {
    try {
      await fetch(`${CLOUD_REQUESTS_URL}/${req.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
    } catch {
      // Ignore
    }
  }, []);

  // Delete individual request from Firebase
  const deleteWaiterRequestFromCloud = useCallback(async (requestId: string) => {
    try {
      await fetch(`${CLOUD_REQUESTS_URL}/${requestId}.json`, {
        method: 'DELETE',
      });
    } catch {
      // Ignore
    }
  }, []);

  // Poll Firebase Realtime Database every 2 seconds for real-time cross-device sync
  useEffect(() => {
    const syncFromCloud = async () => {
      try {
        // 1. Sync orders
        const ordersRes = await fetch(`${CLOUD_ORDERS_URL}.json`);
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          const cloudOrders: Order[] = ordersData ? Object.values(ordersData) : [];
          if (cloudOrders.length > 0) {
            setOrders((prev) => {
              let updated = false;
              const merged = [...prev];
              cloudOrders.forEach((co) => {
                const idx = merged.findIndex((o) => o.id === co.id);
                if (idx === -1) {
                  merged.push(co);
                  updated = true;
                } else {
                  const localOrder = merged[idx];
                  const cloudTime = co.updated_at || co.created_at || 0;
                  const localTime = localOrder.updated_at || localOrder.created_at || 0;
                  if (localOrder.status !== co.status || cloudTime > localTime || localOrder.table_id !== co.table_id) {
                    merged[idx] = co;
                    updated = true;
                  }
                }
              });
              if (updated) {
                merged.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
                localStorage.setItem('savour_orders', JSON.stringify(merged));
                return merged;
              }
              return prev;
            });
          }
        }

        // 2. Sync waiter requests
        const requestsRes = await fetch(`${CLOUD_REQUESTS_URL}.json`);
        if (requestsRes.ok) {
          const requestsData = await requestsRes.json();
          const cloudRequests: WaiterRequest[] = requestsData ? Object.values(requestsData) : [];
          setWaiterRequests((prev) => {
            const sortedCloud = [...cloudRequests].sort((a, b) => b.createdAt - a.createdAt);
            if (JSON.stringify(prev) !== JSON.stringify(sortedCloud)) {
              localStorage.setItem('savour_waiter_requests', JSON.stringify(sortedCloud));
              return sortedCloud;
            }
            return prev;
          });
        }
      } catch {
        // Ignore fetch errors
      }
    };

    syncFromCloud();
    const interval = setInterval(syncFromCloud, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('savour_orders', JSON.stringify(orders));
  }, [orders]);

  // Broadcast Channel setup for Instant Cross-Tab Sync
  const broadcastSync = useCallback((event: { type: string; payload: any }) => {
    try {
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channel.postMessage(event);
        channel.close();
      }
    } catch {
      // Fallback ignore
    }
  }, []);

  useEffect(() => {
    if (!('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

    channel.onmessage = (e) => {
      const { type, payload } = e.data || {};
      if (type === 'NEW_ORDER') {
        setOrders((prev) => {
          if (prev.some((o) => o.id === payload.id)) return prev;
          return [payload, ...prev];
        });
        sounds.playNewOrderBell();
        setToasts((t) => [
          ...t,
          { id: Date.now().toString(), title: `🔔 New Ticket #${payload.orderNumber}`, message: `Table ${payload.table_id} sent a ticket to the kitchen!`, type: 'info' }
        ]);
      } else if (type === 'UPDATE_ORDER_STATUS') {
        setOrders((prev) =>
          prev.map((o) => (o.id === payload.orderId ? { ...o, status: payload.newStatus, updated_at: Date.now(), status_history: payload.status_history } : o))
        );
        if (payload.newStatus === 'ready') {
          sounds.playOrderReadyMelody();
        }
      } else if (type === 'UPDATE_ORDER_TABLE') {
        setOrders((prev) =>
          prev.map((o) => (o.id === payload.orderId ? { ...o, table_id: payload.newTableId, table_number: payload.newTableNumber } : o))
        );
      } else if (type === 'WAITER_REQUEST') {
        setWaiterRequests((prev) => [payload, ...prev]);
        sounds.playWaiterCallChime();
        setToasts((t) => [
          ...t,
          { id: Date.now().toString(), title: `👋 Service Call (${payload.tableId})`, message: payload.label, type: 'warning' }
        ]);
      } else if (type === 'RESOLVE_WAITER_REQUEST') {
        setWaiterRequests((prev) => prev.filter((r) => r.id !== payload.requestId));
      } else if (type === 'MENU_UPDATE') {
        setMenuItems(payload);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  const addToast = useCallback((title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 5);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setRole = useCallback((r: RoleMode) => {
    setRoleState(r);
    addToast('Mode Switch', `Switched view to ${r.toUpperCase()} surface`, 'info');
  }, [addToast]);

  const setSelectedTableId = useCallback((t: string) => {
    setSelectedTableIdState(t);
  }, []);

  // Cart calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = (item: MenuItem, quantity: number, options: any[] = [], specialNote: string = '') => {
    const extraPrice = options.reduce((sum, opt) => sum + opt.extraPrice, 0);
    const finalUnitPrice = item.price + extraPrice;

    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(
        (ci) => ci.menuItemId === item.id && JSON.stringify(ci.options) === JSON.stringify(options) && ci.specialNote === specialNote
      );

      if (existingIdx > -1) {
        const updated = [...prevCart];
        updated[existingIdx].quantity += quantity;
        return updated;
      } else {
        const newItem: CartItem = {
          id: `cart-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
          menuItemId: item.id,
          name: item.name,
          price: finalUnitPrice,
          basePrice: item.price,
          quantity,
          image_url: item.image_url || item.image || '',
          is_veg: item.is_veg,
          options,
          specialNote
        };
        return [...prevCart, newItem];
      }
    });

    addToast('Added to ticket', `${quantity}x ${item.name} added`, 'success');
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Place Order
  const placeOrder = (specialInstructions: string = '', couponApplied: string = '', tipAmount: number = 0) => {
    if (cart.length === 0) throw new Error('Ticket is empty');

    let discount = 0;
    if (couponApplied === 'SAVOUR20') {
      discount = cartSubtotal * 0.2;
    } else if (couponApplied === 'WELCOME10') {
      discount = Math.min(10, cartSubtotal);
    }

    const discountedSubtotal = cartSubtotal - discount;
    const tax = discountedSubtotal * 0.08;
    const total = Math.max(0, discountedSubtotal + tax + tipAmount);
    const orderNum = Math.floor(1000 + Math.random() * 9000).toString();
    const tableNum = parseInt(selectedTableId.replace(/\D/g, ''), 10) || 1;
    const timestamp = Date.now();

    const newOrder: Order = {
      id: `ORD-${orderNum}`,
      orderNumber: orderNum,
      table_id: selectedTableId,
      table_number: tableNum,
      customerName: `Guest (${selectedTableId})`,
      items: cart.map((ci) => ({
        menu_item_id: ci.menuItemId,
        name: ci.name,
        qty: ci.quantity,
        price: ci.price,
        options: ci.options,
        notes: ci.specialNote,
        is_veg: ci.is_veg
      })),
      subtotal: cartSubtotal,
      discount,
      tax,
      tip: tipAmount,
      total,
      status: 'placed',
      created_at: timestamp,
      updated_at: timestamp,
      status_history: [
        { status: 'placed', changed_at: timestamp }
      ],
      specialInstructions,
      couponApplied
    };

    setOrders((prev) => [newOrder, ...prev]);
    pushOrderToCloud(newOrder);
    clearCart();

    // Mark table active order
    setTables((prev) =>
      prev.map((t) => (t.id === selectedTableId ? { ...t, status: 'occupied', active_order_id: newOrder.id } : t))
    );

    // Broadcast to kitchen & admin
    broadcastSync({ type: 'NEW_ORDER', payload: newOrder });

    addToast('Ticket sent!', `Ticket sent to the kitchen.`, 'success');
    sounds.playNewOrderBell();
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const timestamp = Date.now();
    let updatedHistory: any[] = [];
    let updatedOrder: Order | null = null;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const history = o.status_history || [];
          updatedHistory = [...history, { status: newStatus, changed_at: timestamp }];
          updatedOrder = {
            ...o,
            status: newStatus,
            updated_at: timestamp,
            status_history: updatedHistory
          };
          return updatedOrder;
        }
        return o;
      })
    );

    setTimeout(() => {
      if (updatedOrder) {
        pushOrderToCloud(updatedOrder);
      }
    }, 0);

    broadcastSync({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, newStatus, status_history: updatedHistory } });

    if (newStatus === 'ready') {
      sounds.playOrderReadyMelody();
      addToast('Kitchen Alert', `Order ${orderId} is READY for service!`, 'success');
    }
  };

  const undoOrderStatus = (orderId: string) => {
    const statusSequence: OrderStatus[] = ['placed', 'accepted', 'preparing', 'ready', 'served', 'completed'];
    let updatedOrder: Order | null = null;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const currentIdx = statusSequence.indexOf(o.status);
          if (currentIdx > 0) {
            const prevStatus = statusSequence[currentIdx - 1];
            const newHistory = (o.status_history || []).slice(0, -1);
            updatedOrder = {
              ...o,
              status: prevStatus,
              updated_at: Date.now(),
              status_history: newHistory
            };
            return updatedOrder;
          }
        }
        return o;
      })
    );

    setTimeout(() => {
      if (updatedOrder) {
        pushOrderToCloud(updatedOrder);
      }
    }, 0);
  };

  const updateOrderTable = (orderId: string, newTableId: string) => {
    const tableNumber = parseInt(newTableId.replace(/\D/g, ''), 10) || 1;
    let updatedOrder: Order | null = null;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          updatedOrder = { ...o, table_id: newTableId, table_number: tableNumber, updated_at: Date.now() };
          return updatedOrder;
        }
        return o;
      })
    );

    setTimeout(() => {
      if (updatedOrder) {
        pushOrderToCloud(updatedOrder);
      }
    }, 0);

    broadcastSync({ type: 'UPDATE_ORDER_TABLE', payload: { orderId, newTableId, newTableNumber: tableNumber } });
    addToast('Table Updated', `Order transferred to Table ${newTableId}`, 'success');
  };

  const createWaiterRequest = (type: WaiterRequestType, label: string) => {
    const req: WaiterRequest = {
      id: `req-${Date.now()}`,
      tableId: selectedTableId,
      type,
      label,
      status: 'pending',
      createdAt: Date.now()
    };

    setWaiterRequests((prev) => [req, ...prev]);
    pushWaiterRequestToCloud(req);
    broadcastSync({ type: 'WAITER_REQUEST', payload: req });
    sounds.playWaiterCallChime();
    addToast('Service Requested', `Staff notified: "${label}" for ${selectedTableId}`, 'info');
  };

  const resolveWaiterRequest = (requestId: string) => {
    setWaiterRequests((prev) => prev.filter((r) => r.id !== requestId));
    deleteWaiterRequestFromCloud(requestId);
    broadcastSync({ type: 'RESOLVE_WAITER_REQUEST', payload: { requestId } });
  };

  const toggleMenuItemStock = (id: string) => {
    setMenuItems((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          const nextVal = !(item.is_available ?? item.inStock ?? true);
          return { ...item, is_available: nextVal, inStock: nextVal };
        }
        return item;
      });
      broadcastSync({ type: 'MENU_UPDATE', payload: updated });
      return updated;
    });
  };

  const updateMenuItemPrice = (id: string, newPrice: number) => {
    setMenuItems((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, price: newPrice } : item));
      broadcastSync({ type: 'MENU_UPDATE', payload: updated });
      return updated;
    });
  };

  const addMenuItem = (newItemData: Omit<MenuItem, 'id'>) => {
    setMenuItems((prev) => {
      const newItem: MenuItem = {
        ...newItemData,
        id: `dish-${Date.now()}`
      };
      const updated = [...prev, newItem];
      broadcastSync({ type: 'MENU_UPDATE', payload: updated });
      return updated;
    });
    addToast('Item Added', `${newItemData.name} has been added to the menu`, 'success');
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      broadcastSync({ type: 'MENU_UPDATE', payload: updated });
      return updated;
    });
    addToast('Menu Updated', `Dish updated successfully`, 'success');
  };

  return (
    <StoreContext.Provider
      value={{
        role,
        setRole,
        selectedTableId,
        setSelectedTableId,
        menuItems,
        cart,
        orders,
        waiterRequests,
        tables,
        toasts,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartSubtotal,
        placeOrder,
        updateOrderStatus,
        undoOrderStatus,
        updateOrderTable,
        createWaiterRequest,
        resolveWaiterRequest,
        addMenuItem,
        updateMenuItem,
        toggleMenuItemStock,
        updateMenuItemPrice,
        addToast,
        removeToast
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
