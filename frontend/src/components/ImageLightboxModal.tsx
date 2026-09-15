import React, { useState, useEffect } from 'react';
import {
  RiCloseLine,
  RiZoomInLine,
  RiZoomOutLine,
  RiDownloadLine,
  RiExternalLinkLine,
  RiImageLine,
} from '@remixicon/react';
import { Kbd } from './base/kbd/kbd';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt?: string;
  title?: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  src,
  alt = 'Industrial Diagram Preview',
  title = 'Industrial Schematic / Diagram',
}) => {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsZoomed(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'z' || e.key === 'Z') {
        setIsZoomed((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !src) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = src;
    a.download = `mrpl-schematic-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenNewTab = () => {
    window.open(src, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/90 backdrop-blur-md p-4 sm:p-6 animate-fadeIn select-none"
      onClick={onClose}
    >
      {/* Top Controls Toolbar */}
      <div
        className="w-full max-w-5xl flex items-center justify-between px-4 py-2.5 rounded-2xl bg-neutral-900/80 border border-white/10 shadow-2xl backdrop-blur-lg z-10 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title & Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0">
            <RiImageLine className="size-4" />
          </div>
          <span className="text-body-2-medium font-semibold text-white truncate max-w-xs sm:max-w-md">
            {title}
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-white/10 text-[11px] font-mono text-neutral-300">
            {isZoomed ? 'Zoomed (125%)' : 'Fit to screen'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Toggle */}
          <button
            type="button"
            onClick={() => setIsZoomed((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-neutral-200 hover:text-white text-caption-1-medium border border-white/10 transition-colors cursor-pointer"
            title={isZoomed ? 'Zoom Out (Z)' : 'Zoom In (Z)'}
            aria-label="Toggle zoom"
          >
            {isZoomed ? (
              <>
                <RiZoomOutLine className="size-4" />
                <span className="hidden md:inline">Reset</span>
              </>
            ) : (
              <>
                <RiZoomInLine className="size-4" />
                <span className="hidden md:inline">Zoom</span>
              </>
            )}
          </button>

          {/* Open in New Tab */}
          <button
            type="button"
            onClick={handleOpenNewTab}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-neutral-200 hover:text-white text-caption-1-medium border border-white/10 transition-colors cursor-pointer"
            title="Open in new browser tab"
            aria-label="Open in new tab"
          >
            <RiExternalLinkLine className="size-4" />
            <span className="hidden md:inline">Open</span>
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-caption-1-medium border border-emerald-500/30 transition-colors cursor-pointer"
            title="Download image"
            aria-label="Download image"
          >
            <RiDownloadLine className="size-4" />
            <span className="hidden sm:inline font-semibold">Download</span>
          </button>

          {/* Close Button with ESC */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-neutral-200 hover:text-rose-300 border border-white/10 transition-colors cursor-pointer"
            title="Close viewer (Esc)"
            aria-label="Close"
          >
            <RiCloseLine className="size-4.5" />
            <Kbd className="hidden sm:inline-flex bg-white/10 text-neutral-300 border-white/10 text-[10px] px-1.5 py-0.5">
              ESC
            </Kbd>
          </button>
        </div>
      </div>

      {/* Main Image Viewport Area */}
      <div
        className="flex-1 w-full flex items-center justify-center p-2 sm:p-4 min-h-0 overflow-auto cursor-default"
        onClick={onClose}
      >
        <div
          className="relative flex items-center justify-center transition-transform duration-200 ease-out"
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomed((prev) => !prev);
          }}
          title={isZoomed ? 'Click to fit screen' : 'Click to zoom in'}
        >
          <img
            src={src}
            alt={alt}
            className={`rounded-2xl border border-white/15 shadow-2xl transition-all duration-200 select-none ${
              isZoomed
                ? 'max-h-none max-w-none scale-125 cursor-zoom-out'
                : 'max-h-[82vh] max-w-[88vw] object-contain cursor-zoom-in'
            }`}
          />
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="text-neutral-400 text-caption-1-regular tracking-wide opacity-80 shrink-0 text-center">
        Click image or press <kbd className="font-mono text-emerald-400 font-semibold">Z</kbd> to toggle zoom • Click outside or press <kbd className="font-mono text-emerald-400 font-semibold">ESC</kbd> to close
      </div>
    </div>
  );
};
