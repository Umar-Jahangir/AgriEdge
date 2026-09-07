#include <Arduino.h>

// ===============================
// LEFT SIDE
// ===============================
#define ENA 25
#define IN1 26
#define IN2 27

// ===============================
// RIGHT SIDE
// ===============================
#define ENB 17
#define IN3 14
#define IN4 16

#define PWM_FREQ 1000
#define PWM_RESOLUTION 8

#define MOTOR_SPEED 255


void stopMotors() {

  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);

  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);

  ledcWrite(ENA, 0);
  ledcWrite(ENB, 0);
}


void forward() {

  Serial.println("FORWARD");

  // LEFT
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);

  // RIGHT
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);

  ledcWrite(ENA, MOTOR_SPEED);
  ledcWrite(ENB, MOTOR_SPEED);
}


void backward() {

  Serial.println("BACKWARD");

  // LEFT
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);

  // RIGHT
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);

  ledcWrite(ENA, MOTOR_SPEED);
  ledcWrite(ENB, MOTOR_SPEED);
}


void left() {

  Serial.println("LEFT");

  // LEFT side backward
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);

  // RIGHT side forward
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);

  ledcWrite(ENA, MOTOR_SPEED);
  ledcWrite(ENB, MOTOR_SPEED);
}


void right() {

  Serial.println("RIGHT");

  // LEFT side forward
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);

  // RIGHT side backward
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);

  ledcWrite(ENA, MOTOR_SPEED);
  ledcWrite(ENB, MOTOR_SPEED);
}


void setup() {

  Serial.begin(115200);

  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);

  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);

  ledcAttach(ENA, PWM_FREQ, PWM_RESOLUTION);
  ledcAttach(ENB, PWM_FREQ, PWM_RESOLUTION);

  stopMotors();

  Serial.println();
  Serial.println("================================");
  Serial.println("     AGRIEDGE ROVER");
  Serial.println("     ALL 4 MOTOR TEST");
  Serial.println("================================");
  Serial.println();
  Serial.println("Starting in 3 seconds...");

  delay(3000);
}


void loop() {

  // FORWARD
  forward();
  delay(2000);

  stopMotors();
  delay(1500);


  // BACKWARD
  backward();
  delay(2000);

  stopMotors();
  delay(1500);


  // LEFT
  left();
  delay(1500);

  stopMotors();
  delay(1500);


  // RIGHT
  right();
  delay(1500);

  stopMotors();
  delay(2000);


  Serial.println();
  Serial.println("========== CYCLE COMPLETE ==========");
  Serial.println();

  delay(2000);
}