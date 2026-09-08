#include <Arduino.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ESP32Servo.h>

// =====================================================
// SENSOR PINS
// =====================================================

#define DHT_PIN             4
#define DHT_TYPE            DHT22

#define DS18B20_PIN         5
#define SOIL_MOISTURE_PIN   34
#define PH_PIN              35

// =====================================================
// SERVO
// =====================================================

#define SERVO_PIN 13

// =====================================================
// L298N MOTOR DRIVER
// =====================================================

// Left side: M1 + M3
#define ENA 25
#define IN1 26
#define IN2 27

// Right side: M2 + M4
#define ENB 17
#define IN3 14
#define IN4 16

// =====================================================
// MOTOR SETTINGS
// =====================================================

#define PWM_FREQ        1000
#define PWM_RESOLUTION  8

// Start slower for the integrated test
#define MOTOR_SPEED     180

// =====================================================
// SENSOR OBJECTS
// =====================================================

DHT dht(DHT_PIN, DHT_TYPE);

OneWire oneWire(DS18B20_PIN);
DallasTemperature soilTempSensor(&oneWire);

Servo soilProbeServo;

// =====================================================
// TIMING
// =====================================================

unsigned long lastSensorRead = 0;

const unsigned long SENSOR_INTERVAL = 2000;

// =====================================================
// SIMULATED SOIL VALUES
// =====================================================

// These are NOT physical measurements.
// They are temporary software values for the prototype.

float simulatedPH = 6.5;

float simulatedNitrogen = 42.0;
float simulatedPhosphorus = 28.0;
float simulatedPotassium = 51.0;

float simulatedEC = 0.82;

// =====================================================
// MOTOR FUNCTIONS
// =====================================================

void stopMotors() {

  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);

  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);

  ledcWrite(ENA, 0);
  ledcWrite(ENB, 0);
}


// -----------------------------------------------------
// Forward
// -----------------------------------------------------

void moveForward() {

  Serial.println("MOTION: FORWARD");

  // Left side forward
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);

  // Right side forward
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);

  ledcWrite(ENA, MOTOR_SPEED);
  ledcWrite(ENB, MOTOR_SPEED);
}


// -----------------------------------------------------
// Backward
// -----------------------------------------------------

void moveBackward() {

  Serial.println("MOTION: BACKWARD");

  // Left side backward
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);

  // Right side backward
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);

  ledcWrite(ENA, MOTOR_SPEED);
  ledcWrite(ENB, MOTOR_SPEED);
}


// -----------------------------------------------------
// Right turn
//
// Left side moves forward.
// Right side stops.
//
// This matches the turning behavior we decided
// to use for the first rover test.
// -----------------------------------------------------

void turnRight() {

  Serial.println("MOTION: RIGHT TURN");

  // Left side forward
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);

  ledcWrite(ENA, MOTOR_SPEED);

  // Right side STOP
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);

  ledcWrite(ENB, 0);
}


// -----------------------------------------------------
// Left turn
//
// Right side moves forward.
// Left side stops.
// -----------------------------------------------------

void turnLeft() {

  Serial.println("MOTION: LEFT TURN");

  // Left side STOP
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);

  ledcWrite(ENA, 0);

  // Right side forward
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);

  ledcWrite(ENB, MOTOR_SPEED);
}


// =====================================================
// SERVO FUNCTIONS
// =====================================================

void lowerProbe() {

  Serial.println("PROBE: LOWERING");

  soilProbeServo.write(90);

  delay(1500);
}


void raiseProbe() {

  Serial.println("PROBE: RAISING");

  soilProbeServo.write(0);

  delay(1500);
}


// =====================================================
// SENSOR READING
// =====================================================

void readSensors() {

  int moistureRaw = analogRead(SOIL_MOISTURE_PIN);

  int phRaw = analogRead(PH_PIN);

  float airTemperature = dht.readTemperature();

  float humidity = dht.readHumidity();

  soilTempSensor.requestTemperatures();

  float soilTemperature =
      soilTempSensor.getTempCByIndex(0);


  Serial.println();
  Serial.println("--------------------------------------");

  // Soil moisture
  Serial.print("Soil Moisture Raw : ");
  Serial.println(moistureRaw);

  // pH raw ADC
  Serial.print("pH Raw ADC        : ");
  Serial.println(phRaw);

  // Simulated pH
  Serial.print("pH (SIMULATED)    : ");
  Serial.println(simulatedPH, 2);

  // Air temperature
  if (isnan(airTemperature)) {

    Serial.println("Air Temperature   : ERROR");

  } else {

    Serial.print("Air Temperature   : ");
    Serial.print(airTemperature);
    Serial.println(" °C");
  }

  // Humidity
  if (isnan(humidity)) {

    Serial.println("Humidity          : ERROR");

  } else {

    Serial.print("Humidity          : ");
    Serial.print(humidity);
    Serial.println(" %");
  }

  // Soil temperature
  if (soilTemperature == DEVICE_DISCONNECTED_C) {

    Serial.println("Soil Temperature  : SENSOR ERROR");

  } else {

    Serial.print("Soil Temperature  : ");
    Serial.print(soilTemperature);
    Serial.println(" °C");
  }

  // Simulated NPK
  Serial.print("Nitrogen (SIM)    : ");
  Serial.println(simulatedNitrogen);

  Serial.print("Phosphorus (SIM)  : ");
  Serial.println(simulatedPhosphorus);

  Serial.print("Potassium (SIM)   : ");
  Serial.println(simulatedPotassium);

  // Simulated EC
  Serial.print("EC (SIMULATED)    : ");
  Serial.println(simulatedEC, 2);

  Serial.println("--------------------------------------");
}


// =====================================================
// SETUP
// =====================================================

void setup() {

  Serial.begin(115200);

  delay(1500);

  Serial.println();
  Serial.println("======================================");
  Serial.println("       AGRIEDGE ROVER");
  Serial.println("       FULL ESP32 SYSTEM TEST");
  Serial.println("======================================");
  Serial.println();


  // ===================================================
  // SENSOR INITIALIZATION
  // ===================================================

  analogReadResolution(12);

  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(PH_PIN, INPUT);

  dht.begin();

  soilTempSensor.begin();


  // ===================================================
  // SERVO INITIALIZATION
  // ===================================================

  soilProbeServo.setPeriodHertz(50);

  soilProbeServo.attach(
    SERVO_PIN,
    500,
    2400
  );

  // Start with probe raised
  soilProbeServo.write(0);


  // ===================================================
  // MOTOR INITIALIZATION
  // ===================================================

  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);

  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);

  // ESP32 Core 3.x PWM API
  ledcAttach(
    ENA,
    PWM_FREQ,
    PWM_RESOLUTION
  );

  ledcAttach(
    ENB,
    PWM_FREQ,
    PWM_RESOLUTION
  );

  stopMotors();


  Serial.println("Sensors initialized.");
  Serial.println("Servo initialized.");
  Serial.println("Motors initialized.");
  Serial.println();

  Serial.println("Starting full system test...");
  Serial.println();
}


// =====================================================
// MAIN LOOP
// =====================================================

void loop() {

  // ===================================================
  // STEP 1
  // READ SENSORS
  // ===================================================

  Serial.println();
  Serial.println("========== STEP 1: SENSOR TEST ==========");

  readSensors();

  delay(1000);


  // ===================================================
  // STEP 2
  // LOWER PROBE
  // ===================================================

  Serial.println();
  Serial.println("========== STEP 2: PROBE LOWER ==========");

  lowerProbe();

  delay(1000);


  // ===================================================
  // STEP 3
  // READ SENSORS WITH PROBE DOWN
  // ===================================================

  Serial.println();
  Serial.println("======= STEP 3: SOIL DATA SAMPLE =======");

  readSensors();

  delay(2000);


  // ===================================================
  // STEP 4
  // RAISE PROBE
  // ===================================================

  Serial.println();
  Serial.println("========== STEP 4: PROBE RAISE ==========");

  raiseProbe();

  delay(1000);


  // ===================================================
  // STEP 5
  // MOVE FORWARD
  // ===================================================

  Serial.println();
  Serial.println("========= STEP 5: FORWARD TEST ==========");

  moveForward();

  delay(2000);

  stopMotors();

  delay(1500);


  // ===================================================
  // STEP 6
  // MOVE BACKWARD
  // ===================================================

  Serial.println();
  Serial.println("======== STEP 6: BACKWARD TEST ==========");

  moveBackward();

  delay(2000);

  stopMotors();

  delay(1500);


  // ===================================================
  // STEP 7
  // RIGHT TURN
  // ===================================================

  Serial.println();
  Serial.println("========= STEP 7: RIGHT TURN ===========");

  turnRight();

  delay(1500);

  stopMotors();

  delay(1500);


  // ===================================================
  // STEP 8
  // LEFT TURN
  // ===================================================

  Serial.println();
  Serial.println("========== STEP 8: LEFT TURN ===========");

  turnLeft();

  delay(1500);

  stopMotors();

  delay(2000);


  // ===================================================
  // TEST COMPLETE
  // ===================================================

  Serial.println();
  Serial.println("======================================");
  Serial.println("       FULL SYSTEM TEST COMPLETE");
  Serial.println("======================================");
  Serial.println();

  Serial.println("Restarting test in 5 seconds...");

  delay(5000);
}