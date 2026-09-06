/**
 * AgriEdge Rover — ESP32 Firmware Skeleton
 *
 * Responsibilities:
 * - Read soil sensors, DHT22, ultrasonic sensors
 * - Control motor driver
 * - Send JSON telemetry to Raspberry Pi via serial
 * - Receive rover control commands from Raspberry Pi
 *
 * Build: pio run -e esp32dev
 * Upload: pio run -e esp32dev -t upload
 */

#include <Arduino.h>
#include <ArduinoJson.h>
#include "pins.h"

#define FIRMWARE_VERSION "0.1.0"
#define TELEMETRY_INTERVAL_MS 2000
#define SERIAL_BAUD 115200

// Mock mode for development without wired sensors
#ifndef MOCK_SENSORS
#define MOCK_SENSORS 1
#endif

String currentZone = "ZONE_A";
unsigned long lastTelemetry = 0;

void setupMotors() {
  // TODO: Initialize motor driver pins when hardware.yaml is finalized
}

void setupSensors() {
  // TODO: Initialize sensor pins when hardware.yaml is finalized
  Serial.begin(SERIAL_BAUD);
  Serial.println("{\"type\":\"status\",\"message\":\"AgriEdge ESP32 firmware starting\"}");
}

float readSoilMoisture() {
#if MOCK_SENSORS
  return 34.0 + random(-5, 5);
#else
  // TODO: Read actual sensor
  return 0.0;
#endif
}

void sendTelemetry() {
  StaticJsonDocument<512> doc;
  doc["type"] = "telemetry";
  doc["zone"] = currentZone;
  doc["soil_moisture"] = readSoilMoisture();
  doc["soil_temperature"] = 27.4;
  doc["ph"] = 6.8;
  doc["ec"] = 1.2;
  doc["n"] = 45;
  doc["p"] = 21;
  doc["k"] = 37;
  doc["air_temperature"] = 31.1;
  doc["humidity"] = 67.2;
  doc["obstacle_distance_cm"] = 84;

  serializeJson(doc, Serial);
  Serial.println();
}

void handleCommand(const String& json) {
  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, json)) return;

  if (doc["type"] == "command") {
    const char* action = doc["action"];
    Serial.printf("{\"type\":\"ack\",\"action\":\"%s\"}\n", action);
    // TODO: Execute motor commands
  }
}

void setup() {
  setupSensors();
  setupMotors();
  randomSeed(analogRead(0));
}

void loop() {
  // Read incoming commands from Raspberry Pi
  if (Serial.available()) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.length() > 0) handleCommand(line);
  }

  // Send telemetry at interval
  if (millis() - lastTelemetry >= TELEMETRY_INTERVAL_MS) {
    sendTelemetry();
    lastTelemetry = millis();
  }
}
