from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import datetime
import threading
import time
import random

app = Flask(__name__)
CORS(app)

class ViolationWarningSystem:
    def __init__(self):
        self.monitoring_data = {
            'speed_limit': {'current': 0, 'limit': 60, 'threshold': 55},
            'temperature': {'current': 25, 'limit': 80, 'threshold': 75},
            'pressure': {'current': 1.0, 'limit': 5.0, 'threshold': 4.5},
            'noise_level': {'current': 40, 'limit': 85, 'threshold': 80},
            'air_quality': {'current': 50, 'limit': 150, 'threshold': 120}
        }
        self.violations = []
        self.warnings = []
        self.is_monitoring = False
        self.monitoring_thread = None
        
    def start_monitoring(self):
        if not self.is_monitoring:
            self.is_monitoring = True
            self.monitoring_thread = threading.Thread(target=self._monitor_loop)
            self.monitoring_thread.daemon = True
            self.monitoring_thread.start()
    
    def stop_monitoring(self):
        self.is_monitoring = False
    
    def _monitor_loop(self):
        while self.is_monitoring:
            self._simulate_data()
            self._check_violations()
            time.sleep(2)  # Check every 2 seconds
    
    def _simulate_data(self):
        # Simulate real-time data changes
        self.monitoring_data['speed_limit']['current'] = random.randint(30, 70)
        self.monitoring_data['temperature']['current'] = random.randint(20, 85)
        self.monitoring_data['pressure']['current'] = round(random.uniform(0.5, 5.5), 2)
        self.monitoring_data['noise_level']['current'] = random.randint(35, 90)
        self.monitoring_data['air_quality']['current'] = random.randint(30, 160)
    
    def _check_violations(self):
        current_time = datetime.datetime.now().isoformat()
        
        for param, data in self.monitoring_data.items():
            current = data['current']
            threshold = data['threshold']
            limit = data['limit']
            
            # Check for pre-violation warning
            if current >= threshold and current < limit:
                warning = {
                    'id': len(self.warnings) + 1,
                    'parameter': param,
                    'current_value': current,
                    'threshold': threshold,
                    'limit': limit,
                    'severity': 'warning',
                    'message': f'{param.replace("_", " ").title()} approaching limit',
                    'timestamp': current_time,
                    'percentage': round((current / limit) * 100, 1)
                }
                
                # Avoid duplicate warnings
                if not any(w['parameter'] == param and w['severity'] == 'warning' 
                          for w in self.warnings[-5:]):
                    self.warnings.append(warning)
            
            # Check for violation
            elif current >= limit:
                violation = {
                    'id': len(self.violations) + 1,
                    'parameter': param,
                    'current_value': current,
                    'limit': limit,
                    'severity': 'critical',
                    'message': f'{param.replace("_", " ").title()} limit exceeded!',
                    'timestamp': current_time,
                    'percentage': round((current / limit) * 100, 1)
                }
                
                # Avoid duplicate violations
                if not any(v['parameter'] == param and v['severity'] == 'critical' 
                          for v in self.violations[-5:]):
                    self.violations.append(violation)
        
        # Keep only last 50 entries
        self.warnings = self.warnings[-50:]
        self.violations = self.violations[-50:]

# Initialize the system
warning_system = ViolationWarningSystem()

@app.route('/api/start-monitoring', methods=['POST'])
def start_monitoring():
    warning_system.start_monitoring()
    return jsonify({'status': 'success', 'message': 'Monitoring started'})

@app.route('/api/stop-monitoring', methods=['POST'])
def stop_monitoring():
    warning_system.stop_monitoring()
    return jsonify({'status': 'success', 'message': 'Monitoring stopped'})

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        'monitoring': warning_system.is_monitoring,
        'data': warning_system.monitoring_data,
        'warnings_count': len(warning_system.warnings),
        'violations_count': len(warning_system.violations)
    })

@app.route('/api/warnings', methods=['GET'])
def get_warnings():
    return jsonify({
        'warnings': warning_system.warnings[-10:],  # Last 10 warnings
        'total': len(warning_system.warnings)
    })

@app.route('/api/violations', methods=['GET'])
def get_violations():
    return jsonify({
        'violations': warning_system.violations[-10:],  # Last 10 violations
        'total': len(warning_system.violations)
    })

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    # Combine recent warnings and violations
    recent_warnings = warning_system.warnings[-5:]
    recent_violations = warning_system.violations[-5:]
    
    all_alerts = recent_warnings + recent_violations
    all_alerts.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return jsonify({
        'alerts': all_alerts[:10],
        'total': len(all_alerts)
    })

@app.route('/api/update-thresholds', methods=['POST'])
def update_thresholds():
    data = request.json
    parameter = data.get('parameter')
    new_threshold = data.get('threshold')
    
    if parameter in warning_system.monitoring_data:
        warning_system.monitoring_data[parameter]['threshold'] = new_threshold
        return jsonify({'status': 'success', 'message': f'Threshold updated for {parameter}'})
    
    return jsonify({'status': 'error', 'message': 'Invalid parameter'}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)