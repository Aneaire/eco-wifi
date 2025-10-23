# ESP32 Integration Guide for RecyFi

## Overview

This guide provides detailed instructions for integrating ESP32 microcontrollers with the RecyFi system to create an automated plastic detection and WiFi access system.

## Hardware Requirements

### ESP32 Components
- **ESP32 Development Board** (ESP32-DevKitC or similar)
- **HC-SR04 Ultrasonic Sensors** (2 units)
  - Top sensor: Object/plastic detection
  - Bottom sensor: Bin level monitoring
- **MG996R Servo Motor** (Optional: for sorting mechanism)
- **SparkFun AS7265x Triad Spectroscopy Sensor** (Optional: material verification)
- **LED Indicators** (RGB LED for status)
- **Push Button** (Manual override/testing)
- **Jumper Wires & Breadboard**

### Pin Configuration
```
// Ultrasonic Sensors
#define TRIG_PIN_TOP    4
#define ECHO_PIN_TOP    2
#define TRIG_PIN_BOTTOM 16
#define ECHO_PIN_BOTTOM 17

// Servo Motor
#define SERVO_PIN       5

// LED Indicators
#define LED_RED         25
#define LED_GREEN       26
#define LED_BLUE        27

// Push Button
#define BUTTON_PIN      34

// Spectroscopy Sensor (I2C)
#define SDA_PIN         21
#define SCL_PIN         22
```

---

## Software Setup

### Arduino IDE Configuration
1. Install Arduino IDE 2.0+
2. Add ESP32 Board Manager:
   - File → Preferences → Additional Board Manager URLs:
   - `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. Install ESP32 boards: Tools → Board → Boards Manager → Search "ESP32"
4. Select Board: Tools → Board → ESP32 Arduino → ESP32 Dev Module

### Required Libraries
Install these libraries via Arduino IDE Library Manager:
- `WiFi` (built-in)
- `HTTPClient` (built-in)
- `ArduinoJson` (by Benoit Blanchon)
- `NewPing` (by Tim Eckel) - for ultrasonic sensors
- `Servo` (built-in)
- `Wire` (built-in) - for I2C communication

---

## Network Configuration

### WiFi Settings
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://10.55.11.97:9999";
```

### MAC Address Generation
Each ESP32 device needs a unique MAC address for user identification:

```cpp
String generateMacAddress() {
  uint64_t chipid = ESP.getEfuseMac();
  String mac = "REC:ESP32:";
  mac += String((chipid >> 32) & 0xFF, HEX);
  mac += String((chipid >> 24) & 0xFF, HEX);
  mac += String((chipid >> 16) & 0xFF, HEX);
  mac.toUpperCase();
  return mac;
}
```

---

## Core API Integration

### 1. Plastic Deposit Endpoint

**Endpoint**: `POST /api/bottle/deposit`  
**Purpose**: Record plastic insertion and grant WiFi access

```cpp
bool recordPlasticDeposit(String macAddress) {
  HTTPClient http;
  http.begin(serverUrl + "/api/bottle/deposit");
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{\"macAddress\":\"" + macAddress + "\"}";
  
  int httpResponseCode = http.POST(payload);
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, response);
    
    bool success = doc["success"];
    if (success) {
      Serial.println("✅ WiFi access granted!");
      return true;
    }
  } else {
    Serial.println("❌ Failed to record deposit");
  }
  
  http.end();
  return false;
}
```

### 2. Check System Status

**Endpoint**: `GET /api/bottle/status`  
**Purpose**: Check if system is ready for new deposits

```cpp
bool checkSystemStatus() {
  HTTPClient http;
  http.begin(serverUrl + "/api/bottle/status");
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    DynamicJsonDocument doc(256);
    deserializeJson(doc, response);
    
    bool bottleDetected = doc["bottleDetected"];
    return !bottleDetected; // Return true if ready for new deposit
  }
  
  http.end();
  return false;
}
```

### 3. Get User Session Info

**Endpoint**: `GET /api/user/session/{macAddress}`  
**Purpose**: Check current user session status

```cpp
bool checkUserSession(String macAddress) {
  HTTPClient http;
  String url = serverUrl + "/api/user/session/" + macAddress;
  http.begin(url);
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, response);
    
    String status = doc["status"];
    return status == "active";
  }
  
  http.end();
  return false;
}
```

---

## Sensor Integration

### Ultrasonic Sensor Reading

```cpp
#include <NewPing.h>

NewPing topSensor(TRIG_PIN_TOP, ECHO_PIN_TOP, 200);
NewPing bottomSensor(TRIG_PIN_BOTTOM, ECHO_PIN_BOTTOM, 200);

bool detectPlasticInsertion() {
  int distance = topSensor.ping_cm();
  
  // Object detected within 10cm
  if (distance > 0 && distance < 10) {
    Serial.println("🔍 Object detected at distance: " + String(distance) + "cm");
    return true;
  }
  
  return false;
}

int getBinLevel() {
  int distance = bottomSensor.ping_cm();
  
  if (distance > 0) {
    // Calculate fill percentage (assuming max bin height of 50cm)
    int fillPercentage = ((50 - distance) * 100) / 50;
    return constrain(fillPercentage, 0, 100);
  }
  
  return 0;
}
```

### Debounce Logic

```cpp
unsigned long lastDetectionTime = 0;
const int DEBOUNCE_DELAY = 5000; // 5 seconds between deposits

bool shouldProcessDeposit() {
  unsigned long currentTime = millis();
  
  if (currentTime - lastDetectionTime > DEBOUNCE_DELAY) {
    lastDetectionTime = currentTime;
    return true;
  }
  
  return false;
}
```

---

## LED Status Indicators

```cpp
void setLEDStatus(String status) {
  // All LEDs off
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_BLUE, LOW);
  
  if (status == "ready") {
    digitalWrite(LED_GREEN, HIGH);    // Green = Ready
  } else if (status == "processing") {
    digitalWrite(LED_BLUE, HIGH);     // Blue = Processing
  } else if (status == "success") {
    digitalWrite(LED_GREEN, HIGH);    // Green = Success
  } else if (status == "error") {
    digitalWrite(LED_RED, HIGH);      // Red = Error
  } else if (status == "full") {
    digitalWrite(LED_RED, HIGH);      // Red = Bin Full
    digitalWrite(LED_BLUE, HIGH);     // Purple = Full
  }
}
```

---

## Main Program Flow

```cpp
void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  
  // Connect to WiFi
  connectToWiFi();
  
  // Generate device MAC address
  deviceMacAddress = generateMacAddress();
  
  Serial.println("🚀 RecyFi ESP32 Ready!");
  setLEDStatus("ready");
}

void loop() {
  // Check bin level
  int binLevel = getBinLevel();
  if (binLevel > 80) {
    setLEDStatus("full");
    Serial.println("⚠️ Bin is " + String(binLevel) + "% full");
    delay(10000);
    return;
  }
  
  // Check for plastic insertion
  if (detectPlasticInsertion() && shouldProcessDeposit()) {
    processPlasticDeposit();
  }
  
  // Check manual button (for testing)
  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(50); // Debounce
    if (digitalRead(BUTTON_PIN) == LOW) {
      processPlasticDeposit();
      while (digitalRead(BUTTON_PIN) == LOW); // Wait for release
    }
  }
  
  delay(100); // Main loop delay
}

void processPlasticDeposit() {
  setLEDStatus("processing");
  Serial.println("🔄 Processing plastic deposit...");
  
  // Check system status
  if (!checkSystemStatus()) {
    setLEDStatus("error");
    Serial.println("❌ System not ready");
    delay(2000);
    setLEDStatus("ready");
    return;
  }
  
  // Record deposit
  if (recordPlasticDeposit(deviceMacAddress)) {
    setLEDStatus("success");
    Serial.println("✅ Deposit successful! WiFi access granted.");
    
    // Optional: Activate servo for sorting
    // activateServo();
    
    delay(3000); // Show success for 3 seconds
  } else {
    setLEDStatus("error");
    Serial.println("❌ Deposit failed");
    delay(2000);
  }
  
  setLEDStatus("ready");
}
```

---

## WiFi Connection Management

```cpp
void connectToWiFi() {
  Serial.println("📶 Connecting to WiFi...");
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.println("IP address: " + WiFi.localIP().toString());
    setLEDStatus("ready");
  } else {
    Serial.println("\n❌ Failed to connect to WiFi");
    setLEDStatus("error");
  }
}

void checkWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("🔄 WiFi disconnected. Reconnecting...");
    connectToWiFi();
  }
}
```

---

## Error Handling & Recovery

### Network Error Handling
```cpp
bool makeHTTPRequest(String endpoint, String payload = "") {
  HTTPClient http;
  http.begin(serverUrl + endpoint);
  
  if (payload != "") {
    http.addHeader("Content-Type", "application/json");
  }
  
  int maxRetries = 3;
  int retryCount = 0;
  
  while (retryCount < maxRetries) {
    int httpResponseCode = payload != "" ? http.POST(payload) : http.GET();
    
    if (httpResponseCode == 200) {
      http.end();
      return true;
    }
    
    Serial.println("❌ Request failed, retry " + String(retryCount + 1));
    retryCount++;
    delay(1000);
  }
  
  http.end();
  return false;
}
```

### Watchdog Timer
```cpp
#include <esp_task_wdt.h>

void setup() {
  // ... other setup code
  
  // Enable watchdog timer (30 seconds)
  esp_task_wdt_init(30, true);
  esp_task_wdt_add(NULL);
}

void loop() {
  // Reset watchdog timer
  esp_task_wdt_reset();
  
  // ... main loop code
}
```

---

## Configuration Options

### Timing Settings
```cpp
// Detection timing
const int DEBOUNCE_DELAY = 5000;        // 5 seconds between deposits
const int DETECTION_TIMEOUT = 10000;    // 10 seconds timeout
const int SUCCESS_DISPLAY_TIME = 3000;  // 3 seconds success display

// Sensor settings
const int MAX_DETECTION_DISTANCE = 10;  // 10cm detection range
const int BIN_FULL_THRESHOLD = 80;      // 80% full threshold
```

### Feature Flags
```cpp
// Enable/disable features
#define ENABLE_SERVO           false
#define ENABLE_SPECTROSCOPY    false
#define ENABLE_WATCHDOG        true
#define DEBUG_MODE            true
```

---

## Testing & Debugging

### Serial Monitor Output
```cpp
void debugPrint(String message) {
  #ifdef DEBUG_MODE
    Serial.println("[DEBUG] " + message);
  #endif
}
```

### Manual Testing Button
The push button allows manual testing without actual plastic:
- Press and release to simulate plastic insertion
- LED indicators show system response
- Serial monitor displays detailed logs

### Test Scenarios
1. **Normal Operation**: Insert plastic → LED turns blue → green → success
2. **Bin Full**: LED shows purple when bin >80% full
3. **Network Error**: LED shows red if WiFi/API fails
4. **Manual Test**: Press button to simulate deposit

---

## Deployment Checklist

### Hardware Setup
- [ ] ESP32 properly powered (5V or 3.3V)
- [ ] Sensors connected to correct pins
- [ ] LED indicators working
- [ ] Push button functional
- [ ] Bin properly calibrated

### Software Configuration
- [ ] WiFi credentials configured
- [ ] Server URL set correctly
- [ ] MAC address generation working
- [ ] All libraries installed
- [ ] Code compiled without errors

### Network Testing
- [ ] ESP32 connects to WiFi
- [ ] Can reach RecyFi server
- [ ] API endpoints respond correctly
- [ ] Error handling works

### Final Testing
- [ ] Plastic detection works
- [ ] Deposit recording successful
- [ ] LED indicators accurate
- [ ] Bin level monitoring works
- [ ] Manual override functional

---

## Troubleshooting

### Common Issues

**ESP32 won't connect to WiFi**
- Check SSID and password
- Verify 2.4GHz network (ESP32 doesn't support 5GHz)
- Check signal strength

**API calls failing**
- Verify server URL: `http://10.55.11.97:9999`
- Check network connectivity
- Monitor server logs for errors

**False detections**
- Adjust detection distance threshold
- Add debounce delay
- Check sensor positioning

**LED not working**
- Verify pin connections
- Check LED polarity
- Test with simple blink sketch

### Serial Monitor Debugging
Enable detailed logging to identify issues:
```cpp
Serial.println("🔍 Distance: " + String(distance) + "cm");
Serial.println("📡 API Response: " + response);
Serial.println("🔗 WiFi Status: " + String(WiFi.status()));
```

---

## Future Enhancements

### Planned Features
1. **Material Verification**: AS7265x spectroscopy sensor integration
2. **Sorting Mechanism**: Servo-controlled plastic sorting
3. **Real-time Updates**: WebSocket integration for live status
4. **Battery Backup**: UPS for power outages
5. **Multiple Bins**: Support for multiple recycling bins

### Advanced Configuration
- OTA (Over-The-Air) updates
- Remote configuration via API
- Sensor calibration routines
- Performance monitoring

---

## Support

For technical support:
1. Check the RecyFi API documentation
2. Review Arduino Serial Monitor output
3. Verify network connectivity
4. Test with manual override button

**Last Updated**: October 22, 2025  
**Compatible with RecyFi API v1.0.0**