#include <Arduino.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ESP32Servo.h>

// ============================================================
// AGRIEDGE ROVER - ESP32 STEP 1 FIRMWARE
// ============================================================

// -------------------------
// SENSOR PINS
// -------------------------
#define DHT_PIN       4
#define DHT_TYPE      DHT22

#define DS18B20_PIN   5

#define MOISTURE_PIN  34
#define PH_PIN        35

// -------------------------
// SERVO
// -------------------------
#define SERVO_PIN     13

// -------------------------
// L298N MOTOR DRIVER
// -------------------------
#define ENA_PIN       25
#define IN1_PIN       26
#define IN2_PIN       27

#define IN3_PIN       14
#define IN4_PIN       16
#define ENB_PIN       17

// ============================================================
// OBJECTS
// ============================================================

DHT dht(DHT_PIN, DHT_TYPE);

OneWire oneWire(DS18B20_PIN);
DallasTemperature ds18b20(&oneWire);

Servo probeServo;

// ============================================================
// MOTOR SETTINGS
// ============================================================

const int MOTOR_SPEED = 180;  // 0-255

// ============================================================
// SERVO POSITIONS
// Adjust later according to actual mechanical setup.
// ============================================================

const int SERVO_UP = 20;
const int SERVO_DOWN = 100;

// ============================================================
// TIMING
// ============================================================

unsigned long lastSensorRead = 0;

const unsigned long SENSOR_INTERVAL = 2000;

// ============================================================
// MOTOR FUNCTIONS
// ============================================================

void stopMotors()
{
    digitalWrite(IN1_PIN, LOW);
    digitalWrite(IN2_PIN, LOW);

    digitalWrite(IN3_PIN, LOW);
    digitalWrite(IN4_PIN, LOW);

    ledcWrite(ENA_PIN, 0);
    ledcWrite(ENB_PIN, 0);
}


void moveForward()
{
    // Left side forward
    digitalWrite(IN1_PIN, HIGH);
    digitalWrite(IN2_PIN, LOW);

    // Right side forward
    digitalWrite(IN3_PIN, HIGH);
    digitalWrite(IN4_PIN, LOW);

    ledcWrite(ENA_PIN, MOTOR_SPEED);
    ledcWrite(ENB_PIN, MOTOR_SPEED);
}


void moveBackward()
{
    // Left side backward
    digitalWrite(IN1_PIN, LOW);
    digitalWrite(IN2_PIN, HIGH);

    // Right side backward
    digitalWrite(IN3_PIN, LOW);
    digitalWrite(IN4_PIN, HIGH);

    ledcWrite(ENA_PIN, MOTOR_SPEED);
    ledcWrite(ENB_PIN, MOTOR_SPEED);
}


void turnLeft()
{
    // Left side backward
    digitalWrite(IN1_PIN, LOW);
    digitalWrite(IN2_PIN, HIGH);

    // Right side forward
    digitalWrite(IN3_PIN, HIGH);
    digitalWrite(IN4_PIN, LOW);

    ledcWrite(ENA_PIN, MOTOR_SPEED);
    ledcWrite(ENB_PIN, MOTOR_SPEED);
}


void turnRight()
{
    // Left side forward
    digitalWrite(IN1_PIN, HIGH);
    digitalWrite(IN2_PIN, LOW);

    // Right side backward
    digitalWrite(IN3_PIN, LOW);
    digitalWrite(IN4_PIN, HIGH);

    ledcWrite(ENA_PIN, MOTOR_SPEED);
    ledcWrite(ENB_PIN, MOTOR_SPEED);
}


// ============================================================
// SERVO FUNCTIONS
// ============================================================

void probeUp()
{
    probeServo.write(SERVO_UP);

    Serial.println("{\"event\":\"probe_up\"}");
}


void probeDown()
{
    probeServo.write(SERVO_DOWN);

    Serial.println("{\"event\":\"probe_down\"}");
}


// ============================================================
// SENSOR READING
// ============================================================

void sendSensorData()
{
    // -------------------------
    // DHT22
    // -------------------------

    float airTemperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    // -------------------------
    // DS18B20
    // -------------------------

    ds18b20.requestTemperatures();

    float soilTemperature = ds18b20.getTempCByIndex(0);

    // -------------------------
    // ANALOG SENSORS
    // -------------------------

    int moistureRaw = analogRead(MOISTURE_PIN);
    int phRaw = analogRead(PH_PIN);

    // -------------------------
    // JSON
    // -------------------------

    StaticJsonDocument<512> doc;

    doc["type"] = "sensor_data";

    doc["timestamp_ms"] = millis();

    doc["soil_moisture_raw"] = moistureRaw;

    doc["ph_raw"] = phRaw;

    if (isnan(airTemperature))
    {
        doc["air_temperature_c"] = nullptr;
    }
    else
    {
        doc["air_temperature_c"] = airTemperature;
    }

    if (isnan(humidity))
    {
        doc["humidity_percent"] = nullptr;
    }
    else
    {
        doc["humidity_percent"] = humidity;
    }

    if (soilTemperature == DEVICE_DISCONNECTED_C)
    {
        doc["soil_temperature_c"] = nullptr;
    }
    else
    {
        doc["soil_temperature_c"] = soilTemperature;
    }

    serializeJson(doc, Serial);
    Serial.println();
}


// ============================================================
// SERIAL COMMAND HANDLER
// ============================================================

void processCommand(String command)
{
    command.trim();
    command.toUpperCase();

    Serial.print("{\"received_command\":\"");
    Serial.print(command);
    Serial.println("\"}");

    // -------------------------
    // MOVEMENT
    // -------------------------

    if (command == "FORWARD")
    {
        moveForward();
    }

    else if (command == "BACKWARD")
    {
        moveBackward();
    }

    else if (command == "LEFT")
    {
        turnLeft();
    }

    else if (command == "RIGHT")
    {
        turnRight();
    }

    else if (command == "STOP")
    {
        stopMotors();
    }

    // -------------------------
    // PROBE
    // -------------------------

    else if (command == "PROBE_UP")
    {
        probeUp();
    }

    else if (command == "PROBE_DOWN")
    {
        probeDown();
    }

    // -------------------------
    // SENSOR REQUEST
    // -------------------------

    else if (command == "READ_SENSORS")
    {
        sendSensorData();
    }

    // -------------------------
    // UNKNOWN
    // -------------------------

    else
    {
        Serial.println("{\"error\":\"unknown_command\"}");
    }
}


// ============================================================
// SETUP
// ============================================================

void setup()
{
    Serial.begin(115200);

    delay(1000);

    Serial.println();
    Serial.println("=================================");
    Serial.println("AgriEdge Rover ESP32");
    Serial.println("Step 1 Firmware");
    Serial.println("=================================");

    // -------------------------
    // MOTOR PINS
    // -------------------------

    pinMode(IN1_PIN, OUTPUT);
    pinMode(IN2_PIN, OUTPUT);

    pinMode(IN3_PIN, OUTPUT);
    pinMode(IN4_PIN, OUTPUT);

    // ESP32 PWM setup
    ledcAttach(ENA_PIN, 1000, 8);
    ledcAttach(ENB_PIN, 1000, 8);

    stopMotors();

    // -------------------------
    // ANALOG INPUTS
    // -------------------------

    pinMode(MOISTURE_PIN, INPUT);
    pinMode(PH_PIN, INPUT);

    analogReadResolution(12);

    // -------------------------
    // DHT22
    // -------------------------

    dht.begin();

    // -------------------------
    // DS18B20
    // -------------------------

    ds18b20.begin();

    // -------------------------
    // SERVO
    // -------------------------

    probeServo.setPeriodHertz(50);

    probeServo.attach(
        SERVO_PIN,
        500,
        2400
    );

    probeUp();

    // -------------------------
    // START MESSAGE
    // -------------------------

    Serial.println("{\"status\":\"ESP32_READY\"}");

    delay(1000);

    sendSensorData();
}


// ============================================================
// LOOP
// ============================================================

void loop()
{
    // ========================================================
    // SERIAL COMMANDS
    // ========================================================

    if (Serial.available())
    {
        String command = Serial.readStringUntil('\n');

        processCommand(command);
    }


    // ========================================================
    // PERIODIC SENSOR READING
    // ========================================================

    unsigned long now = millis();

    if (now - lastSensorRead >= SENSOR_INTERVAL)
    {
        lastSensorRead = now;

        sendSensorData();
    }
}