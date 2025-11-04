// Map management using Leaflet
class MapManager {
    constructor() {
        this.map = null;
        this.userMarker = null;
        this.accuracyCircle = null;
        this.defaultZoom = 16;
        this.init();
    }

    init() {
        console.log('Initializing map...');
        
        // Check if Leaflet is loaded
        if (typeof L === 'undefined') {
            console.error('Leaflet library not loaded!');
            return;
        }
        
        try {
            // Initialize map
            this.map = L.map('map', {
                zoomControl: true,
                attributionControl: true,
                preferCanvas: false
            }).setView([0, 0], 2); // Default view, will update with GPS

            console.log('Map object created');

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
                minZoom: 1
            }).addTo(this.map);

            console.log('Map tiles added');

            // Add scale control
            L.control.scale({
                imperial: true,
                metric: true
            }).addTo(this.map);

            // Add click event to drop pins
            this.map.on('click', (e) => {
                console.log('Map click event fired!');
                this.onMapClick(e);
            });

            console.log('Map click listener added');

            // Force map to recalculate size after a short delay
            setTimeout(() => {
                this.map.invalidateSize();
                console.log('Map size invalidated');
            }, 250);

            console.log('Map initialized successfully');
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }

    onMapClick(e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;
        
        console.log('Map clicked at:', lat, lon);
        console.log('Pin manager available?', !!window.pinManager);
        
        // Notify pin manager if available
        if (window.pinManager) {
            console.log('Calling pinManager.createPin()');
            window.pinManager.createPin(lat, lon);
        } else {
            console.error('Pin manager not initialized yet!');
            alert('Pin manager not ready. Please refresh the page.');
        }
    }

    updateUserLocation(lat, lon, accuracy) {
        // Remove existing marker and circle if they exist
        if (this.userMarker) {
            this.map.removeLayer(this.userMarker);
        }
        if (this.accuracyCircle) {
            this.map.removeLayer(this.accuracyCircle);
        }

        // Create custom icon for user location
        const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: '<div style="background-color: #2196F3; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        // Add marker at current position
        this.userMarker = L.marker([lat, lon], {
            icon: userIcon,
            title: 'Your Location'
        }).addTo(this.map);

        // Add popup to marker
        this.userMarker.bindPopup(`
            <strong>Your Location</strong><br>
            Latitude: ${lat.toFixed(6)}<br>
            Longitude: ${lon.toFixed(6)}<br>
            Accuracy: ±${accuracy.toFixed(0)}m
        `);

        // Add accuracy circle
        this.accuracyCircle = L.circle([lat, lon], {
            radius: accuracy,
            color: '#2196F3',
            fillColor: '#2196F3',
            fillOpacity: 0.1,
            weight: 1
        }).addTo(this.map);

        // Center map on first location update
        if (!this.hasBeenCentered) {
            this.centerMap(lat, lon);
            this.hasBeenCentered = true;
        }
    }

    centerMap(lat, lon, zoom = this.defaultZoom) {
        this.map.setView([lat, lon], zoom, {
            animate: true,
            duration: 0.5
        });
    }

    addMarker(lat, lon, title = '', description = '') {
        const marker = L.marker([lat, lon]).addTo(this.map);
        
        if (title || description) {
            let popupContent = '';
            if (title) popupContent += `<strong>${title}</strong><br>`;
            if (description) popupContent += description;
            marker.bindPopup(popupContent);
        }
        
        return marker;
    }

    addCustomPin(lat, lon, pinData = null) {
        // Create custom pin icon
        const pinIcon = L.divIcon({
            className: 'custom-pin-marker',
            html: '<div class="custom-pin-marker"></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });

        const marker = L.marker([lat, lon], {
            icon: pinIcon,
            draggable: false
        }).addTo(this.map);

        // Add click event to open modal for editing
        marker.on('click', (e) => {
            console.log('Pin clicked at:', lat, lon);
            L.DomEvent.stopPropagation(e); // Prevent map click event
            
            if (window.pinManager && pinData) {
                window.pinManager.editPin(pinData);
            }
        });

        return marker;
    }

    removeMarker(marker) {
        if (marker) {
            this.map.removeLayer(marker);
        }
    }

    getMap() {
        return this.map;
    }
}

// Initialize map when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mapManager = new MapManager();
});
