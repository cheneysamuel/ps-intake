// Metadata Handler - Embeds GPS, azimuth, elevation, and timestamp into photos
class MetadataHandler {
    constructor() {
        this.exifLib = null;
    }

    /**
     * Add metadata to image and return data URL with embedded EXIF
     */
    async addMetadataToImage(imageDataUrl, metadata) {
        try {
            // For now, we'll create a text overlay with metadata
            // Full EXIF embedding requires a library like piexifjs
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            return new Promise((resolve, reject) => {
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;

                    // Draw original image
                    ctx.drawImage(img, 0, 0);

                    // Add metadata overlay at bottom
                    this.drawMetadataOverlay(ctx, canvas.width, canvas.height, metadata);

                    // Return new data URL
                    resolve(canvas.toDataURL('image/jpeg', 0.95));
                };

                img.onerror = reject;
                img.src = imageDataUrl;
            });
        } catch (error) {
            console.error('Error adding metadata:', error);
            return imageDataUrl; // Return original if fails
        }
    }

    /**
     * Draw metadata overlay on image
     */
    drawMetadataOverlay(ctx, width, height, metadata) {
        const padding = 10;
        const lineHeight = 20;
        const fontSize = 14;
        const overlayHeight = lineHeight * 6 + padding * 2;

        // Semi-transparent black background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, height - overlayHeight, width, overlayHeight);

        // White text
        ctx.fillStyle = 'white';
        ctx.font = `${fontSize}px monospace`;
        ctx.textAlign = 'left';

        let y = height - overlayHeight + padding + lineHeight;

        // Format and draw metadata
        const lines = [
            `Location: ${metadata.latitude.toFixed(6)}, ${metadata.longitude.toFixed(6)}`,
            `Azimuth: ${metadata.azimuth}° | Distance: ${metadata.distance}m`,
            `Elevation: ${metadata.elevation || 'N/A'}°`,
            `Date: ${metadata.datetime}`,
            `Timezone: ${metadata.timezone}`
        ];

        lines.forEach(line => {
            ctx.fillText(line, padding, y);
            y += lineHeight;
        });
    }

    /**
     * Create filename with metadata
     */
    createMetadataFilename(metadata) {
        const timestamp = metadata.datetime.replace(/[:\s]/g, '-').replace(/,/g, '');
        const lat = metadata.latitude.toFixed(6).replace('.', '_');
        const lon = metadata.longitude.toFixed(6).replace('.', '_');
        const azimuth = Math.round(metadata.azimuth);
        
        return `survey_${lat}_${lon}_az${azimuth}_${timestamp}.jpg`;
    }

    /**
     * Get current timezone info
     */
    getTimezoneInfo() {
        const now = new Date();
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const offset = -now.getTimezoneOffset();
        const offsetHours = Math.floor(Math.abs(offset) / 60);
        const offsetMinutes = Math.abs(offset) % 60;
        const offsetSign = offset >= 0 ? '+' : '-';
        const offsetString = `UTC${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
        
        return {
            name: timezone,
            offset: offsetString,
            full: `${timezone} (${offsetString})`
        };
    }

    /**
     * Format datetime with timezone
     */
    formatDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    /**
     * Prepare complete metadata object
     */
    prepareMetadata(pinData, compassData, userLocation) {
        const timezone = this.getTimezoneInfo();
        
        return {
            // Location data
            latitude: pinData.lat,
            longitude: pinData.lon,
            
            // Camera data
            azimuth: compassData.azimuth || 0,
            distance: compassData.distance || 0,
            elevation: compassData.elevation || null,
            
            // User position
            userLatitude: userLocation ? userLocation.lat : null,
            userLongitude: userLocation ? userLocation.lon : null,
            
            // Time data
            datetime: this.formatDateTime(),
            timezone: timezone.full,
            timestamp: Date.now(),
            
            // Additional
            accuracy: userLocation ? userLocation.accuracy : null,
            locked: compassData.locked || false
        };
    }

    /**
     * Create text file with metadata
     */
    createMetadataTextFile(metadata) {
        const content = `Field Survey Metadata
=====================

PIN LOCATION:
  Latitude:  ${metadata.latitude}
  Longitude: ${metadata.longitude}

CAMERA POSITION:
  User Lat:  ${metadata.userLatitude || 'N/A'}
  User Lon:  ${metadata.userLongitude || 'N/A'}
  Distance:  ${metadata.distance} meters
  Azimuth:   ${metadata.azimuth}° (from subject)
  Elevation: ${metadata.elevation || 'N/A'}°
  Accuracy:  ±${metadata.accuracy || 'N/A'} meters

TIMESTAMP:
  Date/Time: ${metadata.datetime}
  Timezone:  ${metadata.timezone}
  Unix Time: ${metadata.timestamp}

SETTINGS:
  Position Locked: ${metadata.locked ? 'Yes' : 'No'}

Generated by Field Survey App
`;
        return content;
    }

    /**
     * Download metadata as text file
     */
    downloadMetadataFile(metadata, filename) {
        const content = this.createMetadataTextFile(metadata);
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = filename.replace('.jpg', '_metadata.txt');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Make available globally
window.MetadataHandler = MetadataHandler;
