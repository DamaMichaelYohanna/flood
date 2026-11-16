#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>

// 1. Your Wi-Fi Credentials
const char* ssid = "dialar";
const char* password = "YOUR_WIFI_PASSWORD";

// 2. Your Dedicated Vercel Serverless URL
const char* serverUrl = "https://iot-flood.vercel.app/api/readings";

// 3. Pin Definitions (Restored to D0, D1, D4, D5, D6)
const int ledD0 = D0;     // Red LED
const int ledD1 = D1;     // Green LED
const int buzzerPin = D4; // Buzzer on D4
const int TRIG_PIN = D5;  // Trigger (GPIO 14)
const int ECHO_PIN = D6;  // Echo (GPIO 12)

const float SENSOR_MOUNT_HEIGHT = 3.00; // Total height from sensor to dry riverbed (metres)
const unsigned long SENSOR_TIMEOUT = 30000;

void setup() {
  Serial.begin(115200);

  // Initialize actuator pins
  pinMode(ledD0, OUTPUT);
  pinMode(ledD1, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
  
  // Initialize sensor pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  digitalWrite(TRIG_PIN, LOW);
  digitalWrite(buzzerPin, HIGH); // Default HIGH to keep active-low buzzer off

  // Connect to Wi-Fi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi Connected! NodeMCU Online.");
  Serial.print("NodeMCU IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Emit 10µs ultrasonic trigger burst
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Measure return echo pulse duration
  long duration = pulseIn(ECHO_PIN, HIGH, SENSOR_TIMEOUT);
  
  bool isAlert = false;
  float waterLevel = 0.0;
  float distanceM = 0.0;

  if (duration > 0) {
    distanceM = (duration * 0.0343) / 2.0 / 100.0;
    waterLevel = SENSOR_MOUNT_HEIGHT - distanceM;
    if (waterLevel < 0.0) waterLevel = 0.0;

    Serial.printf("Water Level: %.2f m | Distance: %.2f m\n", waterLevel, distanceM);

    // Check if distance is in alert range (20 cm to 30 cm, or adjust based on your meter setup)
    // Note: distanceM * 100 converts meters to cm
    float distanceCm = distanceM * 100.0;
    if (distanceCm >= 20.0 && distanceCm <= 60.0) {
      isAlert = true;
    }
  } else {
    Serial.println("Warning: Echo timeout from JSN-SR04T probe.");
  }

  // Handle local physical indicators (LEDs & Buzzer)
  if (isAlert) {
    digitalWrite(ledD1, LOW);      // Green off

    // Pulse alert: Red LED ON + Buzzer ON (LOW), then both OFF
    digitalWrite(ledD0, HIGH);
    digitalWrite(buzzerPin, LOW); 
    delay(200);
    
    digitalWrite(ledD0, LOW);
    digitalWrite(buzzerPin, HIGH);
    delay(200);
  } else {
    digitalWrite(ledD0, LOW);      // Red off
    digitalWrite(ledD1, HIGH);     // Green on
    digitalWrite(buzzerPin, HIGH); // Buzzer off
    delay(1000);                   // Normal delay between checks
  }

  // Send HTTPS POST Telemetry to Vercel
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure(); // Required on ESP8266 for HTTPS without root cert bundles

    HTTPClient http;
    if (http.begin(client, serverUrl)) {
      http.addHeader("Content-Type", "application/json");

      // Format telemetry JSON payload
      String jsonPayload = "{\"stationId\":\"FLOOD-001\","
                           "\"waterLevel\":" + String(waterLevel, 2) + ","
                           "\"deviceOnline\":true,"
                           "\"sensorConnected\":(" + String(duration > 0 ? "true" : "false") + "),"
                           "\"signalStrength\":" + String(WiFi.RSSI()) + "}";

      int httpCode = http.POST(jsonPayload);

      if (httpCode > 0) {
        Serial.printf("[HTTP] POST Result Code: %d\n", httpCode);
        String response = http.getString();
        Serial.println("[HTTP] Server Response: " + response);
      } else {
        Serial.printf("[HTTP] POST Failed, error: %s\n", http.errorToString(httpCode).c_str());
      }
      http.end();
    } else {
      Serial.println("[HTTP] Unable to connect to Vercel endpoint.");
    }
  } else {
    Serial.println("Wi-Fi disconnected. Reconnecting...");
    WiFi.reconnect();
  }
}