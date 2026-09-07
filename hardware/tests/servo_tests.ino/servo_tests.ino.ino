#include <Arduino.h>
#include <ESP32Servo.h>

#define SERVO_PIN 13

Servo soilProbeServo;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("======================================");
  Serial.println("      AGRIEDGE ROVER");
  Serial.println("      SERVO MOTOR TEST");
  Serial.println("======================================");
  Serial.println();

  soilProbeServo.setPeriodHertz(50);
  soilProbeServo.attach(SERVO_PIN, 500, 2400);

  Serial.println("Servo initialized.");
  Serial.println("Starting test...");
  Serial.println();

  delay(1000);
}

void moveServo(int angle) {
  Serial.print("Moving servo to ");
  Serial.print(angle);
  Serial.println(" degrees");

  soilProbeServo.write(angle);
  delay(1500);
}

void loop() {

  moveServo(0);
  moveServo(45);
  moveServo(90);
  moveServo(135);
  moveServo(180);

  delay(1000);

  moveServo(135);
  moveServo(90);
  moveServo(45);
  moveServo(0);

  Serial.println();
  Serial.println("Test cycle complete.");
  Serial.println("Repeating...");
  Serial.println();

  delay(2000);
}