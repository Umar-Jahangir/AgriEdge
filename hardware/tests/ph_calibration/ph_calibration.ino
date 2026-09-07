#include <Arduino.h>

// ============================================================
// AgriEdge Rover
// pH Sensor Calibration Test
// ESP32 + PH-4502C / V1.1-style module
// ============================================================

#define PH_PIN 35

// Number of ADC samples used for averaging
#define NUM_SAMPLES 50

// Delay between samples
#define SAMPLE_DELAY_MS 20


// ============================================================
// READ AVERAGED RAW ADC
// ============================================================

int readPHRaw()
{
  long total = 0;

  for (int i = 0; i < NUM_SAMPLES; i++)
  {
    total += analogRead(PH_PIN);
    delay(SAMPLE_DELAY_MS);
  }

  return total / NUM_SAMPLES;
}


// ============================================================
// SETUP
// ============================================================

void setup()
{
  Serial.begin(115200);

  delay(1000);

  // ESP32 ADC resolution
  analogReadResolution(12);

  // Wider ADC input range.
  // IMPORTANT: GPIO35 must still never receive >3.3V.
  analogSetPinAttenuation(PH_PIN, ADC_11db);

  pinMode(PH_PIN, INPUT);

  Serial.println();
  Serial.println("==========================================");
  Serial.println("       AGRIEDGE ROVER");
  Serial.println("       pH CALIBRATION TEST");
  Serial.println("==========================================");

  Serial.println();
  Serial.println("PH module:");
  Serial.println("PO -> GPIO35");
  Serial.println();

  Serial.println("The program will average 50 ADC readings.");
  Serial.println("Allow the probe to stabilize before recording.");
  Serial.println();

  Serial.println("IMPORTANT:");
  Serial.println("Do NOT expose GPIO35 to more than 3.3V.");
  Serial.println();

  Serial.println("Starting measurements...");
  Serial.println();
}


// ============================================================
// LOOP
// ============================================================

void loop()
{
  int raw = readPHRaw();

  // ESP32 calibrated ADC voltage in millivolts
  uint32_t voltage_mV = analogReadMilliVolts(PH_PIN);

  float voltage = voltage_mV / 1000.0;

  Serial.println("------------------------------------------");

  Serial.print("Raw ADC       : ");
  Serial.println(raw);

  Serial.print("PO Voltage    : ");
  Serial.print(voltage, 3);
  Serial.println(" V");

  Serial.println("------------------------------------------");

  delay(2000);
}