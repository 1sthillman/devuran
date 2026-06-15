import { useState, useEffect, useRef } from 'react';
import { Download } from 'lucide-react';
import QRCodeStyling from 'qr-code-styling';

interface QRCodeCardProps {
  url: string;
  businessName: string;
  style: {
    id: string;
    name: string;
    config: any;
  };
}

export function QRCodeCard({ url, businessName, style }: QRCodeCardProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<QRCodeStyling | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!qrRef.current) return;

    // Create QR code instance with high res for download
    qrCodeRef.current = new QRCodeStyling({
      ...style.config,
      width: 500, // High quality for download
      height: 500,
      data: url,
      qrOptions: {
        errorCorrectionLevel: 'H'
      }
    });

    // Clear previous QR code
    qrRef.current.innerHTML = '';
    
    // Append new QR code
    qrCodeRef.current.append(qrRef.current);
    
    // Scale for display
    const canvas = qrRef.current.querySelector('canvas');
    if (canvas) {
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    }
  }, [style, url]);

  const handleDownload = async (format: 'png' | 'svg') => {
    if (!qrCodeRef.current || isDownloading) return;

    setIsDownloading(true);
    try {
      const filename = `${businessName.toLowerCase().replace(/\s+/g, '-')}-qr-${style.id}`;
      
      await qrCodeRef.current.download({
        name: filename,
        extension: format
      });
    } catch (error) {
      console.error('Error downloading QR code:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.03] transition-all">
      {/* QR Code Display - Rounded corners */}
      <div className="relative mb-3 p-4 rounded-3xl bg-white flex items-center justify-center overflow-hidden">
        <div 
          ref={qrRef}
          className="flex items-center justify-center w-full rounded-2xl overflow-hidden"
          style={{ maxWidth: '120px', maxHeight: '120px' }}
        />
      </div>

      {/* Style Name */}
      <p className="text-sm font-semibold text-[var(--chrome-white)] mb-3 text-center">
        {style.name}
      </p>

      {/* Download Buttons - Beautiful gradient style */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleDownload('png')}
          disabled={isDownloading}
          className="relative h-10 rounded-2xl overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all" />
          <div className="absolute inset-0 border border-purple-500/30 rounded-2xl" />
          <div className="relative flex items-center justify-center gap-1.5 h-full">
            <Download size={14} strokeWidth={2} className="text-purple-400" />
            <span className="text-xs font-bold text-purple-300">PNG</span>
          </div>
        </button>
        <button
          onClick={() => handleDownload('svg')}
          disabled={isDownloading}
          className="relative h-10 rounded-2xl overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-all" />
          <div className="absolute inset-0 border border-cyan-500/30 rounded-2xl" />
          <div className="relative flex items-center justify-center gap-1.5 h-full">
            <Download size={14} strokeWidth={2} className="text-cyan-400" />
            <span className="text-xs font-bold text-cyan-300">SVG</span>
          </div>
        </button>
      </div>
    </div>
  );
}
