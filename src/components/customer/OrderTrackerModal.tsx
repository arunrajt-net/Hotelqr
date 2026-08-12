import React, { useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { X, Check } from 'lucide-react';
import type { OrderStatus } from '../../types';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STAGES: { key: OrderStatus; label: string }[] = [
  { key: 'placed', label: 'Order Received' },
  { key: 'accepted', label: 'Accepted by Kitchen' },
  { key: 'preparing', label: 'Chef Preparing' },
  { key: 'ready', label: 'Ready for Serving' },
  { key: 'served', label: 'Served to Table' },
];

const getStageIndex = (status: OrderStatus) => {
  const map: Record<OrderStatus, number> = {
    placed: 0,
    accepted: 1,
    preparing: 2,
    ready: 3,
    served: 4,
    completed: 4,
    cancelled: -1,
  };
  return map[status] ?? 0;
};

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({ isOpen, onClose }) => {
  const { orders, selectedTableId } = useStore();

  useEffect(() => {
    const handleOpen = () => {};
    window.addEventListener('open-order-tracker', handleOpen);
    return () => window.removeEventListener('open-order-tracker', handleOpen);
  }, []);

  if (!isOpen) return null;

  const activeOrder = orders.find((o) => {
    if (o.table_id !== selectedTableId || o.isMock) return false;
    if (['placed', 'accepted', 'preparing', 'ready'].includes(o.status)) return true;
    if (['served', 'completed'].includes(o.status)) {
      const lastUpdated = o.updated_at || o.created_at;
      return (Date.now() - lastUpdated) <= 5 * 60 * 60 * 1000;
    }
    return false;
  });

  if (!activeOrder) {
    return (
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          padding: 20,
        }}
        className="animate-pop font-inter"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--surface-raised)', borderRadius: 'var(--radius-card)',
            border: '1px solid rgba(255,255,255,0.08)', padding: '36px 24px',
            maxWidth: 360, width: '100%', textAlign: 'center',
            color: 'var(--text-primary)',
          }}
        >
          <p className="font-sora" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No Active Orders</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
            Scan a table or place a dish from the menu to track your order.
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px', borderRadius: 'var(--radius-pill)',
              background: 'var(--accent-orange)', border: 'none',
              fontSize: '0.875rem', fontWeight: 600, color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  const isCancelled = activeOrder.status === 'cancelled';
  const currentIndex = getStageIndex(activeOrder.status);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      }}
      className="animate-pop font-inter"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          borderRadius: 'var(--radius-card)',
          padding: '24px 20px', maxWidth: 440, width: '100%',
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          background: 'var(--surface-raised)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16, marginBottom: 20,
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Table {activeOrder.table_id}
            </span>
            <h3 className="font-sora" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2, margin: 0 }}>
              Ticket #{activeOrder.orderNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--surface)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-primary)',
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Cancelled State */}
        {isCancelled ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--accent-red)' }}>
            <h4 className="font-sora" style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 6 }}>ORDER CANCELLED</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>This order was cancelled by staff or kitchen.</p>
          </div>
        ) : (
          /* Live Status Timeline Stepper */
          <div style={{ position: 'relative', paddingLeft: 24, marginBottom: 20 }}>
            <div style={{
              position: 'absolute', left: 9, top: 8, bottom: 8,
              width: 2, background: 'rgba(255,255,255,0.1)',
            }} />

            {STAGES.map((stage, i) => {
              const isDone = i < currentIndex;
              const isActive = i === currentIndex;

              return (
                <div key={stage.key} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  marginBottom: i < STAGES.length - 1 ? 16 : 0,
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', left: -20,
                    width: 20, height: 20,
                    borderRadius: '50%',
                    background: isActive ? 'var(--accent-orange)' : isDone ? '#2E7D32' : 'var(--surface)',
                    border: isDone || isActive ? 'none' : '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#FFFFFF',
                  }}>
                    {isDone && <Check style={{ width: 12, height: 12, strokeWidth: 3 }} />}
                    {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFFFFF' }} />}
                  </div>

                  <span className="font-sora" style={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--accent-orange)' : isDone ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Item Summary Breakdown */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, color: 'var(--text-secondary)' }}>
            Ticket Items ({activeOrder.items.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {activeOrder.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                <span>{item.qty}x {item.name}</span>
                <span className="font-sora">₹{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700, marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span>Total Paid</span>
            <span className="font-sora" style={{ color: 'var(--accent-orange)' }}>₹{activeOrder.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
