# Field Survey Documentation App

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

A Progressive Web App (PWA) for creating field survey documentation with GPS mapping capabilities. Built with vanilla JavaScript and Leaflet.js for maximum compatibility and performance.

## ✨ Features

- 📍 **Real-time GPS Tracking** - Continuous location monitoring with high accuracy
- 🗺️ **Interactive Maps** - Powered by Leaflet.js and OpenStreetMap
- 📱 **Mobile-First Design** - Optimized for phones and tablets
- 🔄 **Offline Support** - Works without internet connection after first load
- 🎯 **Location Accuracy Display** - Shows GPS precision with visual feedback
- 📊 **Live Coordinate Display** - Real-time latitude/longitude in the header
- ⚡ **Fast & Lightweight** - No heavy frameworks, just vanilla JS

## 🚀 Quick Start

### Option 1: View Live Demo

Visit the hosted version: [Add your GitHub Pages URL here]

### Option 2: Run Locally

## Getting Started

### Prerequisites

- A web browser (Chrome, Firefox, Safari, or Edge)
- A web server to serve the files (for HTTPS and PWA features)

### Installation

1. Serve the files using a local web server. For example, using Python:

   ```bash
   # Python 3
   python -m http.server 8000
   ```

   Or using Node.js with http-server:
   ```bash
   npx http-server -p 8000
   ```

2. Open your browser and navigate to `http://localhost:8000`

3. On mobile devices, you can install the app:
   - **Android**: Tap the menu and select "Add to Home Screen"
   - **iOS**: Tap the share button and select "Add to Home Screen"

### Usage

1. **Allow Location Access**: When prompted, grant location permissions to the app
2. **View Your Location**: The map will automatically center on your GPS coordinates
3. **Monitor Coordinates**: Your current latitude and longitude are displayed in the header
4. **Center on Location**: Tap the "Center on My Location" button to re-center the map

## Project Structure

```
PS_INTAKE_V1/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker for offline functionality
├── css/
│   └── styles.css         # Application styles
├── js/
│   ├── app.js            # Main application logic
│   └── map.js            # Map management with Leaflet
├── icons/                 # App icons (to be added)
└── README.md             # This file
```

## Technologies Used

- **HTML5 Geolocation API**: For GPS positioning
- **Leaflet.js**: Open-source mapping library
- **OpenStreetMap**: Map tile provider
- **Service Workers**: For PWA offline capabilities
- **Vanilla JavaScript**: No framework dependencies

## Browser Compatibility

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- Mobile browsers with GPS support

## Security Notes

- The Geolocation API requires HTTPS in production
- For local development, `localhost` is treated as a secure context
- Always request location permissions explicitly

## Future Enhancements

- Form inputs for survey data collection
- Photo capture and attachment
- Export to PDF/JPG
- Integration with Smartsheet API
- Offline data storage with IndexedDB
- Multiple survey point tracking
- Drawing tools for area marking

## License

This project is open source and available for modification.

## Support

For issues or questions, please refer to the documentation or contact the development team.
