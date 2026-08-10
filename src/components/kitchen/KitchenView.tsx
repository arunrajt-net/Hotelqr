import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import type { OrderStatus, Order } from '../../types';
import { Clock, RotateCcw, Volume2, Lock, ShieldCheck } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

const COLUMNS: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: 'new',       label: 'New Orders',        statuses: ['placed'] },
  { key: 'preparing', label: 'Preparing',          statuses: ['accepted', 'preparing'] },
  { key: 'ready',     label: 'Ready for Service',  statuses: ['ready'] },
];

const COL_ACCENT: Record<string, string> = {
  new:       'var(--accent-orange)',
  preparing: 'var(--accent-blue)',
  ready:     'var(--accent-green)',
};

const COL_BADGE_CLASS: Record<string, string> = {
  new:       'badge badge-new',
  preparing: 'badge badge-preparing',
  ready:     'badge badge-ready',
};

export const KitchenView: React.FC = () => {
  const { orders, updateOrderStatus, undoOrderStatus } = useStore();
  const [pinInput, setPinInput]         = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput === '0000') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid Staff PIN (Try 1234)');
    }
  };

  /* ── PIN Lock Screen ── */
  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: 'var(--bg-base)',
        }}
        className="font-inter"
      >
        <div
          style={{
            width: '100%',
            maxWidth: 380,
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-card)',
            padding: 36,
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'rgba(255,138,52,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <Lock style={{ width: 28, height: 28, color: 'var(--accent-orange)' }} />
          </div>
          <h2 className="font-sora" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Kitchen Station
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 28 }}>
            Enter your 4-digit staff PIN to access the board
          </p>
          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1.5rem',
                textAlign: 'center',
                letterSpacing: '0.5em',
                borderRadius: 'var(--radius-button)',
                border: '1px solid var(--border-default)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                outline: 'none',
                marginBottom: 16,
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-orange)')}
              onBlur={(e)  => (e.target.style.borderColor = 'var(--border-default)')}
            />
            <button
              type="submit"
              className="font-sora"
              style={{
                width: '100%', padding: 14,
                borderRadius: 'var(--radius-button)',
                background: 'var(--accent-orange)',
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 700, fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(255,138,52,0.35)',
              }}
            >
              Access Kitchen Board
            </button>
          </form>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter((o) =>
    !o.isMock && ['placed', 'accepted', 'preparing', 'ready'].includes(o.status)
  );

  const getElapsedBadge = (createdAt: number) => {
    const mins = Math.floor((now - createdAt) / 60000);
    let color = 'var(--accent-green)';
    let bg    = 'rgba(76,175,114,0.15)';
    if (mins >= 10) { color = 'var(--accent-red)';   bg = 'rgba(229,72,77,0.15)'; }
    else if (mins >= 5) { color = 'var(--accent-amber)'; bg = 'rgba(217,166,46,0.15)'; }
    return (
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '4px 10px', borderRadius: 'var(--radius-pill)',
          background: bg, color,
          fontSize: '0.75rem', fontWeight: 700,
        }}
      >
        <Clock style={{ width: 12, height: 12 }} />
        {mins}m
      </span>
    );
  };

  const advanceStatus = (ticket: Order) => {
    if      (ticket.status === 'placed')    updateOrderStatus(ticket.id, 'accepted');
    else if (ticket.status === 'accepted')  updateOrderStatus(ticket.id, 'preparing');
    else if (ticket.status === 'preparing') updateOrderStatus(ticket.id, 'ready');
    else if (ticket.status === 'ready')     updateOrderStatus(ticket.id, 'served');
  };

  const getActionLabel = (status: OrderStatus) => {
    if (status === 'placed')                    return 'Accept Order';
    if (status === 'accepted' || status === 'preparing') return 'Mark Ready';
    return 'Mark Served';
  };

  return (
    <div
      style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '0 0 40px' }}
      className="font-inter"
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,138,52,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ShieldCheck style={{ width: 20, height: 20, color: 'var(--accent-orange)' }} />
          </div>
          <div>
            <h1 className="font-sora" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
              Kitchen Display Station
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Real-time order stream · Auto-sync active
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--radius-pill)', background: 'rgba(76,175,114,0.12)', border: '1px solid rgba(76,175,114,0.2)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', display: 'block' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-green)' }}>LIVE</span>
          </div>

          <button
            onClick={() => sounds.playNewOrderBell()}
            style={{
              padding: '8px 14px', borderRadius: 'var(--radius-pill)',
              background: 'transparent',
              border: '1px solid var(--border-default)',
              fontSize: '0.75rem', fontWeight: 600,
              color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer',
            }}
          >
            <Volume2 style={{ width: 14, height: 14 }} /> Test Chime
          </button>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="font-sora"
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-pill)',
              background: 'var(--accent-orange)',
              border: 'none',
              fontSize: '0.75rem', fontWeight: 700,
              color: '#FFFFFF',
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255,138,52,0.3)',
            }}
          >
            <Lock style={{ width: 12, height: 12 }} /> Lock Station
          </button>
        </div>
      </div>

      {/* ── Kanban Board ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: '0 24px' }}>
        {COLUMNS.map((col) => {
          const colOrders = activeOrders.filter((o) => col.statuses.includes(o.status));
          const accent = COL_ACCENT[col.key];

          return (
            <div key={col.key} className="kitchen-col">
              {/* Column Header */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingBottom: 12,
                  borderBottom: `2px solid ${accent}`,
                }}
              >
                <span className="font-sora" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                  {col.label}
                </span>
                <span
                  className={COL_BADGE_CLASS[col.key]}
                  style={{ fontSize: '0.75rem' }}
                >
                  {colOrders.length}
                </span>
              </div>

              {/* Empty State */}
              {colOrders.length === 0 && (
                <div style={{ padding: '48px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No active tickets
                </div>
              )}

              {/* Ticket Cards */}
              {colOrders.map((ticket) => {
                const isNew = ticket.status === 'placed';
                const ticketClass = `kitchen-ticket${ticket.status === 'preparing' || ticket.status === 'accepted' ? ' preparing' : ticket.status === 'ready' ? ' ready' : ''}`;

                return (
                  <div
                    key={ticket.id}
                    className={`${ticketClass}${isNew ? ' animate-ticket-new' : ''}`}
                  >
                    {/* Ticket Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span className="font-sora" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Table {ticket.table_id}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 8 }}>
                          #{ticket.orderNumber}
                        </span>
                      </div>
                      {getElapsedBadge(ticket.created_at)}
                    </div>

                    {/* Item List */}
                    <div
                      style={{
                        display: 'flex', flexDirection: 'column', gap: 6,
                        borderTop: '1px solid var(--border-subtle)', paddingTop: 10,
                      }}
                    >
                      {ticket.items.map((item, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: '0.9375rem' }}>
                            <span className="font-sora" style={{ fontWeight: 700, color: 'var(--accent-orange)' }}>
                              {item.qty}×
                            </span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {item.name}
                            </span>
                          </div>
                          {item.notes && (
                            <p
                              style={{
                                fontSize: '0.75rem',
                                background: 'rgba(229,72,77,0.12)',
                                color: 'var(--accent-red)',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-sm)',
                                marginTop: 3,
                                fontWeight: 500,
                              }}
                            >
                              {item.notes}
                            </p>
                          )}
                        </div>
                      ))}
                      {ticket.specialInstructions && (
                        <p
                          style={{
                            fontSize: '0.75rem',
                            background: 'rgba(229,72,77,0.12)',
                            color: 'var(--accent-red)',
                            padding: '6px 8px',
                            borderRadius: 'var(--radius-sm)',
                            marginTop: 4,
                          }}
                        >
                          ⚠ {ticket.specialInstructions}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div
                      style={{
                        display: 'flex', gap: 8,
                        paddingTop: 10,
                        borderTop: '1px solid var(--border-subtle)',
                      }}
                    >
                      <button
                        onClick={() => advanceStatus(ticket)}
                        className="font-sora"
                        style={{
                          flex: 1, minHeight: 42,
                          borderRadius: 'var(--radius-pill)',
                          background: accent,
                          border: 'none',
                          color: '#FFFFFF',
                          fontSize: '0.875rem', fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: `0 4px 12px rgba(0,0,0,0.3)`,
                        }}
                      >
                        {getActionLabel(ticket.status)}
                      </button>

                      <button
                        onClick={() => undoOrderStatus(ticket.id)}
                        title="Undo status"
                        style={{
                          width: 42, minHeight: 42,
                          borderRadius: 'var(--radius-pill)',
                          background: 'transparent',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-secondary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <RotateCcw style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
