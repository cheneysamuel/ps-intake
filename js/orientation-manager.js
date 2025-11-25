// Orientation and sensor management
class OrientationManager {
    constructor() {
        this.azimuth = null;
        this.pitch = null;
        this.isTracking = false;
        this.hasReceivedData = false;
        
        // Smoothing for azimuth to reduce jitter
        this.azimuthBuffer = [];
        this.bufferSize = 5; // Average over last 5 readings
        this.smoothedAzimuth = null;
        
        this.init();
    }

    init() {
        console.log('Initializing Orientation Manager...');
        console.log('User Agent:', navigator.userAgent);
        console.log('Secure Context (HTTPS):', window.isSecureContext);
        this.addPermissionButton();
        this.checkSensorSupport();
        this.startTracking();
    }

    addPermissionButton() {
        // Add a button to request permissions for Chrome/Brave/iOS
        const controls = document.getElementById('controls');
        if (controls) {
            const button = document.createElement('button');
            button.id = 'enable-orientation-btn';
            button.className = 'btn btn-primary';
            button.textContent = '🧭 Enable Compass & Orientation';
            button.style.marginTop = '0.5rem';
            button.style.fontSize = '1.1rem';
            button.style.padding = '1rem';
            button.addEventListener('click', () => this.requestPermission());
            controls.insertBefore(button, controls.firstChild);
            console.log('Permission button added to UI');
        } else {
            console.error('Controls element not found!');
        }
    }

    checkSensorSupport() {
        // Check for device orientation support
        if (!window.DeviceOrientationEvent) {
            console.warn('Device Orientation not supported');
            this.showStatus('Orientation sensors not supported on this device', 'warning');
            return false;
        }

        console.log('DeviceOrientationEvent supported');
        console.log('requestPermission function exists:', typeof DeviceOrientationEvent.requestPermission === 'function');

        // Check if permission is needed (iOS 13+)
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            console.log('Permission required for device orientation (iOS 13+)');
            this.showStatus('Tap "Enable Compass" to activate orientation sensors', 'info');
            return false;
        }

        return true;
    }

    async requestPermission() {
        console.log('=== requestPermission called ===');
        console.log('iOS requestPermission available:', typeof DeviceOrientationEvent.requestPermission === 'function');
        
        const button = document.getElementById('enable-orientation-btn');
        if (button) {
            button.disabled = true;
            button.textContent = '⏳ Requesting permission...';
        }
        
        // For iOS 13+ which requires explicit permission
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                console.log('Calling DeviceOrientationEvent.requestPermission()...');
                const permission = await DeviceOrientationEvent.requestPermission();
                console.log('Permission result:', permission);
                
                if (permission === 'granted') {
                    console.log('✓ Device orientation permission GRANTED');
                    this.showStatus('✓ Orientation sensors enabled!', 'success');
                    this.isTracking = false; // Reset to allow startTracking to run
                    this.startTracking();
                    
                    // Wait a bit to confirm data is flowing
                    setTimeout(() => {
                        if (this.hasReceivedData) {
                            button?.remove();
                        } else {
                            console.warn('Permission granted but no data received');
                            if (button) button.textContent = '🔄 Retry Enable Compass';
                        }
                    }, 2000);
                } else {
                    console.warn('✗ Device orientation permission DENIED');
                    this.showStatus('Permission denied. Tap the button again to retry.', 'error');
                    if (button) {
                        button.disabled = false;
                        button.textContent = '🧭 Enable Compass & Orientation';
                    }
                }
            } catch (error) {
                console.error('Error requesting device orientation permission:', error);
                console.error('Error details:', error.name, error.message);
                this.showStatus('Error: ' + error.message, 'error');
                if (button) {
                    button.disabled = false;
                    button.textContent = '🔄 Retry Enable Compass';
                }
            }
        } else {
            // For Chrome/Brave Android - just notify that sensors should be working
            console.log('No iOS permission API - starting tracking directly');
            this.showStatus('Starting orientation sensors...', 'info');
            this.isTracking = false; // Reset to allow startTracking to run
            this.startTracking();
            
            // Check after 2 seconds if we're receiving data
            setTimeout(() => {
                if (!this.hasReceivedData) {
                    console.warn('No orientation data received after 2 seconds');
                    console.log('Possible causes:');
                    console.log('- Not using HTTPS');
                    console.log('- Motion sensors blocked in browser settings');
                    console.log('- Device lacks required sensors');
                    this.showStatus('No sensor data detected. Try using HTTPS.', 'warning');
                    if (button) {
                        button.disabled = false;
                        button.textContent = '🔄 Retry Enable Compass';
                    }
                } else {
                    button?.remove();
                    this.showStatus('✓ Sensors working!', 'success');
                }
            }, 2000);
        }
    }

    startTracking() {
        if (this.isTracking) {
            console.log('Already tracking orientation');
            return;
        }

        console.log('Starting orientation tracking...');

        // Listen for device orientation changes (absolute = compass)
        window.addEventListener('deviceorientationabsolute', (event) => {
            console.log('deviceorientationabsolute event:', event.alpha, event.beta, event.gamma, event.absolute);
            this.hasReceivedData = true;
            this.handleOrientationAbsolute(event);
        }, true);

        // Fallback to regular device orientation
        window.addEventListener('deviceorientation', (event) => {
            console.log('deviceorientation event:', event.alpha, event.beta, event.gamma, event.absolute);
            this.hasReceivedData = true;
            this.handleOrientation(event);
        }, true);

        this.isTracking = true;
        console.log('Orientation event listeners added');
        
        // Test if events are firing
        setTimeout(() => {
            if (!this.hasReceivedData) {
                console.error('No orientation events received after 3 seconds!');
                console.log('This may indicate:');
                console.log('1. Not using HTTPS (required for motion sensors)');
                console.log('2. Motion sensors are disabled in browser settings');
                console.log('3. Device does not have required sensors');
            }
        }, 3000);
    }

    handleOrientationAbsolute(event) {
        // DeviceOrientationEvent with absolute = true provides compass heading
        // alpha: 0-360 degrees (0 = North, 90 = East, 180 = South, 270 = West)
        // beta: -180 to 180 degrees (pitch - forward/backward tilt)
        // gamma: -90 to 90 degrees (roll - left/right tilt)

        if (!this.hasReceivedData) {
            console.log('First orientation data received!');
            this.hasReceivedData = true;
        }

        let rawAlpha = event.alpha;
        let rawBeta = event.beta;
        let rawGamma = event.gamma;

        // Calculate pitch first (we need it for azimuth correction)
        if (rawBeta !== null) {
            // Normalize to -90 to 90 range where:
            // 0 = horizon (phone vertical, camera forward)
            // 90 = straight up (phone tilted back)
            // -90 = straight down (phone tilted forward)
            this.pitch = Math.round(rawBeta - 90);
            
            // Clamp to -90 to 90 range
            if (this.pitch > 90) this.pitch = 90;
            if (this.pitch < -90) this.pitch = -90;
        }

        if (rawAlpha !== null && rawBeta !== null) {
            // Convert alpha to azimuth (0 = North)
            let azimuth = rawAlpha;
            
            // IMPORTANT: Compensate for magnetometer reversal at high pitch angles
            // When the phone is tilted past ~45 degrees (pitch > -45), the magnetometer
            // reading flips by 180 degrees. We need to correct this.
            // The camera's forward direction should always represent the azimuth.
            
            // When pitch is high (phone tilted back, camera pointing up):
            // rawBeta ranges from ~90 to 180 (or -90 to -180 depending on device)
            // pitch ranges from 0 to 90 degrees
            
            if (this.pitch > 45) {
                // Phone is tilted significantly back (camera pointing upward)
                // Magnetometer reading is reversed, so flip it by 180 degrees
                azimuth = (rawAlpha + 180) % 360;
                console.log(`Pitch compensation applied: pitch=${this.pitch}°, raw alpha=${rawAlpha}°, corrected=${azimuth}°`);
            }
            
            this.azimuth = Math.round(azimuth);
            this.smoothedAzimuth = this.smoothAzimuth(this.azimuth);
        }

        this.updateDisplay();
        this.updateMapMarker();
    }

    handleOrientation(event) {
        // Fallback for devices without absolute orientation
        // Use webkitCompassHeading if available (iOS)
        
        if (!this.hasReceivedData) {
            console.log('First orientation data received (non-absolute)!');
            this.hasReceivedData = true;
        }
        
        let rawBeta = event.beta;
        
        // Calculate pitch first
        if (rawBeta !== null) {
            this.pitch = Math.round(rawBeta - 90);
            if (this.pitch > 90) this.pitch = 90;
            if (this.pitch < -90) this.pitch = -90;
        }
        
        // Handle azimuth with pitch compensation
        if (event.webkitCompassHeading !== undefined) {
            let azimuth = event.webkitCompassHeading;
            
            // Apply pitch compensation for iOS devices too
            if (this.pitch > 45) {
                azimuth = (azimuth + 180) % 360;
                console.log(`iOS Pitch compensation: pitch=${this.pitch}°, raw=${event.webkitCompassHeading}°, corrected=${azimuth}°`);
            }
            
            this.azimuth = Math.round(azimuth);
            this.smoothedAzimuth = this.smoothAzimuth(this.azimuth);
        } else if (event.alpha !== null) {
            // Approximate heading from alpha (may not be accurate without magnetometer)
            let azimuth = 360 - event.alpha;
            
            // Apply pitch compensation
            if (this.pitch > 45) {
                azimuth = (azimuth + 180) % 360;
            }
            
            this.azimuth = Math.round(azimuth);
            this.smoothedAzimuth = this.smoothAzimuth(this.azimuth);
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

    smoothAzimuth(newAzimuth) {
        // Add new reading to buffer
        this.azimuthBuffer.push(newAzimuth);
        
        // Keep buffer at specified size
        if (this.azimuthBuffer.length > this.bufferSize) {
            this.azimuthBuffer.shift();
        }
        
        // Handle wraparound at 0/360 degrees
        // Check if readings span across the 0/360 boundary
        const hasWraparound = this.azimuthBuffer.some(v => v < 90) && 
                              this.azimuthBuffer.some(v => v > 270);
        
        let average;
        if (hasWraparound) {
            // Normalize values for averaging across 0/360 boundary
            const normalized = this.azimuthBuffer.map(v => v < 180 ? v + 360 : v);
            average = normalized.reduce((a, b) => a + b, 0) / normalized.length;
            average = average % 360;
        } else {
            // Simple average
            average = this.azimuthBuffer.reduce((a, b) => a + b, 0) / this.azimuthBuffer.length;
        }
        
        return Math.round(average);
    }

    updateMapMarker() {
        // Update the map marker rotation if map manager is available
        // Use smoothed azimuth to reduce jitter
        if (window.mapManager && this.smoothedAzimuth !== null) {
            window.mapManager.updateUserLocationRotation(this.smoothedAzimuth);
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
