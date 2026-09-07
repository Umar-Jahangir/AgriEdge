#include <Arduino.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ============================================================
// AgriEdge Rover
// ESP32 Sensor Test - Step 1
// ============================================================

// -------------------------
// PIN DEFINITIONS
// -------------------------

#define DHT_PIN 4
#define DHT_TYPE DHT22

#define DS18B20_PIN 5

#define SOIL_MOISTURE_PIN 34

#define PH_PIN 35


// ============================================================
// SENSOR OBJECTS
// ============================================================

DHT dht(DHT_PIN, DHT_TYPE);

OneWire oneWire(DS18B20_PIN);

DallasTemperature soilTempSensor(&oneWire);


// ============================================================
// TIMING
// ============================================================

unsigned long lastReadTime = 0;

const unsigned long READ_INTERVAL = 2000;


// ============================================================
// SETUP
// ============================================================

void setup()
{
  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println("======================================");
  Serial.println("      AGRIEDGE ROVER");
  Serial.println("      ESP32 SENSOR TEST");
  Serial.println("======================================");

  // -------------------------
  // Analog configuration
  // -------------------------

  analogReadResolution(12);

  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(PH_PIN, INPUT);

  // -------------------------
  // DHT22
  // -------------------------

  dht.begin();

  // -------------------------
  // DS18B20
  // -------------------------

  soilTempSensor.begin();

  Serial.println("Sensors initialized.");
  Serial.println("Reading sensors every 2 seconds...");
  Serial.println();
}


// ============================================================
// READ SENSORS
// ============================================================

void readSensors()
{
  // ==========================================================
  // SOIL MOISTURE
  // ==========================================================

  int moistureRaw = analogRead(SOIL_MOISTURE_PIN);


  // ==========================================================
  // pH
  // ==========================================================

  int phRaw = analogRead(PH_PIN);


  // ==========================================================
  // DHT22
  // ==========================================================

  float airTemperature = dht.readTemperature();

  float humidity = dht.readHumidity();


  // ==========================================================
  // DS18B20
  // ==========================================================

  soilTempSensor.requestTemperatures();

  float soilTemperature =
      soilTempSensor.getTempCByIndex(0);


  // ==========================================================
  // SERIAL OUTPUT
  // ==========================================================

  Serial.println("--------------------------------------");

  // Soil moisture
  Serial.print("Soil Moisture Raw : ");
  Serial.println(moistureRaw);


  // pH
  Serial.print("pH Raw            : ");
  Serial.println(phRaw);


  // DHT22 temperature
  if (isnan(airTemperature))
  {
    Serial.println("Air Temperature   : ERROR");
  }
  else
  {
    Serial.print("Air Temperature   : ");
    Serial.print(airTemperature);
    Serial.println(" °C");
  }


  // DHT22 humidity
  if (isnan(humidity))
  {
    Serial.println("Humidity          : ERROR");
  }
  else
  {
    Serial.print("Humidity          : ");
    Serial.print(humidity);
    Serial.println(" %");
  }


  // DS18B20
  if (soilTemperature == DEVICE_DISCONNECTED_C)
  {
    Serial.println("Soil Temperature  : SENSOR ERROR");
  }
  else
  {
    Serial.print("Soil Temperature  : ");
    Serial.print(soilTemperature);
    Serial.println(" °C");
  }


  Serial.println("--------------------------------------");
}


// ============================================================
// LOOP
// ============================================================

void loop()
{
  unsigned long currentTime = millis();


  if (currentTime - lastReadTime >= READ_INTERVAL)
  {
    lastReadTime = currentTime;

    readSensors();
  }
}