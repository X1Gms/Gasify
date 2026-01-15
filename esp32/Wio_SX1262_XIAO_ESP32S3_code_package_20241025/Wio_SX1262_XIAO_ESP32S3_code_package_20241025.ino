#include "config.h"
#include "EEPROM.h"
#include <DES.h>
#include <Wire.h>
#include "DHT.h"
#include "GasDetector.h"
#include <MD5Builder.h>
#define debounceDelay 1000
#define BUZZER_PIN D7
#define BUTTON_PIN D6
#define DHTTYPE DHT22  // DHT 22
#define DHT_PIN D2
#define MQ2_D_PIN D0
#define MQ5_D_PIN D1
#define MQ2_A_PIN A3
#define MQ5_A_PIN A4
unsigned long alarmStartMillis = 0;
bool needsCancel = false;
#define ALARM_TIMEOUT 30000UL  // 30 seconds
// States
#define IDLE 0       // 00 -> no emergency
#define PENDING 1    // 01 -> buzzer active, waiting 30s
#define CANCELED 2   // 10 -> canceled
#define CONFIRMED 3  // 11 -> not canceled
volatile int status = IDLE;
DHT dht(DHT_PIN, DHTTYPE);
int16_t state = RADIOLIB_ERR_NONE;
DES des;
uint8_t downlinkBuf[64];
size_t downlinkLen = sizeof(downlinkBuf);
byte des_key[24] = {
  0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
  0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10,
  0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18
};
String encryptPayload3DES(char *input, int len) {
  String encryptedHex = "";

  // Calculate how many 8-byte blocks we need
  // (Adding 7 and dividing by 8 handles the padding)
  int numBlocks = (len + 7) / 8;

  for (int b = 0; b < numBlocks; b++) {
    byte blockInput[8] = { 0 };  // Initialize with zeros (Zero Padding)
    byte blockOutput[8] = { 0 };

    // Fill the 8-byte block with data from the payload
    for (int i = 0; i < 8; i++) {
      int charIdx = (b * 8) + i;
      if (charIdx < len) {
        blockInput[i] = (byte)input[charIdx];
      } else {
        blockInput[i] = 0x00;  // Padding character
      }
    }

    // Encrypt this specific 8-byte block
    des.tripleEncrypt(blockOutput, blockInput, des_key);

    // Convert this block to Hex and append to result
    for (int i = 0; i < 8; i++) {
      if (blockOutput[i] < 0x10) encryptedHex += "0";
      encryptedHex += String(blockOutput[i], HEX);
    }
  }

  encryptedHex.toUpperCase();
  return encryptedHex;
}

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
  state = radio.begin();
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
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT);
  digitalWrite(BUZZER_PIN, LOW);
}

void loop() {
  if (status == CANCELED) {
    digitalWrite(BUZZER_PIN, LOW);
  }
  Serial.println(status);
  uplinkPayloadLen = 0;
  memset(uplinkPayload, 0, sizeof(uplinkPayload));
  int MQ2AV = analogRead(MQ2_A_PIN);
  int MQ5AV = analogRead(MQ5_A_PIN);
  int dv2 = !digitalRead(MQ2_D_PIN);
  int dv5 = !digitalRead(MQ5_D_PIN);
  int result = detectGas(dv2, dv5, MQ2AV, MQ5AV);
  float tempF = dht.readTemperature();
  float humF = dht.readHumidity();

  int Temperature = 0;
  int Hum = 0;

  if (!isnan(tempF) && !isnan(humF)) {
    Temperature = (int)tempF;
    Hum = (int)humF;
  }
  uint64_t efuseMac = ESP.getEfuseMac();


  delay(100);
  bool btnState = (bool)digitalRead(BUTTON_PIN);
  static bool _ = -1;
  if ((status == PENDING) && btnState) {


    delay(1000);

    uplinkPayloadLen = snprintf(
      (char *)uplinkPayload,
      sizeof(uplinkPayload),
      "%d;%d;%d;%d;%d;%04X%08X;%d",
      result,
      MQ2AV,
      MQ5AV,
      Temperature,
      Hum,
      (uint16_t)(efuseMac >> 32),  // upper 16 bits
      (uint32_t)efuseMac,          // lower 32 bits,
      CANCELED);
    Serial.print("Raw Payload (String): ");
    Serial.println((char *)uplinkPayload);  // Prints the human-readable string

    Serial.print("Raw Payload (Hex):    ");
    for (int i = 0; i < uplinkPayloadLen; i++) {
      Serial.printf("%02X ", uplinkPayload[i]);  // Prints the ASCII hex codes
    }
    Serial.println();
    String encryptedString = encryptPayload3DES((char *)uplinkPayload, uplinkPayloadLen);
    uint8_t loraBuffer[256];
    encryptedString.getBytes(loraBuffer, 256);
    int finalLen = encryptedString.length();

    Serial.print("Uplink payload (Encrypted Hex): ");
    for (int i = 0; i < uplinkPayloadLen; i++) {
      Serial.printf("%02X", uplinkPayload[i]);
    }

    downlinkLen = sizeof(downlinkBuf);
    int16_t state = node.sendReceive(
      loraBuffer,
      finalLen,
      LORAWAN_UPLINK_USER_PORT,
      downlinkBuf,
      &downlinkLen);
    status = IDLE;
    needsCancel = false;
  }
  if ((result > 0) && (status == IDLE)) {
    status = PENDING;
    alarmStartMillis = millis();
    _ = result;
  }
  if (status == PENDING && alarmStartMillis != 0) {
    if (millis() - alarmStartMillis >= ALARM_TIMEOUT) {
      status = CONFIRMED;
      if (result < 0) {
        if (!(status == IDLE)) {
          result = _;
        }
      }
    }
  }
  if (status == PENDING) {
    digitalWrite(BUZZER_PIN, HIGH);
  } else if (status == CONFIRMED) {
    digitalWrite(BUZZER_PIN, HIGH);
    if (btnState) {
      status = IDLE;
    }
  }
  // int Temperature = dht.readTemperature();
  // int Hum = dht.readHumidity();



  // Payload format:
  // result;MQ2_AV;MQ5_AV;T;H;MAC

  uplinkPayloadLen = snprintf(
    (char *)uplinkPayload,
    sizeof(uplinkPayload),
    "%d;%d;%d;%d;%d;%04X%08X;%d",
    result,
    MQ2AV,
    MQ5AV,
    Temperature,
    Hum,
    (uint16_t)(efuseMac >> 32),  // upper 16 bits
    (uint32_t)efuseMac,          // lower 32 bits,
    status);
  Serial.print("Raw Payload (String): ");
  Serial.println((char *)uplinkPayload);  // Prints the human-readable string

  Serial.print("Raw Payload (Hex):    ");
  for (int i = 0; i < uplinkPayloadLen; i++) {
    Serial.printf("%02X ", uplinkPayload[i]);  // Prints the ASCII hex codes
  }
  Serial.println();
  String encryptedString = encryptPayload3DES((char *)uplinkPayload, uplinkPayloadLen);
  uint8_t loraBuffer[256];
  encryptedString.getBytes(loraBuffer, 256);
  int finalLen = encryptedString.length();

  Serial.print("Uplink payload (Encrypted Hex): ");
  for (int i = 0; i < uplinkPayloadLen; i++) {
    Serial.printf("%02X", uplinkPayload[i]);
  }
  Serial.println();


  uint32_t currentMillis = millis();
  if (currentMillis - previousMillis >= LORAWAN_UPLINK_PERIOD) {
    previousMillis = currentMillis;

    Serial.println(F("Sending uplink"));
    // Envio do payload já criptografado
    downlinkLen = sizeof(downlinkBuf);

    int16_t state = node.sendReceive(
      loraBuffer,
      finalLen,
      LORAWAN_UPLINK_USER_PORT,
      downlinkBuf,
      &downlinkLen);

    if (state == RADIOLIB_ERR_NONE) {
      if (downlinkLen > 0) {
        Serial.println("\nAAAAAAAAAA\n");
        downlinkBuf[downlinkLen] = '\0';  // make it a C string
        String cmd = (char *)downlinkBuf;
        // Serial.println(cmd);
        // String decryptedText = decryptPayload3DES(cmd);
        String macStr = String((efuseMac >> 40) & 0xFF, HEX) + String((efuseMac >> 32) & 0xFF, HEX) + String((efuseMac >> 24) & 0xFF, HEX) + String((efuseMac >> 16) & 0xFF, HEX) + String((efuseMac >> 8) & 0xFF, HEX) + String(efuseMac & 0xFF, HEX);

        // Ensure uppercase and two digits per byte
        macStr.toUpperCase();


        MD5Builder md;

        md.begin();
        md.add(macStr);
        md.calculate();

        Serial.println(md.toString());
        if (md.toString() == cmd) {
          // status = CANCELED;
          // needsCancel = true;
          delay(1000);

          uplinkPayloadLen = snprintf(
            (char *)uplinkPayload,
            sizeof(uplinkPayload),
            "%d;%d;%d;%d;%d;%04X%08X;%d",
            result,
            MQ2AV,
            MQ5AV,
            Temperature,
            Hum,
            (uint16_t)(efuseMac >> 32),  // upper 16 bits
            (uint32_t)efuseMac,          // lower 32 bits,
            CANCELED);
          Serial.print("Raw Payload (String): ");
          Serial.println((char *)uplinkPayload);  // Prints the human-readable string

          Serial.print("Raw Payload (Hex):    ");
          for (int i = 0; i < uplinkPayloadLen; i++) {
            Serial.printf("%02X ", uplinkPayload[i]);  // Prints the ASCII hex codes
          }
          Serial.println();
          String encryptedString = encryptPayload3DES((char *)uplinkPayload, uplinkPayloadLen);
          uint8_t loraBuffer[256];
          encryptedString.getBytes(loraBuffer, 256);
          int finalLen = encryptedString.length();

          Serial.print("Uplink payload (Encrypted Hex): ");
          for (int i = 0; i < uplinkPayloadLen; i++) {
            Serial.printf("%02X", uplinkPayload[i]);
          }

          downlinkLen = sizeof(downlinkBuf);
          int16_t state = node.sendReceive(
            loraBuffer,
            finalLen,
            LORAWAN_UPLINK_USER_PORT,
            downlinkBuf,
            &downlinkLen);
          status = IDLE;
          needsCancel = false;
        }
      }
      if (state == CANCELED && needsCancel) {
        needsCancel = false;
        state = IDLE;
      }
    }
    if (state != RADIOLIB_LORAWAN_NO_DOWNLINK && state != RADIOLIB_ERR_NONE) {
      Serial.println("Error in sendReceive:");
      Serial.println(state);
    } else {
      Serial.println("Sending uplink successful!");
    }
  }
  delay(1000);
  if (status == CANCELED) status = IDLE;
}


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