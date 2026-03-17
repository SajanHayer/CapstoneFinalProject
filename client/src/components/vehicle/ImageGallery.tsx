import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type ImageGalleryProps = {
  images: string[];
  title?: string;
};

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  title = "Gallery",
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  if (!images || images.length === 0) {
    return (
      <div className="gallery-card">
        <p className="gallery-title">{title}</p>
        <p className="gallery-empty">No images available</p>
      </div>
    );
  }

  const currentImage = images[selectedIndex];

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleModalPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    handlePrevious();
  };

  const handleModalNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleNext();
  };

  const handleModalClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="gallery-card">
        <p className="gallery-title">{title}</p>
        
        {/* Main Image with Navigation */}
        <div 
          className="gallery-main-container"
          onClick={() => setIsModalOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") setIsModalOpen(true);
          }}
        >
          <img
            src={currentImage}
            alt={`Vehicle ${selectedIndex + 1}`}
            className="gallery-main-image"
          />
          
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="gallery-nav-button gallery-nav-prev"
                aria-label="Previous image"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="gallery-nav-button gallery-nav-next"
                aria-label="Next image"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
          
          {/* Image Counter */}
          <div className="gallery-counter">
            {selectedIndex + 1} / {images.length}
          </div>

          {/* Click to expand hint */}
          <div className="gallery-expand-hint">Click to expand</div>
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="gallery-thumbnails">
            {images.map((url, index) => (
              <div
                key={index}
                className={`gallery-thumbnail ${
                  index === selectedIndex ? "active" : ""
                }`}
                onClick={() => setSelectedIndex(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSelectedIndex(index);
                }}
              >
                <img
                  src={url}
                  alt={`Thumbnail ${index + 1}`}
                  className="thumbnail-image"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full-Screen Modal */}
      {isModalOpen && (
        <div
          className="gallery-modal-overlay"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="gallery-modal-content">
            {/* Close Button */}
            <button
              onClick={handleModalClose}
              className="gallery-modal-close"
              aria-label="Close gallery"
            >
              <X size={28} />
            </button>

            {/* Main Image */}
            <img
              src={currentImage}
              alt={`Vehicle ${selectedIndex + 1} full view`}
              className="gallery-modal-image"
            />

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handleModalPrevious}
                  className="gallery-modal-nav gallery-modal-nav-prev"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={handleModalNext}
                  className="gallery-modal-nav gallery-modal-nav-next"
                  aria-label="Next image"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            {/* Counter */}
            <div className="gallery-modal-counter">
              {selectedIndex + 1} / {images.length}
            </div>

            {/* Thumbnail Strip in Modal */}
            {images.length > 1 && (
              <div className="gallery-modal-thumbnails">
                {images.map((url, index) => (
                  <div
                    key={index}
                    className={`gallery-modal-thumbnail ${
                      index === selectedIndex ? "active" : ""
                    }`}
                    onClick={() => setSelectedIndex(index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setSelectedIndex(index);
                    }}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${index + 1}`}
                      className="modal-thumbnail-image"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
