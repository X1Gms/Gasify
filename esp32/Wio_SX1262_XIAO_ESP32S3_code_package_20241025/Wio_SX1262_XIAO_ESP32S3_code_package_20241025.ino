#include "config.h"
#include "EEPROM.h"
#include <Wire.h>
#include "DHT.h"
#include "GasDetector.h"
#define DHTTYPE DHT22  // DHT 22
#define DHT_PIN D2
#define MQ2_D_PIN D0
#define MQ5_D_PIN D1
#define MQ2_A_PIN A3
#define MQ5_A_PIN A4

DHT dht(DHT_PIN, DHTTYPE);

// regional choices: EU868, US915, AU915, AS923, IN865, KR920, CN780, CN500
const LoRaWANBand_t Region = EU868;
const uint8_t subBand = 0;  // For US915 and AU915

// SX1262 pin order: Module(NSS/CS, DIO1, RESET, BUSY);
SX1262 radio = new Module(41, 39, 42, 40);

// create the LoRaWAN node
LoRaWANNode node(&radio, &Region, subBand);

uint64_t joinEUI = RADIOLIB_LORAWAN_JOIN_EUI;
uint64_t devEUI = RADIOLIB_LORAWAN_DEV_EUI;
uint8_t appKey[] = { RADIOLIB_LORAWAN_APP_KEY };
uint8_t nwkKey[] = { RADIOLIB_LORAWAN_NWK_KEY };

#define LORAWAN_DEV_INFO_SIZE 36
uint8_t deviceInfo[LORAWAN_DEV_INFO_SIZE] = { 0 };

#define SERIAL_DATA_BUF_LEN 64
uint8_t serialDataBuf[SERIAL_DATA_BUF_LEN] = { 0 };
uint8_t serialIndex = 0;

#define UPLINK_PAYLOAD_MAX_LEN 256
uint8_t uplinkPayload[UPLINK_PAYLOAD_MAX_LEN] = { 0 };
uint16_t uplinkPayloadLen = 0;

uint32_t previousMillis = 0;

void setup() {
  Serial.begin(115200);

  if (!EEPROM.begin(LORAWAN_DEV_INFO_SIZE)) {
    Serial.println("Failed to initialize EEPROM");
    while (1)
      ;
  }

  uint32_t now = millis();
  while (1) {
    deviceInfoSet();
    if (millis() - now >= 5000) break;
  }

  deviceInfoLoad();
  Serial.println(F("\nSetup... "));
  Serial.println(F("Initialise the radio"));
  int16_t state = radio.begin();
  debug(state != RADIOLIB_ERR_NONE, F("Initialise radio failed"), state, true);

  // SX1262 rf switch order: setRfSwitchPins(rxEn, txEn);
  radio.setRfSwitchPins(38, RADIOLIB_NC);

  // Setup the OTAA session information
  node.beginOTAA(joinEUI, devEUI, nwkKey, appKey);
  Serial.println(F("Join ('login') the LoRaWAN Network"));

  while (1) {
    state = node.activateOTAA(LORAWAN_UPLINK_DATA_RATE);
    if (state == RADIOLIB_LORAWAN_NEW_SESSION) break;
    debug(state != RADIOLIB_LORAWAN_NEW_SESSION, F("Join failed"), state, true);
    delay(15000);
  }

  // Disable the ADR algorithm (on by default which is preferable)
  node.setADR(false);

  // Set a fixed datarate
  node.setDatarate(LORAWAN_UPLINK_DATA_RATE);

  // Manages uplink intervals to the TTN Fair Use Policy
  node.setDutyCycle(false);

  Serial.println(F("Ready!\n"));

  Wire.begin();
  dht.begin();
  pinMode(MQ2_D_PIN, INPUT);
  pinMode(MQ5_D_PIN, INPUT);
}

void loop() {
  uplinkPayloadLen = 0;
  memset(uplinkPayload, 0, sizeof(uplinkPayload));
  int MQ2AV = analogRead(MQ2_A_PIN);
  int MQ5AV = analogRead(MQ5_A_PIN);
  int dv2 = !digitalRead(MQ2_D_PIN);
  int dv5 = !digitalRead(MQ5_D_PIN);
  int result = detectGas(dv2,dv5, MQ2AV, MQ5AV);
  // int Temperature = dht.readTemperature();
  // int Hum = dht.readHumidity();

  float tempF = dht.readTemperature();
  float humF = dht.readHumidity();

  int Temperature = 0;
  int Hum = 0;

  if (!isnan(tempF) && !isnan(humF)) {
    Temperature = (int)tempF;
    Hum = (int)humF;
  }

  delay(100);

  // Payload format:
  // result;MQ2_AV;MQ5_AV;T;H;MAC
  uint64_t efuseMac = ESP.getEfuseMac();

  uplinkPayloadLen = snprintf(
    (char *)uplinkPayload,
    sizeof(uplinkPayload),
    "%d;%d;%d;%d;%d;%04X%08X",
    result,
    MQ2AV,
    MQ5AV,
    Temperature,
    Hum,
    (uint16_t)(efuseMac >> 32),  // upper 16 bits
    (uint32_t)efuseMac           // lower 32 bits
  );


  Serial.print("Uplink payload: ");
  Serial.write(uplinkPayload, uplinkPayloadLen);
  Serial.println();


  uint32_t currentMillis = millis();
  if (currentMillis - previousMillis >= LORAWAN_UPLINK_PERIOD) {
    previousMillis = currentMillis;

    Serial.println(F("Sending uplink"));
    int16_t state = node.sendReceive(
      uplinkPayload,
      uplinkPayloadLen,
      LORAWAN_UPLINK_USER_PORT);

    if (state != RADIOLIB_LORAWAN_NO_DOWNLINK && state != RADIOLIB_ERR_NONE) {
      Serial.println("Error in sendReceive:");
      Serial.println(state);
    } else {
      Serial.println("Sending uplink successful!");
    }
  }

  delay(1000);
}



// void loop() {
//   float temp_hum_val[2] = { 0 };
//   if (!dht.readTempAndHumidity(temp_hum_val)) {
//     uplinkPayloadLen = 0;
//     memset(uplinkPayload, sizeof(uplinkPayload), 0);

//     // Convert temperature and humidity to bytes with decimal precision
//     uint16_t tempDecimal = (temp_hum_val[1] * 100);
//     uint16_t humDecimal = (temp_hum_val[0] * 100);
//     uplinkPayload[uplinkPayloadLen++] = (tempDecimal >> 8);
//     uplinkPayload[uplinkPayloadLen++] = tempDecimal & 0xFF;
//     uplinkPayload[uplinkPayloadLen++] = (humDecimal >> 8);
//     uplinkPayload[uplinkPayloadLen++] = humDecimal & 0xFF;

//     Serial.print("Temperature: ");
//     Serial.print(temp_hum_val[1]);
//     Serial.print(" *C, Humidity: ");
//     Serial.println(temp_hum_val[0]);
//     Serial.print("Uplink payload length: ");
//     Serial.println(uplinkPayloadLen);
//     // Output the uplink payload for debugging
//     Serial.print("Uplink payload: ");
//     for (int i = 0; i < uplinkPayloadLen; i++) {
//       Serial.print(uplinkPayload[i], HEX);
//       Serial.print(" ");
//     }
//     Serial.println();

//     int16_t state = node.sendReceive(uplinkPayload, uplinkPayloadLen, LORAWAN_UPLINK_USER_PORT);
//     if (state != RADIOLIB_LORAWAN_NO_DOWNLINK && state != RADIOLIB_ERR_NONE) {
//       Serial.println("Error in sendReceive:");
//       Serial.println(state);
//     } else {
//       Serial.println("Sending uplink successful!");
//     }
//   } else {
//     Serial.println("Failed to get temprature and humidity value.");
//     uplinkPayloadLen = 0;
//     memset(uplinkPayload, sizeof(uplinkPayload), 0);
//   }

//   uint32_t currentMillis = millis();
//   if (currentMillis - previousMillis >= LORAWAN_UPLINK_PERIOD) {
//     previousMillis = currentMillis;
//     if (uplinkPayloadLen) {
//       Serial.println(F("Sending uplink"));
//       int16_t state = node.sendReceive(uplinkPayload, uplinkPayloadLen, LORAWAN_UPLINK_USER_PORT);
//       debug((state != RADIOLIB_LORAWAN_NO_DOWNLINK) && (state != RADIOLIB_ERR_NONE), F("Error in sendReceive"), state, false);
//       uplinkPayloadLen = 0;
//     }
//   }
//   delay(1000);
// }

void deviceInfoLoad() {
  uint16_t checkSum = 0, checkSum_ = 0;
  for (int i = 0; i < LORAWAN_DEV_INFO_SIZE; i++) deviceInfo[i] = EEPROM.read(i);
  for (int i = 0; i < 32; i++) checkSum += deviceInfo[i];
  memcpy((uint8_t *)(&checkSum_), deviceInfo + 32, 2);

  if (checkSum == checkSum_) {
    memcpyr((uint8_t *)(&joinEUI), deviceInfo, 8);
    memcpyr((uint8_t *)(&devEUI), deviceInfo + 8, 8);
    memcpy(appKey, deviceInfo + 16, 16);

    Serial.println("Load device info:");
    Serial.print("JoinEUI:");
    Serial.println(joinEUI, HEX);
    Serial.print("DevEUI:");
    Serial.println(devEUI, HEX);
    Serial.print("AppKey:");
    arrayDump(appKey, 16);
    Serial.print("nwkKey:");
    arrayDump(nwkKey, 16);
  } else {
    Serial.println("Use the default device info as LoRaWAN param");
  }
}

void deviceInfoSet() {
  if (Serial.available()) {
    serialDataBuf[serialIndex++] = Serial.read();
    if (serialIndex >= SERIAL_DATA_BUF_LEN) serialIndex = 0;
    if (serialIndex > 2 && serialDataBuf[serialIndex - 2] == '\r' && serialDataBuf[serialIndex - 1] == '\n') {
      Serial.println("Get serial data:");
      arrayDump(serialDataBuf, serialIndex);
      if (serialIndex == 34)  // 8 + 8 + 16 + 2
      {
        uint16_t checkSum = 0;
        for (int i = 0; i < 32; i++) checkSum += serialDataBuf[i];
        memcpy(deviceInfo, serialDataBuf, 32);
        memcpy(deviceInfo + 32, (uint8_t *)(&checkSum), 2);
        for (int i = 0; i < 34; i++) EEPROM.write(i, deviceInfo[i]);
        EEPROM.commit();
        Serial.println("Save serial data, please reboot...");
      } else {
        Serial.println("Error serial data length");
      }

      serialIndex = 0;
      memset(serialDataBuf, sizeof(serialDataBuf), 0);
    }
  }
}