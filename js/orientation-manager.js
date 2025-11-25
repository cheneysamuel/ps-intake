// Orientation and sensor management
class OrientationManager {
    constructor() {
        this.azimuth = null;
        this.pitch = null;
        this.isTracking = false;
        this.init();
    }

    init() {
        console.log('Initializing Orientation Manager...');
        this.checkSensorSupport();
        this.startTracking();
    }

    checkSensorSupport() {
        // Check for device orientation support
        if (!window.DeviceOrientationEvent) {
            console.warn('Device Orientation not supported');
            this.showStatus('Orientation sensors not supported on this device', 'warning');
            return false;
        }

        // Check if permission is needed (iOS 13+)
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            console.log('Permission required for device orientation');
            this.requestPermission();
            return false;
        }

        return true;
    }

    async requestPermission() {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission === 'granted') {
                console.log('Device orientation permission granted');
                this.startTracking();
            } else {
                console.warn('Device orientation permission denied');
                this.showStatus('Permission denied for orientation sensors', 'error');
            }
        } catch (error) {
            console.error('Error requesting device orientation permission:', error);
            this.showStatus('Could not request sensor permissions', 'error');
        }
    }

    startTracking() {
        if (this.isTracking) return;

        // Listen for device orientation changes
        window.addEventListener('deviceorientationabsolute', (event) => {
            this.handleOrientationAbsolute(event);
        }, true);

        // Fallback to regular device orientation if absolute is not available
        window.addEventListener('deviceorientation', (event) => {
            if (!event.absolute) {
                this.handleOrientation(event);
            }
        }, true);

        this.isTracking = true;
        console.log('Orientation tracking started');
    }

    handleOrientationAbsolute(event) {
        // DeviceOrientationEvent with absolute = true provides compass heading
        // alpha: 0-360 degrees (0 = North, 90 = East, 180 = South, 270 = West)
        // beta: -180 to 180 degrees (pitch - forward/backward tilt)
        // gamma: -90 to 90 degrees (roll - left/right tilt)

        if (event.alpha !== null) {
            // Convert alpha to azimuth (0 = North)
            this.azimuth = Math.round(event.alpha);
        }

        if (event.beta !== null) {
            // Convert beta to pitch (0 = horizon, 90 = straight up, -90 = straight down)
            // When phone is held vertically (camera facing forward):
            // beta = 0 means phone is lying flat
            // beta = 90 means phone is vertical (camera at horizon)
            // We need to adjust so that horizon = 0 and straight up = 90
            
            let rawBeta = event.beta;
            
            // Normalize to -90 to 90 range where:
            // 0 = horizon (phone vertical, camera forward)
            // 90 = straight up (phone tilted back)
            // -90 = straight down (phone tilted forward)
            this.pitch = Math.round(rawBeta - 90);
            
            // Clamp to -90 to 90 range
            if (this.pitch > 90) this.pitch = 90;
            if (this.pitch < -90) this.pitch = -90;
        }

        this.updateDisplay();
        this.updateMapMarker();
    }

    handleOrientation(event) {
        // Fallback for devices without absolute orientation
        // Use webkitCompassHeading if available (iOS)
        if (event.webkitCompassHeading !== undefined) {
            this.azimuth = Math.round(event.webkitCompassHeading);
        } else if (event.alpha !== null) {
            // Approximate heading from alpha (may not be accurate without magnetometer)
            this.azimuth = Math.round(360 - event.alpha);
        }

        if (event.beta !== null) {
            let rawBeta = event.beta;
            this.pitch = Math.round(rawBeta - 90);
            if (this.pitch > 90) this.pitch = 90;
            if (this.pitch < -90) this.pitch = -90;
        }

        this.updateDisplay();
        this.updateMapMarker();
    }

    updateDisplay() {
        const azimuthElement = document.getElementById('azimuth');
        const pitchElement = document.getElementById('pitch');

        if (this.azimuth !== null && azimuthElement) {
            const direction = this.getCardinalDirection(this.azimuth);
            azimuthElement.textContent = `Azimuth: ${this.azimuth}° (${direction})`;
        }

        if (this.pitch !== null && pitchElement) {
            pitchElement.textContent = `Pitch: ${this.pitch}°`;
        }
    }

    getCardinalDirection(azimuth) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                          'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(azimuth / 22.5) % 16;
        return directions[index];
    }

    updateMapMarker() {
        // Update the map marker rotation if map manager is available
        if (window.mapManager && this.azimuth !== null) {
            window.mapManager.updateUserLocationRotation(this.azimuth);
        }
    }

    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('status-message');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status-${type}`;
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = '';
            }, 5000);
        }
    }

    getAzimuth() {
        return this.azimuth;
    }

    getPitch() {
        return this.pitch;
    }
}

// Initialize orientation manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.orientationManager = new OrientationManager();
});
