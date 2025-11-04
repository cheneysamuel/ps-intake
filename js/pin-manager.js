// Pin Manager - Handles pin creation, photos, and saved locations
class PinManager {
    constructor() {
        this.currentPin = null;
        this.currentPhoto = null;
        this.savedLocations = [];
        this.currentAzimuth = null;
        this.currentElevation = null;
        this.orientationPermission = false;
        this.metadataHandler = new MetadataHandler();
        this.loadSavedLocations();
        this.init();
    }

    init() {
        console.log('Pin Manager initialized');
        this.setupEventListeners();
        this.requestOrientationPermission();
    }

    setupEventListeners() {
        // Modal controls
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        // Click outside modal to close
        document.getElementById('pin-modal').addEventListener('click', (e) => {
            if (e.target.id === 'pin-modal') {
                this.closeModal();
            }
        });

        // Photo controls
        document.getElementById('take-photo-btn').addEventListener('click', () => {
            this.openCamera();
        });

        document.getElementById('photo-input').addEventListener('change', (e) => {
            this.handlePhotoCapture(e);
        });

        document.getElementById('download-photo-btn').addEventListener('click', () => {
            this.downloadPhoto();
        });

        // Pin actions
        document.getElementById('save-favorite-btn').addEventListener('click', () => {
            this.saveAsFavorite();
        });

        document.getElementById('delete-pin-btn').addEventListener('click', () => {
            this.deletePin();
        });

        // Saved locations dropdown
        document.getElementById('saved-locations-dropdown').addEventListener('change', (e) => {
            this.navigateToSavedLocation(e.target.value);
        });
    }

    async requestOrientationPermission() {
        // iOS 13+ requires permission for DeviceOrientationEvent
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    this.startOrientationTracking();
                    this.orientationPermission = true;
                }
            } catch (error) {
                console.log('Orientation permission:', error);
            }
        } else if (window.DeviceOrientationEvent) {
            // Non-iOS or older iOS
            this.startOrientationTracking();
            this.orientationPermission = true;
        }
    }

    startOrientationTracking() {
        // Just track current orientation, don't display it
        window.addEventListener('deviceorientation', (e) => {
            // Alpha = compass direction (0-360)
            this.currentAzimuth = e.alpha || 0;
            // Beta = front-to-back tilt (-180 to 180)
            this.currentElevation = e.beta || 0;
        }, true);
    }

    createPin(lat, lon) {
        console.log('Creating pin at:', lat, lon);

        // Remove current pin if exists
        if (this.currentPin && this.currentPin.marker) {
            window.mapManager.removeMarker(this.currentPin.marker);
        }

        // Create new pin marker
        const marker = window.mapManager.addCustomPin(lat, lon);

        // Store pin data
        this.currentPin = {
            lat: lat,
            lon: lon,
            marker: marker,
            photo: null,
            name: ''
        };

        // Reset photo
        this.currentPhoto = null;

        // Show modal
        this.openModal(lat, lon);
    }

    openModal(lat, lon, isEdit = false) {
        const modal = document.getElementById('pin-modal');
        modal.classList.add('active');

        // Update coordinates display
        document.getElementById('pin-coordinates').textContent = 
            `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`;

        if (!isEdit) {
            // Reset form for new pin
            document.getElementById('pin-name').value = '';
            this.clearPhotoPreview();
        }
        
        // Hide download button initially
        document.getElementById('download-photo-btn').style.display = 'none';
    }

    editPin(pinData) {
        console.log('Editing pin:', pinData);
        
        this.currentPin = pinData;
        this.openModal(pinData.lat, pinData.lon, true);
        
        // Restore pin data
        if (pinData.name) {
            document.getElementById('pin-name').value = pinData.name;
        }
        if (pinData.photo) {
            this.currentPhoto = pinData.photo;
            this.displayPhoto(pinData.photo.data);
        }
    }

    closeModal() {
        const modal = document.getElementById('pin-modal');
        modal.classList.remove('active');

        // Remove current pin if not saved
        if (this.currentPin && this.currentPin.marker && !this.currentPin.saved) {
            window.mapManager.removeMarker(this.currentPin.marker);
            this.currentPin = null;
        }
    }

    openCamera() {
        document.getElementById('photo-input').click();
    }

    handlePhotoCapture(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            // Get user location
            const userLocation = window.app ? window.app.currentPosition : null;

            // Capture azimuth and elevation at this exact moment
            const captureAzimuth = this.currentAzimuth || 0;
            const captureElevation = this.currentElevation || 0;

            // Prepare metadata with captured orientation
            const compassData = {
                azimuth: captureAzimuth,
                elevation: captureElevation,
                distance: null // No distance since we removed the slider
            };

            const metadata = this.metadataHandler.prepareMetadata(
                this.currentPin,
                compassData,
                userLocation
            );

            // Add metadata overlay to image
            const imageWithMetadata = await this.metadataHandler.addMetadataToImage(
                e.target.result,
                metadata
            );

            this.currentPhoto = {
                data: imageWithMetadata,
                originalData: e.target.result,
                name: file.name,
                timestamp: metadata.datetime,
                metadata: metadata
            };

            // Update pin with photo
            if (this.currentPin) {
                this.currentPin.photo = this.currentPhoto;
            }

            // Display photo
            this.displayPhoto(imageWithMetadata);
        };

        reader.readAsDataURL(file);
    }

    displayPhoto(imageData) {
        const preview = document.getElementById('photo-preview');
        preview.innerHTML = `<img src="${imageData}" alt="Captured photo">`;

        // Show download button
        document.getElementById('download-photo-btn').style.display = 'inline-block';
    }

    clearPhotoPreview() {
        const preview = document.getElementById('photo-preview');
        preview.innerHTML = '<p class="no-photo-text">No photo attached</p>';
        document.getElementById('download-photo-btn').style.display = 'none';
    }

    downloadPhoto() {
        if (!this.currentPhoto) {
            alert('No photo to download');
            return;
        }

        // Create filename with metadata
        const filename = this.metadataHandler.createMetadataFilename(
            this.currentPhoto.metadata
        );

        // Download image with metadata overlay
        const link = document.createElement('a');
        link.href = this.currentPhoto.data;
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Also download separate metadata text file
        this.metadataHandler.downloadMetadataFile(
            this.currentPhoto.metadata,
            filename
        );

        // Show success message
        if (window.app) {
            window.app.showStatus('Photo and metadata downloaded', 'success');
            setTimeout(() => window.app.clearStatus(), 2000);
        }
    }

    saveAsFavorite() {
        if (!this.currentPin) return;

        const name = document.getElementById('pin-name').value.trim() || 
                     `Location ${this.savedLocations.length + 1}`;

        const savedLocation = {
            id: Date.now(),
            name: name,
            lat: this.currentPin.lat,
            lon: this.currentPin.lon,
            photo: this.currentPhoto,
            timestamp: new Date().toISOString(),
            marker: this.currentPin.marker
        };

        this.savedLocations.push(savedLocation);
        this.currentPin.saved = true;
        this.currentPin.id = savedLocation.id;
        this.saveSavedLocations();
        this.updateSavedLocationsDropdown();

        // Update marker to be clickable
        if (this.currentPin.marker) {
            this.currentPin.marker.off('click');
            this.currentPin.marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                this.editPin(savedLocation);
            });
        }

        // Show success message
        if (window.app) {
            window.app.showStatus(`"${name}" saved as favorite`, 'success');
            setTimeout(() => window.app.clearStatus(), 2000);
        }

        this.closeModal();
    }

    deletePin() {
        if (this.currentPin && this.currentPin.marker) {
            window.mapManager.removeMarker(this.currentPin.marker);
            this.currentPin = null;
            this.currentPhoto = null;
        }

        this.closeModal();

        if (window.app) {
            window.app.showStatus('Pin deleted', 'info');
            setTimeout(() => window.app.clearStatus(), 2000);
        }
    }

    saveSavedLocations() {
        try {
            localStorage.setItem('savedLocations', JSON.stringify(this.savedLocations));
        } catch (error) {
            console.error('Error saving locations:', error);
        }
    }

    loadSavedLocations() {
        try {
            const saved = localStorage.getItem('savedLocations');
            if (saved) {
                this.savedLocations = JSON.parse(saved);
                this.updateSavedLocationsDropdown();
                
                // Restore markers on map
                this.restoreSavedMarkers();
            }
        } catch (error) {
            console.error('Error loading locations:', error);
        }
    }

    restoreSavedMarkers() {
        if (!window.mapManager) return;

        this.savedLocations.forEach(location => {
            const marker = window.mapManager.addCustomPin(location.lat, location.lon, location);
            
            location.marker = marker; // Store reference
            
            let popupContent = `<strong>${location.name}</strong><br>`;
            popupContent += `Lat: ${location.lat.toFixed(6)}<br>`;
            popupContent += `Lon: ${location.lon.toFixed(6)}`;
            if (location.photo && location.photo.metadata) {
                popupContent += `<br>Azimuth: ${Math.round(location.photo.metadata.azimuth)}°`;
            }
            
            marker.bindPopup(popupContent);
            
            // Add click handler to edit
            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                this.editPin(location);
            });
        });
    }

    updateSavedLocationsDropdown() {
        const dropdown = document.getElementById('saved-locations-dropdown');
        
        // Clear existing options except first
        dropdown.innerHTML = '<option value="">📍 Saved Locations</option>';

        // Add saved locations
        this.savedLocations.forEach(location => {
            const option = document.createElement('option');
            option.value = location.id;
            option.textContent = location.name;
            dropdown.appendChild(option);
        });
    }

    navigateToSavedLocation(locationId) {
        if (!locationId) return;

        const location = this.savedLocations.find(loc => loc.id == locationId);
        if (location && window.mapManager) {
            window.mapManager.centerMap(location.lat, location.lon, 18);
            
            if (window.app) {
                window.app.showStatus(`Navigated to "${location.name}"`, 'success');
                setTimeout(() => window.app.clearStatus(), 2000);
            }
        }

        // Reset dropdown
        document.getElementById('saved-locations-dropdown').value = '';
    }

    deleteSavedLocation(locationId) {
        this.savedLocations = this.savedLocations.filter(loc => loc.id !== locationId);
        this.saveSavedLocations();
        this.updateSavedLocationsDropdown();
    }
}

// Initialize pin manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for map to be ready
    setTimeout(() => {
        window.pinManager = new PinManager();
    }, 500);
});
