class EcoWiFiPortal {
  constructor() {
    this.statusElement = document.getElementById('status');
    this.statusText = document.getElementById('status-text');
    this.timerElement = document.getElementById('timer');
    this.minutesElement = document.getElementById('minutes');
    this.secondsElement = document.getElementById('seconds');
    this.bottleCountElement = document.getElementById('bottle-count');
    this.co2SavedElement = document.getElementById('co2-saved');

    this.macAddress = this.getMacAddress();
    this.pollingInterval = null;
    this.timerInterval = null;

    this.init();
  }

  init() {
    console.log('🚀 EcoWiFi Portal initialized');
    this.checkSession();
    this.startPolling();
    this.updateEnvironmentalStats();
  }

  getMacAddress() {
    // In a real implementation, this would come from the captive portal
    // For now, we'll generate a placeholder or use a stored value
    const stored = localStorage.getItem('ecowifi_mac');
    if (stored) return stored;

    // Generate a random MAC-like address for demo purposes
    const mac = '02:00:00:' + Math.random().toString(16).substr(2, 6).toUpperCase();
    localStorage.setItem('ecowifi_mac', mac);
    return mac;
  }

  async checkSession() {
    try {
      const response = await fetch(`/api/user/session/${this.macAddress}`);
      const data = await response.json();

      if (response.ok) {
        this.showActiveSession(data);
      } else {
        console.log('No active session found');
      }
    } catch (error) {
      console.log('Session check failed:', error);
    }
  }

  async startPolling() {
    // Poll for bottle detection every 2 seconds
    this.pollingInterval = setInterval(async () => {
      await this.checkBottleStatus();
    }, 2000);
  }

  async checkBottleStatus() {
    try {
      const response = await fetch('/api/bottle/status');
      const data = await response.json();

      if (data.bottleDetected) {
        await this.processBottleDeposit();
      }
    } catch (error) {
      console.error('Error checking bottle status:', error);
    }
  }

  async processBottleDeposit() {
    try {
      this.updateStatus('Processing bottle...', 'yellow');
      clearInterval(this.pollingInterval); // Stop polling during processing

      const response = await fetch('/api/bottle/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          macAddress: this.macAddress,
          weight: 25.5, // These would come from sensors
          size: 20.0
        })
      });

      const data = await response.json();

      if (response.ok) {
        this.updateStatus(data.message, 'green');
        this.startTimer();
        this.updateEnvironmentalStats();
        this.showSuccessMessage();
      } else {
        this.updateStatus(data.error || 'Failed to process bottle', 'red');
        this.startPolling(); // Resume polling on error
      }
    } catch (error) {
      this.updateStatus('Error processing bottle', 'red');
      this.startPolling(); // Resume polling on error
    }
  }

  updateStatus(message, type) {
    this.statusText.textContent = message;

    // Update status styling
    this.statusElement.className = `border-2 rounded-lg p-4 mb-6`;

    switch(type) {
      case 'green':
        this.statusElement.classList.add('bg-green-100', 'border-green-300');
        break;
      case 'yellow':
        this.statusElement.classList.add('bg-yellow-100', 'border-yellow-300');
        break;
      case 'red':
        this.statusElement.classList.add('bg-red-100', 'border-red-300');
        break;
      default:
        this.statusElement.classList.add('bg-gray-100', 'border-gray-300');
    }
  }

  startTimer() {
    this.timerElement.classList.remove('hidden');

    let timeLeft = 15 * 60; // 15 minutes in seconds

    this.timerInterval = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;

      this.minutesElement.textContent = minutes.toString().padStart(2, '0');
      this.secondsElement.textContent = seconds.toString().padStart(2, '0');

      if (timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.showExpiredMessage();
      }

      timeLeft--;
    }, 1000);
  }

  showActiveSession(data) {
    const remaining = Math.max(0, Math.floor((new Date(data.session_end) - new Date()) / 1000));
    if (remaining > 0) {
      this.updateStatus(`Active session: ${Math.floor(remaining / 60)} minutes remaining`, 'green');
      this.startTimer(remaining);
    }
  }

  showSuccessMessage() {
    setTimeout(() => {
      this.updateStatus('🎉 WiFi access granted! Enjoy your internet time.', 'green');
    }, 2000);
  }

  showExpiredMessage() {
    this.updateStatus('⏰ Session expired. Insert another bottle to continue.', 'red');
    this.timerElement.classList.add('hidden');
    this.startPolling(); // Resume polling for new bottles
  }

  async updateEnvironmentalStats() {
    try {
      const response = await fetch('/api/stats/dashboard');
      const data = await response.json();

      if (response.ok) {
        this.bottleCountElement.textContent = data.totalBottles || 0;
        this.co2SavedElement.textContent = ((data.totalBottles || 0) * 0.082).toFixed(2);
      }
    } catch (error) {
      console.error('Error updating environmental stats:', error);
    }
  }

  // Cleanup method
  destroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}

// Initialize portal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.ecoWiFiPortal = new EcoWiFiPortal();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.ecoWiFiPortal) {
    window.ecoWiFiPortal.destroy();
  }
});