class ViolationWarningSystem {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.isMonitoring = false;
        this.updateInterval = null;
        this.alertSound = null;
        
        this.initializeElements();
        this.bindEvents();
        this.initializeAudio();
        this.loadInitialData();
    }

    initializeElements() {
        // Control elements
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.statusText = document.getElementById('statusText');
        this.statusLight = document.getElementById('statusLight');
        
        // Display elements
        this.parametersGrid = document.getElementById('parametersGrid');
        this.alertsContainer = document.getElementById('alertsContainer');
        this.settingsGrid = document.getElementById('settingsGrid');
        this.warningCount = document.getElementById('warningCount');
        this.violationCount = document.getElementById('violationCount');
        
        // Modal elements
        this.alertModal = document.getElementById('alertModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalMessage = document.getElementById('modalMessage');
        this.modalParameter = document.getElementById('modalParameter');
        this.modalCurrentValue = document.getElementById('modalCurrentValue');
        this.modalLimit = document.getElementById('modalLimit');
        this.modalTime = document.getElementById('modalTime');
        this.closeModal = document.getElementById('closeModal');
        this.acknowledgeBtn = document.getElementById('acknowledgeBtn');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startMonitoring());
        this.stopBtn.addEventListener('click', () => this.stopMonitoring());
        
        // Modal events
        this.closeModal.addEventListener('click', () => this.hideModal());
        this.acknowledgeBtn.addEventListener('click', () => this.hideModal());
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === this.alertModal) {
                this.hideModal();
            }
        });
    }

    initializeAudio() {
        // Create audio context for alert sounds
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Audio context not supported');
        }
    }

    async loadInitialData() {
        try {
            await this.updateStatus();
            await this.updateAlerts();
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showError('Failed to connect to server');
        }
    }

    async startMonitoring() {
        try {
            const response = await fetch(`${this.apiUrl}/start-monitoring`, {
                method: 'POST'
            });
            
            if (response.ok) {
                this.isMonitoring = true;
                this.updateUI();
                this.startPeriodicUpdates();
                this.showSuccess('Monitoring started successfully');
            }
        } catch (error) {
            console.error('Failed to start monitoring:', error);
            this.showError('Failed to start monitoring');
        }
    }

    async stopMonitoring() {
        try {
            const response = await fetch(`${this.apiUrl}/stop-monitoring`, {
                method: 'POST'
            });
            
            if (response.ok) {
                this.isMonitoring = false;
                this.updateUI();
                this.stopPeriodicUpdates();
                this.showSuccess('Monitoring stopped');
            }
        } catch (error) {
            console.error('Failed to stop monitoring:', error);
            this.showError('Failed to stop monitoring');
        }
    }

    updateUI() {
        if (this.isMonitoring) {
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.statusText.textContent = 'Running';
            this.statusLight.className = 'status-light running';
        } else {
            this.startBtn.disabled = false;
            this.stopBtn.disabled = true;
            this.statusText.textContent = 'Stopped';
            this.statusLight.className = 'status-light stopped';
        }
    }

    startPeriodicUpdates() {
        this.updateInterval = setInterval(() => {
            this.updateStatus();
            this.updateAlerts();
        }, 2000); // Update every 2 seconds
    }

    stopPeriodicUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    async updateStatus() {
        try {
            const response = await fetch(`${this.apiUrl}/status`);
            const data = await response.json();
            
            this.isMonitoring = data.monitoring;
            this.updateUI();
            this.updateParametersDisplay(data.data);
            this.updateCounters(data.warnings_count, data.violations_count);
            this.updateSettings(data.data);
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    }

    updateParametersDisplay(data) {
        this.parametersGrid.innerHTML = '';
        
        Object.entries(data).forEach(([param, values]) => {
            const card = this.createParameterCard(param, values);
            this.parametersGrid.appendChild(card);
        });
    }

    createParameterCard(param, values) {
        const { current, limit, threshold } = values;
        const percentage = (current / limit) * 100;
        
        let status = 'normal';
        let statusText = 'Normal';
        let cardClass = '';
        
        if (current >= limit) {
            status = 'critical';
            statusText = 'Critical';
            cardClass = 'critical';
        } else if (current >= threshold) {
            status = 'warning';
            statusText = 'Warning';
            cardClass = 'warning';
        }

        const card = document.createElement('div');
        card.className = `parameter-card ${cardClass}`;
        card.innerHTML = `
            <div class="parameter-header">
                <div class="parameter-name">${param.replace('_', ' ')}</div>
                <div class="parameter-status status-${status}">${statusText}</div>
            </div>
            <div class="parameter-value">${current}${this.getUnit(param)}</div>
            <div class="parameter-limits">
                <span>Threshold: ${threshold}</span>
                <span>Limit: ${limit}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill ${status}" style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
        `;
        
        return card;
    }

    getUnit(param) {
        const units = {
            'speed_limit': ' km/h',
            'temperature': '°C',
            'pressure': ' bar',
            'noise_level': ' dB',
            'air_quality': ' AQI'
        };
        return units[param] || '';
    }

    async updateAlerts() {
        try {
            const response = await fetch(`${this.apiUrl}/alerts`);
            const data = await response.json();
            
            this.displayAlerts(data.alerts);
            
            // Check for new critical alerts
            const newCriticalAlerts = data.alerts.filter(alert => 
                alert.severity === 'critical' && 
                this.isRecentAlert(alert.timestamp)
            );
            
            if (newCriticalAlerts.length > 0) {
                this.playAlertSound();
                this.showAlertModal(newCriticalAlerts[0]);
            }
        } catch (error) {
            console.error('Failed to update alerts:', error);
        }
    }

    displayAlerts(alerts) {
        if (alerts.length === 0) {
            this.alertsContainer.innerHTML = `
                <div class="no-alerts">
                    <i class="fas fa-check-circle"></i>
                    <p>No active alerts</p>
                </div>
            `;
            return;
        }

        this.alertsContainer.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.severity}" onclick="violationSystem.showAlertModal(${JSON.stringify(alert).replace(/"/g, '&quot;')})">
                <div class="alert-header">
                    <div class="alert-title">
                        <i class="fas ${alert.severity === 'critical' ? 'fa-times-circle' : 'fa-exclamation-circle'}"></i>
                        ${alert.parameter.replace('_', ' ').toUpperCase()}
                    </div>
                    <div class="alert-time">${this.formatTime(alert.timestamp)}</div>
                </div>
                <div class="alert-message">${alert.message}</div>
                <div class="alert-details">
                    Current: ${alert.current_value}${this.getUnit(alert.parameter)} | 
                    Limit: ${alert.limit}${this.getUnit(alert.parameter)} | 
                    ${alert.percentage}% of limit
                </div>
            </div>
        `).join('');
    }

    updateCounters(warnings, violations) {
        this.warningCount.textContent = warnings;
        this.violationCount.textContent = violations;
    }

    updateSettings(data) {
        this.settingsGrid.innerHTML = '';
        
        Object.entries(data).forEach(([param, values]) => {
            const setting = this.createSettingItem(param, values);
            this.settingsGrid.appendChild(setting);
        });
    }

    createSettingItem(param, values) {
        const setting = document.createElement('div');
        setting.className = 'setting-item';
        setting.innerHTML = `
            <div class="setting-label">${param.replace('_', ' ')} Threshold</div>
            <input type="number" 
                   class="setting-input" 
                   value="${values.threshold}" 
                   min="0" 
                   max="${values.limit}"
                   onchange="violationSystem.updateThreshold('${param}', this.value)">
            <small>Current limit: ${values.limit}${this.getUnit(param)}</small>
        `;
        
        return setting;
    }

    async updateThreshold(parameter, newThreshold) {
        try {
            const response = await fetch(`${this.apiUrl}/update-thresholds`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    parameter: parameter,
                    threshold: parseFloat(newThreshold)
                })
            });
            
            if (response.ok) {
                this.showSuccess(`Threshold updated for ${parameter.replace('_', ' ')}`);
            }
        } catch (error) {
            console.error('Failed to update threshold:', error);
            this.showError('Failed to update threshold');
        }
    }

    showAlertModal(alert) {
        this.modalTitle.textContent = `${alert.severity.toUpperCase()} Alert`;
        this.modalMessage.textContent = alert.message;
        this.modalParameter.textContent = alert.parameter.replace('_', ' ').toUpperCase();
        this.modalCurrentValue.textContent = `${alert.current_value}${this.getUnit(alert.parameter)}`;
        this.modalLimit.textContent = `${alert.limit}${this.getUnit(alert.parameter)}`;
        this.modalTime.textContent = this.formatTime(alert.timestamp);
        
        this.alertModal.style.display = 'block';
    }

    hideModal() {
        this.alertModal.style.display = 'none';
    }

    playAlertSound() {
        if (!this.audioContext) return;
        
        try {
            // Create a simple beep sound
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        } catch (error) {
            console.warn('Failed to play alert sound:', error);
        }
    }

    isRecentAlert(timestamp) {
        const alertTime = new Date(timestamp);
        const now = new Date();
        return (now - alertTime) < 5000; // Within last 5 seconds
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString();
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1001;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the system when DOM is loaded
let violationSystem;
document.addEventListener('DOMContentLoaded', () => {
    violationSystem = new ViolationWarningSystem();
});