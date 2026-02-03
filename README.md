# DriveSafe-AI
# Pre-Violation Warning System

A comprehensive monitoring system that provides early warnings before violations occur, built with Python Flask backend and JavaScript frontend.

## Features

### 🚨 Real-time Monitoring
- **Multi-parameter tracking**: Speed, temperature, pressure, noise level, air quality
- **Threshold-based warnings**: Configurable warning thresholds before critical limits
- **Visual indicators**: Color-coded status with progress bars
- **Live updates**: Real-time data refresh every 2 seconds

### ⚠️ Alert System
- **Pre-violation warnings**: Alerts when approaching limits (before violations)
- **Critical violation alerts**: Immediate notifications when limits exceeded
- **Audio alerts**: Sound notifications for critical violations
- **Modal popups**: Detailed alert information with acknowledgment
- **Alert history**: Track warnings and violations over time

### 🎛️ Control Panel
- **Start/Stop monitoring**: Easy control of the monitoring system
- **Status indicators**: Visual feedback of system state
- **Threshold configuration**: Adjustable warning thresholds for each parameter
- **Real-time counters**: Live count of warnings and violations

### 📊 Dashboard Features
- **Parameter cards**: Individual monitoring cards for each parameter
- **Progress visualization**: Visual representation of current values vs limits
- **Alert timeline**: Chronological display of recent alerts
- **Responsive design**: Works on desktop and mobile devices

## Technology Stack

### Backend (Python)
- **Flask**: Web framework for API endpoints
- **Flask-CORS**: Cross-origin resource sharing
- **Threading**: Background monitoring processes
- **JSON**: Data serialization and API responses

### Frontend (JavaScript)
- **Vanilla JavaScript**: No framework dependencies
- **Fetch API**: HTTP requests to backend
- **Web Audio API**: Alert sound generation
- **CSS Grid/Flexbox**: Responsive layout
- **Font Awesome**: Icons and visual elements

## Installation & Setup

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd violation-warning-system/backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the Flask server:
   ```bash
   python app.py
   ```
   Server will start on `http://localhost:5000`

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd violation-warning-system/frontend
   ```

2. Open `index.html` in your web browser or serve with a local server:
   ```bash
   # Using Python's built-in server
   python -m http.server 8000
   ```
   Then visit `http://localhost:8000`

## API Endpoints

### Monitoring Control
- `POST /api/start-monitoring` - Start the monitoring system
- `POST /api/stop-monitoring` - Stop the monitoring system
- `GET /api/status` - Get current system status and parameter values

### Data Retrieval
- `GET /api/warnings` - Get recent warning alerts
- `GET /api/violations` - Get recent violation alerts
- `GET /api/alerts` - Get combined recent alerts

### Configuration
- `POST /api/update-thresholds` - Update warning thresholds for parameters

## Parameter Monitoring

The system monitors these parameters with configurable thresholds:

| Parameter | Unit | Default Limit | Default Threshold |
|-----------|------|---------------|-------------------|
| Speed Limit | km/h | 60 | 55 |
| Temperature | °C | 80 | 75 |
| Pressure | bar | 5.0 | 4.5 |
| Noise Level | dB | 85 | 80 |
| Air Quality | AQI | 150 | 120 |

## Alert Levels

### Warning (Yellow)
- Triggered when parameter reaches threshold value
- Provides early warning before violation
- Allows time for corrective action

### Critical (Red)
- Triggered when parameter exceeds limit
- Immediate attention required
- Audio alert and modal popup
- Logged as violation

## Usage Instructions

1. **Start Monitoring**: Click "Start Monitoring" to begin real-time parameter tracking
2. **Monitor Dashboard**: Watch parameter cards for status changes
3. **Respond to Alerts**: Acknowledge alerts and take corrective action
4. **Adjust Thresholds**: Modify warning thresholds in the settings section
5. **Review History**: Check alert timeline for patterns and trends

## Customization

### Adding New Parameters
1. Update `monitoring_data` in `app.py`
2. Add parameter display logic in `script.js`
3. Include appropriate units and formatting

### Modifying Alert Logic
- Adjust threshold percentages in `_check_violations()`
- Customize alert messages and severity levels
- Add new alert types or conditions

### UI Customization
- Modify CSS variables for colors and styling
- Adjust grid layouts and responsive breakpoints
- Add new dashboard sections or widgets

## Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Security Considerations
- CORS enabled for development (configure for production)
- No authentication implemented (add as needed)
- Input validation on threshold updates
- Rate limiting recommended for production use
