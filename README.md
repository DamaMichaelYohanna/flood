# FloodGuard — IoT-Based Flood Early Warning System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-NodeMCU%20ESP8266-brightgreen.svg)]()
[![Sensor](https://img.shields.io/badge/Sensor-JSN--SR04T%20Waterproof-blue.svg)]()
[![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%7C%20TailwindCSS%20%7C%20Vanilla%20JS-sky.svg)]()
[![Status](https://img.shields.io/badge/Status-Academic%20Prototype-success.svg)]()

> **Undergraduate Computer Science Project:**  
> *“IoT-Based Flood Early Warning System for Flood-Prone Areas”*

**FloodGuard** is a responsive, modern web dashboard and IoT telemetry pipeline designed to monitor water levels in flood-prone river channels, drainage basins, and low-lying residential sectors. It communicates with a physical IoT station powered by a **NodeMCU ESP8266** microcontroller and an industrial **JSN-SR04T waterproof ultrasonic sensor**.

---

## 📋 Table of Contents
1. [System Overview & Architecture](#-system-overview--architecture)
2. [Hardware Components & Pinout](#-hardware-components--pinout)
3. [Mathematical Measurement Model](#-mathematical-measurement-model)
4. [Dashboard Features & UI Highlights](#-dashboard-features--ui-highlights)
5. [Risk Assessment Matrix & Thresholds](#-risk-assessment-matrix--thresholds)
6. [Simulation & Demo Mode](#-simulation--demo-mode)
7. [Project Structure](#-project-structure)
8. [Getting Started & Local Execution](#-getting-started--local-execution)
9. [NodeMCU ESP8266 Firmware (Arduino C++)](#-nodemcu-esp8266-firmware-arduino-c)
10. [REST API & Cloud Data Schema](#-rest-api--cloud-data-schema)

---

## 🏛️ System Overview & Architecture

```text
+-------------------------------------------------------------+
|                 MONITORING STATION (FLOOD-001)             |
|                                                             |
|   +-----------------------+      +----------------------+   |
|   | JSN-SR04T Waterproof  |      |   NodeMCU ESP8266    |   |
|   |   Ultrasonic Probe    | ---> |    Microcontroller   |   |
|   | (Echo pulse duration) |      | (Wi-Fi 802.11 b/g/n) |   |
|   +-----------------------+      +----------+-----------+   |
+---------------------------------------------|---------------+
                                              |
                                     Wi-Fi HTTP / JSON
                                              |
                                              v
+-------------------------------------------------------------+
|                     DATA SERVICE LAYER                      |
|                                                             |
|   +-------------------+  OR  +--------------------------+   |
|   | MockProvider.js   |      | RestApiProvider.js       |   |
|   | (Demo Simulation) |      | (Django / Flask Backend) |   |
|   +-------------------+      +--------------------------+   |
+---------------------------------------------+---------------+
                                              |
                                              v
+-------------------------------------------------------------+
|                 FLOODGUARD WEB DASHBOARD                    |
|                                                             |
|  * Real-Time Liquid Wave Gauge                              |
|  * 24-Hour Telemetry Trend (Chart.js)                       |
|  * Dynamic Risk Assessment (Safe / Warning / Danger / Crit) |
|  * Device Health Diagnostics & Rapid Rate of Rise Tracker   |
+-------------------------------------------------------------+
```

---

## 🔌 Hardware Components & Pinout

| Component | Technical Specification | Operational Role |
| :--- | :--- | :--- |
| **NodeMCU v3 (ESP8266-12E)** | Tensilica 32-bit LX106 @ 80MHz, 4MB Flash, Integrated 802.11 b/g/n Wi-Fi | Acquires sensor readings, computes water height, packages JSON payload, sends HTTP POST |
| **JSN-SR04T Transceiver** | 20cm – 600cm Range, 40kHz Frequency, 5V Operating Voltage, IP67 Waterproof | Emits acoustic pulses and listens for surface reflections |
| **Power Supply** | 5V 2A DC Adapter or Step-Down Solar Regulator | Powers MCU and ultrasonic transceiver board |

### Wiring Diagram (NodeMCU ESP8266 to JSN-SR04T)
```text
JSN-SR04T Board              NodeMCU ESP8266
================             ===============
5V (VCC)       <---------->  VIN / 5V Rail
GND            <---------->  GND
TRIG           <---------->  D1 (GPIO 5)
ECHO           <---------->  D2 (GPIO 4)
```

---

## 📐 Mathematical Measurement Model

The physical sensor measures the distance from its mounted position down to the rising water surface using acoustic time-of-flight:

$$\text{Distance to Water (m)} = \frac{\text{Echo Pulse Duration in } \mu\text{s} \times 0.0343 \text{ cm}/\mu\text{s}}{2 \times 100}$$

$$\text{Current Water Level (m)} = \text{Sensor Mounting Height (e.g. } 3.00\text{ m)} - \text{Distance to Water (m)}$$

$$\text{Rate of Rise} = \frac{\Delta \text{Water Level}}{\Delta \text{Time (10-minute window)}}$$

---

## ✨ Dashboard Features & UI Highlights

* **Primary Water Level Hero**:
  - Extra-large numeric display (`1.42 m`) with danger percentage gauge.
  - Smooth animated SVG fluid wave reflecting dynamic water level.
  - Visual scale indicator with Warning and Danger markers.
* **Accessible Risk Assessment Card**:
  - High-contrast visual banners with text explanations (never relies on color alone).
  - Rate-of-rise velocity tracker (`↑ +0.18 m in last 10m`).
* **24-Hour Telemetry Chart**:
  - Interactive spline curve powered by **Chart.js**.
  - Dynamic dashed reference lines for **Warning (1.50 m)** and **Danger (1.80 m)** thresholds.
* **IoT Hardware Diagnostics**:
  - NodeMCU ESP8266 status, Wi-Fi RSSI signal strength (-62 dBm), MCU uptime, and sensor echo ping validity.
* **Recent Alerts Log**:
  - Incident log buffer with threshold crossing timestamps and optional Web Audio API audio chimes.
* **Threshold Settings Modal**:
  - Real-time configurable threshold boundaries saved to `localStorage`.

---

## 🚨 Risk Assessment Matrix & Thresholds

| Status | Water Level Range | Visual Indicator | Recommended Response Action |
| :--- | :--- | :--- | :--- |
| **SAFE** | $< 1.20\text{ m}$ | 🟢 Green | Normal baseline drainage; standard sampling routine. |
| **WARNING** | $1.20\text{ m} - 1.50\text{ m}$ | 🟡 Amber | Heightened monitoring; inspect downstream drainage. |
| **DANGER** | $1.50\text{ m} - 1.80\text{ m}$ | 🟠 Orange | Prepare flood barriers; alert riverside residents. |
| **CRITICAL** | $\ge 1.80\text{ m}$ | 🔴 Red (Pulsing) | Emergency siren activated; coordinate low-lying evacuations. |
| **OFFLINE / ERROR** | N/A | ⚪ Slate / Rose | Sensor uncommunicative. **Never represented as Safe.** |

---

## 🎮 Simulation & Demo Mode

FloodGuard features an interactive demonstration bar designed for classroom and defense presentations:
* **Flash Flood Surge**: Simulates gradual rising water from normal baseline to critical overflow.
* **Receding Floodwaters**: Demonstrates runoff drainage back to safe levels.
* **Steady Flow**: Generates realistic micro-fluctuations.
* **Sensor Disconnection**: Simulates JSN-SR04T hardware probe unplugged / echo timeout.
* **Device Offline**: Simulates station power loss or Wi-Fi disconnection.
* **Manual Slider**: Drag water level anywhere between 0.20m and 2.40m with instant UI feedback.

---

## 📁 Project Structure

```text
flood/
├── index.html                   # Master Dashboard UI
├── README.md                    # Comprehensive System Documentation
├── css/
│   └── styles.css               # Wave animations, glassmorphism & custom styling
└── js/
    ├── config.js                # Centralized thresholds & station metadata
    ├── app.js                   # Application coordinator & event dispatcher
    ├── data/
    │   └── sampleData.js        # Baseline 24h telemetry & sample alert logs
    ├── services/
    │   ├── DataService.js       # Pluggable data layer abstraction
    │   ├── MockProvider.js      # Simulation engine with fault injection
    │   └── RestApiProvider.js   # Ready-to-go HTTP REST API provider
    └── components/
        ├── WaterGauge.js        # Liquid wave hero gauge component
        ├── RiskStatus.js        # Flood risk state assessment component
        ├── StatisticCard.js     # 24h Peak, Avg, Lowest, and RSSI cards
        ├── TelemetryChart.js    # Chart.js 24h curve with threshold markers
        ├── DeviceHealth.js      # ESP8266 & sensor diagnostics component
        ├── AlertList.js         # Incident log & audio alert chime component
        ├── ThresholdModal.js    # Threshold configuration modal
        └── IoTPipelineModal.js  # Architecture & Arduino firmware modal
```

---

## 🚀 Getting Started & Local Execution

No complex build steps or heavy dependencies required!

### Option 1: Direct Browser Launch
Double click `index.html` or open it directly in any modern web browser.

### Option 2: Local HTTP Server (Recommended)
```bash
# Python 3
python -m http.server 5173

# Node.js
npx serve .
```
Navigate to `http://localhost:5173/` in your browser.

---

## 💻 NodeMCU ESP8266 Firmware (Arduino C++)

Flash the following code to your NodeMCU ESP8266 using the Arduino IDE:

```cpp
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

// Wi-Fi Credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Backend API Endpoint
const char* serverUrl = "http://YOUR_SERVER_IP:8000/api/readings/";

// JSN-SR04T Sensor Pins
#define TRIG_PIN D1  // GPIO 5
#define ECHO_PIN D2  // GPIO 4

const float SENSOR_MOUNT_HEIGHT = 3.00; // Sensor distance to dry riverbed (metres)

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi Connected! NodeMCU Online.");
}

void loop() {
  // Emit ultrasonic trigger pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Measure echo return time
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout (~5m max)
  
  if (duration > 0) {
    float distanceM = (duration * 0.0343) / 2.0 / 100.0;
    float waterLevel = SENSOR_MOUNT_HEIGHT - distanceM;
    if (waterLevel < 0.0) waterLevel = 0.0;

    Serial.printf("Measured Water Level: %.2f m\n", waterLevel);

    // Transmit JSON Telemetry
    if (WiFi.status() == WL_CONNECTED) {
      WiFiClient client;
      HTTPClient http;
      http.begin(client, serverUrl);
      http.addHeader("Content-Type", "application/json");

      String jsonPayload = "{\"stationId\":\"FLOOD-001\",\"waterLevel\":" + String(waterLevel, 2) + 
                           ",\"deviceOnline\":true,\"sensorConnected\":true}";
      
      int httpCode = http.POST(jsonPayload);
      Serial.printf("HTTP Response: %d\n", httpCode);
      http.end();
    }
  } else {
    Serial.println("Warning: Echo timeout from JSN-SR04T sensor probe.");
  }
  
  delay(3000); // Sample every 3 seconds
}
```

---

## 📡 REST API & Cloud Data Schema

### Latest Reading Payload (`GET /api/readings/latest/` / `POST /api/readings/`)
```json
{
  "stationId": "FLOOD-001",
  "waterLevel": 1.42,
  "unit": "m",
  "timestamp": "2026-09-16T23:30:00Z",
  "deviceOnline": true,
  "sensorConnected": true,
  "signalStrength": -62,
  "batteryVoltage": 3.31,
  "rateOfRise": 0.18
}
```

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
