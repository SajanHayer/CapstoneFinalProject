import React, { useMemo, useState } from "react";
import { Card } from "../common/Card";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

type ImageGalleryProps = {
  images: string[];
  title?: string;
};

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  title = "Gallery",
}) => {
  const safeImages = useMemo(() => (Array.isArray(images) ? images.filter(Boolean) : []), [images]);
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!safeImages.length) {
    return (
      <Card className="bg-white/70 backdrop-blur border-[color:var(--border)]">
        <p className="text-sm text-[color:var(--muted)] font-semibold uppercase tracking-wide mb-3">
          {title}
        </p>
        <p className="text-[color:var(--muted)]">No images available</p>
      </Card>
    );
  }

  const clamp = (n: number) => Math.max(0, Math.min(safeImages.length - 1, n));
  const go = (next: number) => setActive(clamp(next));

  return (
    <>
      <Card className="detail-card">
        <div className="detail-card-head">
          <p className="detail-card-title">{title}</p>

          <button
            className="detail-icon-btn"
            onClick={() => setLightboxOpen(true)}
            title="View fullscreen"
            type="button"
          >
            <Maximize2 size={16} />
          </button>
        </div>

        <div className="detail-gallery">
          <div className="detail-gallery-main">
            <img
              src={safeImages[active]}
              alt={`Vehicle ${active + 1}`}
              className="detail-gallery-main-img"
              onClick={() => setLightboxOpen(true)}
            />

            {safeImages.length > 1 && (
              <>
                <button
                  className="detail-gallery-nav detail-gallery-nav-left"
                  onClick={() => go(active - 1)}
                  type="button"
                  title="Previous"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="detail-gallery-nav detail-gallery-nav-right"
                  onClick={() => go(active + 1)}
                  type="button"
                  title="Next"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            <div className="detail-gallery-badge">
              {active + 1} / {safeImages.length}
            </div>
          </div>

          {safeImages.length > 1 && (
            <div className="detail-gallery-thumbs" role="list">
              {safeImages.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={idx === active ? "detail-thumb detail-thumb-active" : "detail-thumb"}
                  onClick={() => setActive(idx)}
                  aria-label={`Select image ${idx + 1}`}
                >
                  <img src={url} alt={`Thumbnail ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {lightboxOpen && (
        <div className="detail-lightbox" onClick={() => setLightboxOpen(false)}>
          <div className="detail-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button className="detail-lightbox-close" onClick={() => setLightboxOpen(false)} type="button">
              <X size={20} />
            </button>

            <img src={safeImages[active]} alt="Fullscreen" className="detail-lightbox-img" />

            {safeImages.length > 1 && (
              <>
                <button
                  className="detail-lightbox-nav detail-lightbox-nav-left"
                  onClick={() => go(active - 1)}
                  type="button"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  className="detail-lightbox-nav detail-lightbox-nav-right"
                  onClick={() => go(active + 1)}
                  type="button"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
