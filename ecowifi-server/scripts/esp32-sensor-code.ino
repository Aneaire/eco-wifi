/*
 * EcoWiFi ESP32 Sensor Controller
 * Handles bottle detection and communicates with the main server
 * 
 * Hardware Connections:
 * - HC-SR04 Ultrasonic (Top): GPIO 5 (Trigger), GPIO 18 (Echo)
 * - HC-SR04 Ultrasonic (Bottom): GPIO 19 (Trigger), GPIO 22 (Echo)  
 * - MG996R Servo Motor: GPIO 21 (PWM)
 * - AS7265x Spectroscopy Sensor: I2C (SDA: GPIO 23, SCL: GPIO 4)
 * - W5500 Ethernet Module: SPI (MISO: GPIO 19, MOSI: GPIO 23, SCK: GPIO 18, CS: GPIO 5)
 */

#include <WiFi.h>
#include <Ethernet.h>
#include <SPI.h>
#include <HX711.h>
#include <NewPing.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>

// Network Configuration
const char* ssid = "EcoWiFi-Setup";
const char* password = "setup1234";
const char* serverHost = "192.168.1.10"; // Orange Pi One IP
const int serverPort = 3001;

// W5500 Ethernet Configuration
uint8_t mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
IPAddress ip(192, 168, 1, 20);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);

// Sensor Pin Definitions
#define TOP_ULTRASONIC_TRIGGER 5
#define TOP_ULTRASONIC_ECHO 18
#define BOTTOM_ULTRASONIC_TRIGGER 19
#define BOTTOM_ULTRASONIC_ECHO 22
#define SERVO_PIN 21
#define LOAD_CELL_DOUT 25
#define LOAD_CELL_SCK 26
#define IR_SENSOR_PIN 27

// Sensor Objects
NewPing topSonar(TOP_ULTRASONIC_TRIGGER, TOP_ULTRASONIC_ECHO, 200);
NewPing bottomSonar(BOTTOM_ULTRASONIC_TRIGGER, BOTTOM_ULTRASONIC_ECHO, 200);
HX711 loadCell;

// Variables
bool bottleDetected = false;
unsigned long lastDetectionTime = 0;
const unsigned long detectionCooldown = 5000; // 5 seconds between detections
float calibrationFactor = 2280.0;

void setup() {
  Serial.begin(115200);
  Serial.println("🚀 EcoWiFi ESP32 Sensor Controller Starting...");
  
  // Initialize pins
  pinMode(IR_SENSOR_PIN, INPUT_PULLUP);
  pinMode(SERVO_PIN, OUTPUT);
  
  // Initialize load cell
  loadCell.begin(LOAD_CELL_DOUT, LOAD_CELL_SCK);
  loadCell.set_scale(calibrationFactor);
  loadCell.tare();
  Serial.println("⚖️  Load cell initialized");
  
  // Initialize I2C for spectroscopy sensor
  Wire.begin(23, 4); // SDA, SCL
  Serial.println("🔬 I2C initialized for spectroscopy sensor");
  
  // Initialize Ethernet
  Ethernet.begin(mac, ip, gateway, subnet);
  
  if (Ethernet.hardwareStatus() == EthernetNoHardware) {
    Serial.println("❌ Ethernet shield not found");
    while (true) {
      delay(1000);
    }
  }
  
  Serial.print("🌐 Ethernet IP: ");
  Serial.println(Ethernet.localIP());
  
  // Test server connection
  if (testServerConnection()) {
    Serial.println("✅ Server connection successful");
  } else {
    Serial.println("⚠️  Server connection failed, will retry...");
  }
  
  Serial.println("🎯 System ready for bottle detection");
}

void loop() {
  checkForBottle();
  delay(100); // Check every 100ms
}

void checkForBottle() {
  unsigned long currentTime = millis();
  
  // Check cooldown period
  if (currentTime - lastDetectionTime < detectionCooldown) {
    return;
  }
  
  // Check IR sensor for bottle presence
  bool irDetected = digitalRead(IR_SENSOR_PIN) == LOW;
  
  if (irDetected) {
    Serial.println("🔍 IR sensor detected object");
    
    // Get measurements
    float topDistance = getTopDistance();
    float bottomDistance = getBottomDistance();
    float weight = getWeight();
    
    Serial.printf("📏 Measurements - Top: %.2fcm, Bottom: %.2fcm, Weight: %.2fg\n", 
                  topDistance, bottomDistance, weight);
    
    // Validate bottle
    if (isValidBottle(topDistance, bottomDistance, weight)) {
      Serial.println("✅ Valid bottle detected!");
      
      // Get material analysis
      String material = analyzeMaterial();
      
      // Send data to server
      if (sendBottleData(weight, topDistance, material)) {
        Serial.println("📤 Bottle data sent successfully");
        
        // Activate servo for sorting
        activateSortingMechanism();
        
        lastDetectionTime = currentTime;
        bottleDetected = true;
      } else {
        Serial.println("❌ Failed to send bottle data");
      }
    } else {
      Serial.println("❌ Invalid bottle detected");
    }
  }
}

float getTopDistance() {
  unsigned int uS = topSonar.ping_median(5);
  return uS / US_ROUNDTRIP_CM;
}

float getBottomDistance() {
  unsigned int uS = bottomSonar.ping_median(5);
  return uS / US_ROUNDTRIP_CM;
}

float getWeight() {
  if (loadCell.is_ready()) {
    return loadCell.get_units(10);
  }
  return 0.0;
}

bool isValidBottle(float topDistance, float bottomDistance, float weight) {
  // Check if object is within expected range
  bool validTop = topDistance > 5 && topDistance < 50; // 5-50cm
  bool validBottom = bottomDistance > 10 && bottomDistance < 100; // 10-100cm
  bool validWeight = weight > 10 && weight < 500; // 10-500g
  
  return validTop && validBottom && validWeight;
}

String analyzeMaterial() {
  // Simplified material analysis
  // In production, this would use the AS7265x spectroscopy sensor
  
  Wire.beginTransmission(0x49); // AS7265x I2C address
  if (Wire.endTransmission() == 0) {
    // Read sensor data (simplified)
    Wire.requestFrom(0x49, 6);
    if (Wire.available() >= 6) {
      int red = Wire.read();
      int orange = Wire.read();
      int yellow = Wire.read();
      int green = Wire.read();
      int blue = Wire.read();
      int violet = Wire.read();
      
      // Simple material classification based on spectral signature
      if (red > 100 && blue < 50) {
        return "PET";
      } else if (green > 100 && red < 50) {
        return "HDPE";
      } else if (blue > 100 && green < 50) {
        return "PP";
      } else {
        return "OTHER";
      }
    }
  }
  
  return "UNKNOWN";
}

void activateSortingMechanism() {
  Serial.println("🔄 Activating sorting mechanism");
  
  // Move servo to sort position
  for (int angle = 0; angle <= 90; angle += 5) {
    ledcWrite(0, angle);
    delay(20);
  }
  
  delay(1000); // Hold position
  
  // Return to rest position
  for (int angle = 90; angle >= 0; angle -= 5) {
    ledcWrite(0, angle);
    delay(20);
  }
  
  Serial.println("✅ Sorting mechanism reset");
}

bool sendBottleData(float weight, float size, String material) {
  HTTPClient http;
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["mac_address"] = WiFi.macAddress();
  doc["weight"] = weight;
  doc["size"] = size;
  doc["material"] = material;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Send to server
  String url = String("http://") + serverHost + ":" + serverPort + "/api/bottle/deposit";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("📡 Server response: %s\n", response.c_str());
    http.end();
    return httpResponseCode == 200;
  } else {
    Serial.printf("❌ HTTP Error: %s\n", http.errorToString(httpResponseCode).c_str());
    http.end();
    return false;
  }
}

bool testServerConnection() {
  HTTPClient http;
  String url = String("http://") + serverHost + ":" + serverPort + "/health";
  http.begin(url);
  
  int httpResponseCode = http.GET();
  http.end();
  
  return httpResponseCode == 200;
}

void calibrateLoadCell() {
  Serial.println("⚖️  Calibrating load cell...");
  Serial.println("Remove all weight from scale");
  delay(2000);
  
  loadCell.tare();
  Serial.println("Tare complete");
  
  Serial.println("Place known weight (100g) on scale");
  delay(5000);
  
  float reading = loadCell.get_units(10);
  calibrationFactor = reading / 100.0;
  loadCell.set_scale(calibrationFactor);
  
  Serial.printf("Calibration factor: %.2f\n", calibrationFactor);
  Serial.println("✅ Calibration complete");
}