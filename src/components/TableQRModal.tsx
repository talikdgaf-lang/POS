import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, QrCode as QrIcon } from 'lucide-react';
import { RestaurantTable } from '../types';

interface TableQRModalProps {
  table: RestaurantTable;
  businessId: string;
  businessName?: string;
  onClose: () => void;
  onOpenCustomerView?: (table: RestaurantTable) => void;
}

export const TableQRModal: React.FC<TableQRModalProps> = ({
  table,
  businessId,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const customerUrl = `${window.location.origin}/?businessId=${encodeURIComponent(businessId)}&table=${encodeURIComponent(table.name)}&mode=customer`;

  useEffect(() => {
    QRCode.toDataURL(customerUrl, {
      width: 500,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [customerUrl]);

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${table.name.replace(/\s+/g, '_')}_QR.png`;
    a.click();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-sm w-full p-6 border border-neutral-200 shadow-2xl flex flex-col items-center text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-black rounded-lg transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header: Table Name */}
        <div className="flex items-center gap-2 mb-4">
          <QrIcon className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-bold text-black">{table.name}</h3>
        </div>

        {/* QR Code Image */}
        <div className="p-3 bg-white border border-neutral-200 rounded-2xl shadow-xs mb-4">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`${table.name} QR Code`}
              className="w-56 h-56 object-contain"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-neutral-400 text-xs">
              Loading...
            </div>
          )}
        </div>

        {/* Question Prompt */}
        <p className="text-xs text-neutral-500 mb-4 font-medium">
          Download QR code for this table?
        </p>

        {/* Download Button */}
        <button
          type="button"
          onClick={handleDownloadQR}
          className="w-full py-2.5 px-4 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <Download className="w-4 h-4 text-orange-500" />
          <span>Download</span>
        </button>
      </div>
    </div>
  );
};
