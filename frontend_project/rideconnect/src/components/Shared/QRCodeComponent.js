import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download, Share2 } from 'lucide-react';

const QRCodeComponent = ({ value, label, subLabel, size = 200, showControls = false }) => {
    const downloadQRCode = () => {
        const svg = document.getElementById('rideconnect-qr');
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            canvas.width = size + 40;
            canvas.height = size + 40;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 20, 20);
            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `RideConnect-QR-${label}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    return (
        <div className="flex flex-col items-center gap-6 p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            
            <div className="text-center relative">
                <h4 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">{label}</h4>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{subLabel}</p>
            </div>

            <div className="relative p-4 bg-white rounded-3xl shadow-inner border border-slate-100">
                <QRCodeSVG 
                    id="rideconnect-qr"
                    value={value} 
                    size={size}
                    level="H"
                    includeMargin={true}
                    imageSettings={{
                        src: "/favicon.ico",
                        x: undefined,
                        y: undefined,
                        height: 40,
                        width: 40,
                        excavate: true,
                    }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-white/10 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[1px]">
                     <QrCode className="text-primary size-12 animate-pulse" />
                </div>
            </div>

            {showControls && (
                <div className="flex items-center gap-3 w-full relative">
                    <button 
                        onClick={downloadQRCode}
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase rounded-xl hover:bg-primary hover:text-background-dark transition-all flex items-center justify-center gap-2"
                    >
                        <Download size={14} /> Download
                    </button>
                    <button 
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase rounded-xl hover:bg-primary hover:text-background-dark transition-all flex items-center justify-center gap-2"
                    >
                        <Share2 size={14} /> Share
                    </button>
                </div>
            )}

            <div className="flex items-center gap-2 text-slate-400 relative">
                <span className="material-symbols-outlined text-sm">shield_check</span>
                <p className="text-[9px] font-black uppercase tracking-widest tracking-tighter">Secure UPI Payment Interface</p>
            </div>
        </div>
    );
};

export default QRCodeComponent;
