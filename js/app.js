// Main application logic
class FieldSurveyApp {
    constructor() {
        this.currentPosition = null;
        this.watchId = null;
        this.init();
    }

    init() {
        console.log('Initializing Field Survey App...');
        this.setupEventListeners();
        this.checkGeolocationSupport();
        this.startWatchingPosition();
    }

    setupEventListeners() {
        const locateBtn = document.getElementById('locate-btn');
        locateBtn.addEventListener('click', () => {
            this.centerOnCurrentLocation();
        });
    }

    checkGeolocationSupport() {
        if (!('geolocation' in navigator)) {
            this.showStatus('Geolocation is not supported by your device', 'error');
            document.getElementById('locate-btn').disabled = true;
            return false;
        }
        return true;
    }

    startWatchingPosition() {
        if (!this.checkGeolocationSupport()) return;

        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.handlePositionSuccess(position),
            (error) => this.handlePositionError(error),
            options
        );
    }

    handlePositionSuccess(position) {
        this.currentPosition = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
        };

        this.updateCoordinatesDisplay();
        
        // Update map with current position
        if (window.mapManager) {
            window.mapManager.updateUserLocation(
                this.currentPosition.lat,
                this.currentPosition.lon,
                this.currentPosition.accuracy
            );
        }
    }

    handlePositionError(error) {
        let message = 'Unable to retrieve your location';
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location permission denied. Please enable location access.';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location information unavailable.';
                break;
            case error.TIMEOUT:
                message = 'Location request timed out.';
                break;
        }
        
        this.showStatus(message, 'error');
        console.error('Geolocation error:', error);
    }

    updateCoordinatesDisplay() {
        if (!this.currentPosition) return;

        const latElement = document.getElementById('lat');
        const lonElement = document.getElementById('lon');

        latElement.textContent = `Lat: ${this.currentPosition.lat.toFixed(6)}`;
        lonElement.textContent = `Lon: ${this.currentPosition.lon.toFixed(6)}`;
    }

    centerOnCurrentLocation() {
        if (!this.currentPosition) {
            this.showStatus('Waiting for GPS location...', 'info');
            return;
        }

        if (window.mapManager) {
            window.mapManager.centerMap(
                this.currentPosition.lat,
                this.currentPosition.lon
            );
            this.showStatus('Centered on your location', 'success');
            
            // Clear status message after 2 seconds
            setTimeout(() => {
                this.clearStatus();
            }, 2000);
        }
    }

    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('status-message');
        statusElement.textContent = message;
        statusElement.className = type;
    }

    clearStatus() {
        const statusElement = document.getElementById('status-message');
        statusElement.textContent = '';
        statusElement.className = '';
    }

    stopWatchingPosition() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FieldSurveyApp();
});
