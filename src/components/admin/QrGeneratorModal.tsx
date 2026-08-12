import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Download, QrCode, UtensilsCrossed } from 'lucide-react';

interface QrGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTableId?: string;
}

export const QrGeneratorModal: React.FC<QrGeneratorModalProps> = ({ isOpen, onClose, defaultTableId = 'T-04' }) => {
  const [tableId, setTableId] = useState(defaultTableId);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    setTableId(defaultTableId);
  }, [defaultTableId]);

  const targetUrl = `${window.location.origin}/?table=${tableId}`;

  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(
      targetUrl,
      { width: 360, margin: 2, color: { dark: '#1C1410', light: '#FFFFFF' } },
      (err, url) => { if (!err && url) setQrDataUrl(url); }
    );
  }, [isOpen, tableId, targetUrl]);

  if (!isOpen) return null;

  const handlePrint    = () => window.print();
  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `SAVOUR_QR_${tableId}.png`;
    a.click();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
      }}
      className="animate-pop font-inter"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', width: '100%', maxWidth: 480,
          borderRadius: 'var(--radius-card)',
          background: 'var(--surface-raised)',
          border: '1px solid var(--border-default)',
          padding: 28,
          color: 'var(--text-primary)',
          display: 'flex', flexDirection: 'column', gap: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,138,52,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode style={{ width: 20, height: 20, color: 'var(--accent-orange)' }} />
            </div>
            <div>
              <h3 className="font-sora" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                QR Code Studio
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Generate high-res table tent cards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--surface)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Table Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', padding: 14, borderRadius: 'var(--radius-button)', border: '1px solid var(--border-subtle)' }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            Target Table:
          </label>
          <select
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
            className="font-sora"
            style={{
              flex: 1,
              background: 'var(--surface-raised)',
              color: 'var(--accent-orange)',
              border: '1px solid var(--border-default)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-button)',
              fontSize: '0.875rem', fontWeight: 700,
              cursor: 'pointer', outline: 'none',
            }}
          >
            {Array.from({ length: 12 }, (_, i) => {
              const num = i + 1;
              const id  = `T-${num < 10 ? '0' + num : num}`;
              return <option key={id} value={id}>Table {id}</option>;
            })}
          </select>
        </div>

        {/* Printable QR Card Preview */}
        <div
          id="printable-qr-card"
          style={{
            background: '#FFFFFF', color: '#1C1410',
            borderRadius: 'var(--radius-card)',
            padding: 24, textAlign: 'center',
            border: '2px solid var(--accent-orange)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#1C1410', textTransform: 'uppercase' }}>
            <UtensilsCrossed style={{ width: 14, height: 14 }} /> Savour Bistro
          </div>

          <h2 className="font-sora" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1C1410', margin: 0 }}>
            TABLE #{tableId}
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>
            Scan QR code to view menu & place order
          </p>

          <div style={{ padding: 12, background: '#F9F6F2', borderRadius: 'var(--radius-md)', border: '1px solid #E8E0D5' }}>
            {qrDataUrl && (
              <img src={qrDataUrl} alt={`QR Code ${tableId}`} style={{ width: 180, height: 180, display: 'block', borderRadius: 6 }} />
            )}
          </div>

          <div style={{ fontSize: '0.625rem', color: '#999', wordBreak: 'break-all', maxWidth: 280 }}>
            {targetUrl}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleDownload}
            style={{
              flex: 1, padding: '12px',
              borderRadius: 'var(--radius-button)',
              background: 'transparent',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem', fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Download style={{ width: 16, height: 16, color: 'var(--accent-orange)' }} /> Download PNG
          </button>

          <button
            onClick={handlePrint}
            className="font-sora"
            style={{
              flex: 1, padding: '12px',
              borderRadius: 'var(--radius-button)',
              background: 'var(--accent-orange)', border: 'none',
              color: '#FFFFFF',
              fontSize: '0.875rem', fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 14px rgba(255,138,52,0.35)',
            }}
          >
            <Printer style={{ width: 16, height: 16 }} /> Print Tent Card
          </button>
        </div>
      </div>
    </div>
  );
};
