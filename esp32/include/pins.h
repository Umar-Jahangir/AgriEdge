#pragma once
// AgriEdge Rover — GPIO Pin Configuration
// PLACEHOLDER VALUES — DO NOT use in production until hardware team confirms wiring

#ifndef PINS_H
#define PINS_H

// Soil sensors (analog pins — TBD)
#define PIN_SOIL_MOISTURE     -1
#define PIN_SOIL_PH           -1
#define PIN_SOIL_EC           -1
#define PIN_NPK_N             -1
#define PIN_NPK_P             -1
#define PIN_NPK_K             -1

// DS18B20 soil temperature (1-Wire — TBD)
#define PIN_SOIL_TEMP         -1

// DHT22 environmental sensor (TBD)
#define PIN_DHT22             -1

// Ultrasonic sensors (TBD)
#define PIN_US_FRONT_TRIG     -1
#define PIN_US_FRONT_ECHO     -1
#define PIN_US_LEFT_TRIG      -1
#define PIN_US_LEFT_ECHO      -1
#define PIN_US_RIGHT_TRIG     -1
#define PIN_US_RIGHT_ECHO     -1

// Motor driver pins (TBD — depends on driver IC)
#define PIN_MOTOR_FL_IN1      -1
#define PIN_MOTOR_FL_IN2      -1
#define PIN_MOTOR_FL_PWM      -1
// ... additional motor pins TBD

#endif
