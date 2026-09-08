#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ESP32Servo.h>

// ======================================================
// WIFI CONFIGURATION
// ======================================================

const char* WIFI_SSID = "faria";
const char* WIFI_PASSWORD = "stuff0609";

// IMPORTANT:
// This is your LAPTOP IP address.
// ESP32 and laptop must be on the same Wi-Fi network.
const char* SERVER_URL =
    "http://192.168.1.45:8000/api/sensors/telemetry";

// ======================================================
// SENSOR PINS
// ======================================================

#define DHT_PIN 4
#define DHT_TYPE DHT22

#define DS18B20_PIN 5

#define SOIL_MOISTURE_PIN 34

// pH is simulated.
// Physical pH sensor is NOT read.
#define PH_PIN 35

// ======================================================
// SERVO
// ======================================================

#define SERVO_PIN 13

Servo soilProbeServo;

// Based on your previous successful servo test
const int SERVO_UP = 0;
const int SERVO_DOWN = 90;

// ======================================================
// MOTOR DRIVER - L298N
// ======================================================

// LEFT SIDE
#define ENA 25
#define IN1 26
#define IN2 27

// RIGHT SIDE
#define ENB 17
#define IN3 14
#define IN4 16

// ESP32 Arduino Core 3.x PWM
#define PWM_FREQ 1000
#define PWM_RESOLUTION 8

// 0-255
// Using 160 initially for safer testing.
#define MOTOR_SPEED 160

// ======================================================
// SENSORS
// ======================================================

DHT dht(DHT_PIN, DHT_TYPE);

OneWire oneWire(DS18B20_PIN);
DallasTemperature soilTempSensor(&oneWire);

// ======================================================
// ZONE
// ======================================================

const char* ZONE_ID = "ZONE_A";

// ======================================================
// SIMULATED SOIL VALUES
// ======================================================

// These values are SIMULATED.
// They are NOT physical pH/NPK/EC measurements.

float simulatedPH = 6.5;
float simulatedEC = 0.82;

float simulatedNitrogen = 42.0;
float simulatedPhosphorus = 28.0;
float simulatedPotassium = 51.0;

// ======================================================
// SOIL MOISTURE PROTOTYPE CONVERSION
// ======================================================

// Your previous readings were approximately:
// Air  : 4095
// Soil : 2426-2430
//
// This is only a prototype estimate.
// It is NOT calibrated laboratory moisture.

const float MOISTURE_DRY_RAW = 4095.0;
const float MOISTURE_WET_RAW = 2000.0;

// ======================================================
// TIMING
// ======================================================

// Rover forward movement duration
const unsigned long FORWARD_TIME = 5000;

// Wait after rover stops
const unsigned long STOP_TIME = 2000;

// Wait after probe moves
const unsigned long PROBE_SETTLE_TIME = 1500;

// Wait before starting first cycle
const unsigned long STARTUP_WAIT = 3000;

// ======================================================
// WIFI CONNECTION
// ======================================================

void connectWiFi() {

  Serial.println();
  Serial.println("======================================");
  Serial.println("       AGRIEDGE ROVER");
  Serial.println("       WIFI CONNECTION");
  Serial.println("======================================");

  if (WiFi.status() == WL_CONNECTED) {

    Serial.println("Wi-Fi already connected.");

    return;
  }

  Serial.print("Connecting to Wi-Fi");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;

  while (WiFi.status() != WL_CONNECTED &&
         attempts < 30) {

    delay(500);

    Serial.print(".");

    attempts++;
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {

    Serial.println("Wi-Fi connected!");

    Serial.print("ESP32 IP address: ");
    Serial.println(WiFi.localIP());

    Serial.print("Server URL: ");
    Serial.println(SERVER_URL);

  } else {

    Serial.println("Wi-Fi connection FAILED.");

    Serial.println(
        "System will continue and retry later.");
  }

  Serial.println();
}

// ======================================================
// MOTOR STOP
// ======================================================

void stopMotors() {

  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);

  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);

  ledcWrite(ENA, 0);
  ledcWrite(ENB, 0);

  Serial.println("MOTORS: STOPPED");
}

// ======================================================
// MOVE FORWARD
// ======================================================

void moveForward() {

  Serial.println();
  Serial.println("======================================");
  Serial.println("ROVER: MOVING FORWARD");
  Serial.println("Duration: 5 seconds");
  Serial.println("======================================");

  // LEFT SIDE FORWARD
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);

  // RIGHT SIDE FORWARD
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);

  ledcWrite(ENA, MOTOR_SPEED);
  ledcWrite(ENB, MOTOR_SPEED);
}

// ======================================================
// MOVE BACKWARD
// ======================================================

void moveBackward() {

  Serial.println("ROVER: MOVING BACKWARD");

  // LEFT SIDE BACKWARD
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);

  // RIGHT SIDE BACKWARD
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);

  ledcWrite(ENA, MOTOR_SPEED);
  ledcWrite(ENB, MOTOR_SPEED);
}

// ======================================================
// TURN RIGHT
// ======================================================

void turnRight() {

  Serial.println("ROVER: TURNING RIGHT");

  // LEFT SIDE FORWARD
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);

  ledcWrite(ENA, MOTOR_SPEED);

  // RIGHT SIDE STOPPED
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);

  ledcWrite(ENB, 0);
}

// ======================================================
// TURN LEFT
// ======================================================

void turnLeft() {

  Serial.println("ROVER: TURNING LEFT");

  // LEFT SIDE STOPPED
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);

  ledcWrite(ENA, 0);

  // RIGHT SIDE FORWARD
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);

  ledcWrite(ENB, MOTOR_SPEED);
}

// ======================================================
// SERVO UP
// ======================================================

void probeUp() {

  Serial.println();
  Serial.println("PROBE: MOVING UP");

  soilProbeServo.write(SERVO_UP);

  delay(PROBE_SETTLE_TIME);

  Serial.println("PROBE: UP");
}

// ======================================================
// SERVO DOWN
// ======================================================

void probeDown() {

  Serial.println();
  Serial.println("PROBE: MOVING DOWN");

  soilProbeServo.write(SERVO_DOWN);

  delay(PROBE_SETTLE_TIME);

  Serial.println("PROBE: DOWN");
}

// ======================================================
// READ SENSORS
// ======================================================

bool readSensors(
    float &soilMoisture,
    float &soilTemperature,
    float &airTemperature,
    float &humidity) {

  // --------------------------------------
  // SOIL MOISTURE
  // --------------------------------------

  int moistureRaw =
      analogRead(SOIL_MOISTURE_PIN);

  soilMoisture =
      ((MOISTURE_DRY_RAW - moistureRaw) /
       (MOISTURE_DRY_RAW - MOISTURE_WET_RAW))
       * 100.0;

  soilMoisture =
      constrain(soilMoisture, 0.0, 100.0);

  // --------------------------------------
  // DHT22
  // --------------------------------------

  airTemperature =
      dht.readTemperature();

  humidity =
      dht.readHumidity();

  if (isnan(airTemperature) ||
      isnan(humidity)) {

    Serial.println("ERROR: DHT22 read failed.");

    return false;
  }

  // --------------------------------------
  // DS18B20
  // --------------------------------------

  soilTempSensor.requestTemperatures();

  soilTemperature =
      soilTempSensor.getTempCByIndex(0);

  if (soilTemperature ==
      DEVICE_DISCONNECTED_C) {

    Serial.println(
        "ERROR: DS18B20 read failed.");

    return false;
  }

  return true;
}

// ======================================================
// BUILD JSON
// ======================================================

String buildJSON(
    float soilMoisture,
    float soilTemperature,
    float airTemperature,
    float humidity) {

  String json = "{";

  json += "\"zone_id\":\"";
  json += ZONE_ID;
  json += "\",";

  // Timestamp currently handled by backend.
  json += "\"timestamp\":null,";

  // --------------------------------------
  // REAL SENSOR VALUES
  // --------------------------------------

  json += "\"soil_moisture\":";
  json += String(soilMoisture, 2);
  json += ",";

  json += "\"soil_temperature\":";
  json += String(soilTemperature, 2);
  json += ",";

  // --------------------------------------
  // SIMULATED VALUES
  // --------------------------------------

  json += "\"ph\":";
  json += String(simulatedPH, 2);
  json += ",";

  json += "\"ec\":";
  json += String(simulatedEC, 2);
  json += ",";

  json += "\"nitrogen\":";
  json += String(simulatedNitrogen, 2);
  json += ",";

  json += "\"phosphorus\":";
  json += String(simulatedPhosphorus, 2);
  json += ",";

  json += "\"potassium\":";
  json += String(simulatedPotassium, 2);
  json += ",";

  // --------------------------------------
  // AIR SENSOR VALUES
  // --------------------------------------

  json += "\"air_temperature\":";
  json += String(airTemperature, 2);
  json += ",";

  json += "\"humidity\":";
  json += String(humidity, 2);

  json += "}";

  return json;
}

// ======================================================
// SEND TELEMETRY
// ======================================================

void sendTelemetry() {

  Serial.println();
  Serial.println("======================================");
  Serial.println("       READING SENSOR DATA");
  Serial.println("======================================");

  // --------------------------------------
  // Check Wi-Fi
  // --------------------------------------

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println(
        "Wi-Fi disconnected.");

    connectWiFi();

    if (WiFi.status() != WL_CONNECTED) {

      Serial.println(
          "Unable to send telemetry.");

      return;
    }
  }

  // --------------------------------------
  // Sensor variables
  // --------------------------------------

  float soilMoisture;
  float soilTemperature;
  float airTemperature;
  float humidity;

  // --------------------------------------
  // Read sensors
  // --------------------------------------

  bool success =
      readSensors(
          soilMoisture,
          soilTemperature,
          airTemperature,
          humidity);

  if (!success) {

    Serial.println(
        "Sensor read failed.");

    return;
  }

  // --------------------------------------
  // Build JSON
  // --------------------------------------

  String json =
      buildJSON(
          soilMoisture,
          soilTemperature,
          airTemperature,
          humidity);

  // --------------------------------------
  // Display values
  // --------------------------------------

  Serial.println();

  Serial.println("LIVE SENSOR DATA");

  Serial.print("Zone          : ");
  Serial.println(ZONE_ID);

  Serial.print("Soil Moisture : ");
  Serial.print(soilMoisture);
  Serial.println(" % (prototype)");

  Serial.print("Soil Temp     : ");
  Serial.print(soilTemperature);
  Serial.println(" °C");

  Serial.print("Air Temp      : ");
  Serial.print(airTemperature);
  Serial.println(" °C");

  Serial.print("Humidity      : ");
  Serial.print(humidity);
  Serial.println(" %");

  Serial.print("pH            : ");
  Serial.print(simulatedPH);
  Serial.println(" (SIMULATED)");

  Serial.print("EC            : ");
  Serial.print(simulatedEC);
  Serial.println(" (SIMULATED)");

  Serial.print("Nitrogen      : ");
  Serial.print(simulatedNitrogen);
  Serial.println(" (SIMULATED)");

  Serial.print("Phosphorus    : ");
  Serial.print(simulatedPhosphorus);
  Serial.println(" (SIMULATED)");

  Serial.print("Potassium     : ");
  Serial.print(simulatedPotassium);
  Serial.println(" (SIMULATED)");

  // --------------------------------------
  // JSON
  // --------------------------------------

  Serial.println();
  Serial.println("JSON:");
  Serial.println(json);

  // --------------------------------------
  // HTTP POST
  // --------------------------------------

  HTTPClient http;

  Serial.println();
  Serial.println(
      "Sending telemetry to dashboard...");

  http.begin(SERVER_URL);

  http.addHeader(
      "Content-Type",
      "application/json");

  int httpCode =
      http.POST(json);

  Serial.print(
      "HTTP response code: ");

  Serial.println(httpCode);

  if (httpCode > 0) {

    String response =
        http.getString();

    Serial.println(
        "Server response:");

    Serial.println(response);

  } else {

    Serial.print(
        "HTTP request failed: ");

    Serial.println(
        http.errorToString(httpCode));
  }

  http.end();

  Serial.println(
      "Telemetry transmission complete.");

  Serial.println(
      "======================================");
}

// ======================================================
// COMPLETE SOIL SAMPLING CYCLE
// ======================================================

void performSamplingCycle() {

  Serial.println();
  Serial.println();
  Serial.println("######################################");
  Serial.println("#       AGRIEDGE ROVER CYCLE         #");
  Serial.println("######################################");

  // ====================================================
  // STEP 1 - STOP ROVER
  // ====================================================

  stopMotors();

  delay(500);

  // ====================================================
  // STEP 2 - LOWER PROBE
  // ====================================================

  probeDown();

  Serial.println(
      "Waiting for soil sensors to stabilize...");

  delay(1500);

  // ====================================================
  // STEP 3 - READ + SEND DATA
  // ====================================================

  sendTelemetry();

  delay(1000);

  // ====================================================
  // STEP 4 - RAISE PROBE
  // ====================================================

  probeUp();

  delay(500);

  // ====================================================
  // STEP 5 - MOVE FORWARD
  // ====================================================

  moveForward();

  unsigned long movementStart =
      millis();

  while (
      millis() - movementStart <
      FORWARD_TIME) {

    // Keep checking Wi-Fi during movement.
    if (WiFi.status() != WL_CONNECTED) {

      Serial.println(
          "Wi-Fi lost while moving.");

      stopMotors();

      connectWiFi();

      break;
    }

    delay(100);
  }

  // ====================================================
  // STEP 6 - STOP
  // ====================================================

  stopMotors();

  Serial.println();
  Serial.println(
      "Rover reached next sampling position.");

  delay(STOP_TIME);

  Serial.println();
  Serial.println(
      "Starting next sampling cycle...");
}

// ======================================================
// SETUP
// ======================================================

void setup() {

  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println();
  Serial.println("######################################");
  Serial.println("#                                    #");
  Serial.println("#       AGRIEDGE ROVER               #");
  Serial.println("#       AUTONOMOUS DEMO              #");
  Serial.println("#                                    #");
  Serial.println("######################################");
  Serial.println();

  // ====================================================
  // ADC
  // ====================================================

  analogReadResolution(12);

  pinMode(
      SOIL_MOISTURE_PIN,
      INPUT);

  // ====================================================
  // SENSORS
  // ====================================================

  dht.begin();

  soilTempSensor.begin();

  Serial.println(
      "Sensors initialized.");

  // ====================================================
  // SERVO
  // ====================================================

  soilProbeServo.setPeriodHertz(50);

  soilProbeServo.attach(
      SERVO_PIN,
      500,
      2400);

  // Always start with probe UP
  soilProbeServo.write(SERVO_UP);

  delay(1000);

  Serial.println(
      "Servo initialized.");

  Serial.println(
      "Probe position: UP");

  // ====================================================
  // MOTOR DRIVER
  // ====================================================

  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);

  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);

  // ESP32 Core 3.x
  ledcAttach(
      ENA,
      PWM_FREQ,
      PWM_RESOLUTION);

  ledcAttach(
      ENB,
      PWM_FREQ,
      PWM_RESOLUTION);

  // SAFETY
  stopMotors();

  Serial.println(
      "Motor driver initialized.");

  // ====================================================
  // WIFI
  // ====================================================

  connectWiFi();

  // ====================================================
  // STARTUP
  // ====================================================

  Serial.println();
  Serial.println(
      "======================================");

  Serial.println(
      "SYSTEM READY");

  Serial.println(
      "Starting autonomous demo in 3 seconds...");

  Serial.println(
      "======================================");

  delay(STARTUP_WAIT);
}

// ======================================================
// LOOP
// ======================================================

void loop() {

  // Continuous autonomous demonstration
  performSamplingCycle();
}