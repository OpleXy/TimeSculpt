import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { uploadBackgroundImage, deleteBackgroundImage } from '../services/backgroundImageService';
import '../styles/BackgroundSelector.css';

const BackgroundSelector = ({
  currentBackgroundColor = 'white',
  currentBackgroundImage = null,
  onBackgroundChange,
  onClose
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('color');
  const [customColor, setCustomColor] = useState(currentBackgroundColor);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Forhåndsdefinerte farger
  const predefinedColors = [
    { name: 'Hvit', value: '#ffffff' },
    { name: 'Lys grå', value: '#f5f5f5' },
    { name: 'Lys blå', value: '#e3f2fd' },
    { name: 'Lys grønn', value: '#e8f5e9' },
    { name: 'Lys gul', value: '#fffde7' },
    { name: 'Lys rosa', value: '#fce4ec' },
    { name: 'Lys lilla', value: '#f3e5f5' },
    { name: 'Krem', value: '#faf8f3' },
    { name: 'Lys cyan', value: '#e0f2f1' },
    { name: 'Beige', value: '#f5f5dc' }
  ];

  // Forhåndsdefinerte bilder
  const predefinedImages = [
    { name: 'CCTV', filename: 'cctv.png', category: 'Teknologi' },
    { name: 'CIA', filename: 'cia.png', category: 'Historie' },
    { name: 'Dinosaur', filename: 'dino.png', category: 'Forhistorie' },
    { name: 'Eldre Krig', filename: 'eldrekrig.png', category: 'Historie' },
    { name: 'Eventyr', filename: 'eventyr.png', category: 'Eventyr' },
    { name: 'Hacker', filename: 'hacker.png', category: 'Teknologi' },
    { name: 'Huleboer', filename: 'huleboer.png', category: 'Forhistorie' },
    { name: 'Industri', filename: 'industri.png', category: 'Industri' },
    { name: 'Kina', filename: 'kina.png', category: 'Kultur' },
    { name: 'Melkeveien', filename: 'melkeveien.png', category: 'Romfart' },
    { name: 'Moderne Krig', filename: 'modernekrig.png', category: 'Historie' },
    { name: 'Overgrodd', filename: 'overgrodd.png', category: 'Natur' },
    { name: 'Patent', filename: 'patent.png', category: 'Teknologi' },
    { name: 'Pyramide', filename: 'pyramide.png', category: 'Historie' },
    { name: 'Ridder', filename: 'ridder.png', category: 'Middelalder' },
    { name: 'TimeSculpt', filename: 'timesculpt.png', category: 'Standard' }
  ];

  // Validering av bildefiler
  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Kun JPEG, PNG og WebP-filer er tillatt');
    }

    if (file.size > maxSize) {
      throw new Error('Filen er for stor. Maksimum størrelse er 5MB');
    }

    return true;
  };

  // Håndter filopplasting
  const handleFileUpload = useCallback(async (file) => {
    if (!currentUser) {
      setUploadError('Du må være logget inn for å laste opp bilder');
      return;
    }

    try {
      validateFile(file);
      setIsUploading(true);
      setUploadError('');
      setUploadProgress(0);

      const imageUrl = await uploadBackgroundImage(
        file, 
        currentUser.uid,
        (progress) => setUploadProgress(progress)
      );

      // Oppdater bakgrunn til det nye bildet
      onBackgroundChange({
        type: 'image',
        value: imageUrl,
        isCustom: true
      });

      setIsUploading(false);
      setUploadProgress(0);
    } catch (error) {
      console.error('Feil ved opplasting:', error);
      setUploadError(error.message);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [currentUser, onBackgroundChange]);

  // Håndter filvalg
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset file input
    event.target.value = '';
  };

  // Håndter drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Håndter fargevelg
  const handleColorSelect = (color) => {
    onBackgroundChange({
      type: 'color',
      value: color
    });
  };

  // Håndter forhåndsdefinert bilde
  const handlePredefinedImageSelect = (filename) => {
    onBackgroundChange({
      type: 'image',
      value: filename,
      isCustom: false
    });
  };

  // Fjern egendefinert bakgrunn
  const handleRemoveCustomBackground = async () => {
    if (currentBackgroundImage && currentBackgroundImage.startsWith('https://')) {
      try {
        await deleteBackgroundImage(currentBackgroundImage);
      } catch (error) {
        console.error('Feil ved sletting av bilde:', error);
      }
    }
    
    onBackgroundChange({
      type: 'color',
      value: '#ffffff'
    });
  };

  const isCustomImage = currentBackgroundImage && currentBackgroundImage.startsWith('https://');

  return (
    <div className="background-selector">
      <div className="background-selector-header">
        <h3>Velg bakgrunn</h3>
        <button 
          className="background-selector-close-button"
          onClick={onClose}
          aria-label="Lukk"
        >
          ×
        </button>
      </div>

      <div className="background-selector-tabs">
        <button
          className={`background-selector-tab ${activeTab === 'color' ? 'active' : ''}`}
          onClick={() => setActiveTab('color')}
        >
          Farger
        </button>
        <button
          className={`background-selector-tab ${activeTab === 'palette' ? 'active' : ''}`}
          onClick={() => setActiveTab('palette')}
        >
          Fargepalett
        </button>
        <button
          className={`background-selector-tab ${activeTab === 'images' ? 'active' : ''}`}
          onClick={() => setActiveTab('images')}
        >
          Bildegalleri
        </button>
        <button
          className={`background-selector-tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          Last opp
        </button>
      </div>

      <div className="background-selector-content">
        {/* Egendefinert farge */}
        {activeTab === 'color' && (
          <div className="background-color-picker">
            <div className="background-current-color">
              <div 
                className="background-color-preview"
                style={{ backgroundColor: customColor }}
              />
              <span>Nåværende farge: {customColor}</span>
            </div>
            
            <div className="background-color-input-group">
              <label htmlFor="color-picker">Velg farge:</label>
              <input
                id="color-picker"
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="background-color-input"
              />
              <button 
                className="background-apply-button"
                onClick={() => handleColorSelect(customColor)}
              >
                Bruk farge
              </button>
            </div>
          </div>
        )}

        {/* Forhåndsdefinert fargepalett */}
        {activeTab === 'palette' && (
          <div className="background-color-palette">
            {predefinedColors.map((color) => (
              <button
                key={color.value}
                className={`background-color-option ${
                  currentBackgroundColor === color.value ? 'selected' : ''
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => handleColorSelect(color.value)}
                title={color.name}
                aria-label={`Velg ${color.name}`}
              >
                {currentBackgroundColor === color.value && (
                  <span className="background-checkmark">✓</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Forhåndsdefinerte bilder */}
        {activeTab === 'images' && (
          <div className="background-image-gallery">
            {predefinedImages.map((image) => (
              <button
                key={image.filename}
                className={`background-image-option ${
                  currentBackgroundImage === image.filename ? 'selected' : ''
                }`}
                onClick={() => handlePredefinedImageSelect(image.filename)}
                title={image.name}
              >
                <img
                  src={`/backgrounds/${image.filename}`}
                  alt={image.name}
                  className="background-image-preview"
                  loading="lazy"
                />
                <div className="background-image-info">
                  <span className="background-image-name">{image.name}</span>
                  <span className="background-image-category">{image.category}</span>
                </div>
                {currentBackgroundImage === image.filename && (
                  <span className="background-checkmark">✓</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Opplasting */}
        {activeTab === 'upload' && (
          <div className="background-upload-section">
            {!currentUser ? (
              <div className="background-login-required">
                <p>Du må være logget inn for å laste opp egne bilder</p>
              </div>
            ) : (
              <>
                <div 
                  className={`background-drop-zone ${isUploading ? 'uploading' : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <div className="background-upload-progress">
                      <div className="background-spinner" />
                      <p>Laster opp... {Math.round(uploadProgress)}%</p>
                      <div className="background-progress-bar">
                        <div 
                          className="background-progress-fill"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="background-upload-icon">📁</div>
                      <p>Dra og slipp bilde her eller klikk for å velge</p>
                      <p className="background-upload-hint">
                        JPEG, PNG, WebP • Maks 5MB
                      </p>
                    </>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="background-hidden-file-input"
                  disabled={isUploading}
                />

                {uploadError && (
                  <div className="background-error">
                    <span className="background-error-icon">⚠️</span>
                    {uploadError}
                  </div>
                )}

                {isCustomImage && (
                  <div className="background-custom-image-actions">
                    <h4>Ditt opplastede bilde</h4>
                    <img 
                      src={currentBackgroundImage} 
                      alt="Egendefinert bakgrunn"
                      className="background-custom-image-preview"
                    />
                    <button 
                      className="background-remove-button"
                      onClick={handleRemoveCustomBackground}
                    >
                      Fjern bilde
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BackgroundSelector;