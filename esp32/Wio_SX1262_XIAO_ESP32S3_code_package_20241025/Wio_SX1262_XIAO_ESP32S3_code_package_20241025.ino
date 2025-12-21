#include "config.h"
#include "EEPROM.h"
#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include "DHT.h"
#include "GasDetector.h"
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


//
#define MQTT_SERVER "192.168.1.67"
#define MQTT_PORT 1800
enum CommType { WIFI,
                LORA };
CommType COMMTYPE;
WiFiClient espclient;
PubSubClient mqttClient(espclient);
DHT dht(DHT_PIN, DHTTYPE);
int16_t state = RADIOLIB_ERR_NONE;

void setupWiFi() {
  Serial.println("Connecting to Wi-Fi...");
  WiFi.begin("Osmanthus Wine", "6GEoarchon03");

  unsigned long startAttemptTime = millis();
  const unsigned long timeout = 10000;  // 10 segundos de tentativa

  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < timeout) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi connected!");
    COMMTYPE = WIFI;
    mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  } else {
    Serial.println("\nWi-Fi connection failed, fallback to LoRa");
    COMMTYPE = LORA;
  }
}

/*
*/
// volatile bool buttonState = false;
// volatile unsigned long lastInterrupt = 0;

// void IRAM_ATTR handleButtonState() {
//   unsigned long currentTime = millis();
//   if (status == PENDING) {
//     status = CANCELED;
//     digitalWrite(BUZZER_PIN, LOW);
//     lastInterrupt = currentTime;
//   } else if (status == CONFIRMED) {
//     status = IDLE;
//     digitalWrite(BUZZER_PIN, LOW);
//     lastInterrupt = currentTime;
//   }
// }
/*
*/
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
  setupWiFi();
  if (COMMTYPE == LORA) {
    Serial.println("Lora");
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

  }

  else {
    Serial.println("Wifi");
  }
   Serial.println(F("Ready!\n"));

  Wire.begin();
  dht.begin();
  pinMode(MQ2_D_PIN, INPUT);
  pinMode(MQ5_D_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT);
  // attachInterrupt(BUTTON_PIN, handleButtonState, CHANGE);
  digitalWrite(BUZZER_PIN, LOW);
}

void loop() {
  if (status == CANCELED) {
    digitalWrite(BUZZER_PIN, LOW);
  }
  
  Serial.println(status);

  // --- 1. LEITURA DE SENSORES E LÓGICA DE ALARME ---
  int MQ2AV = analogRead(MQ2_A_PIN);
  int MQ5AV = analogRead(MQ5_A_PIN);
  int dv2 = !digitalRead(MQ2_D_PIN);
  int dv5 = !digitalRead(MQ5_D_PIN);
  int result = detectGas(dv2, dv5, MQ2AV, MQ5AV);
  bool btnState = (bool)digitalRead(BUTTON_PIN);
  
  static int lastResult = -1;

  if ((status == PENDING) && btnState) {
    status = CANCELED;
    needsCancel = true;
  }
  if ((result > 0) && (status == IDLE)) {
    status = PENDING;
    alarmStartMillis = millis();
    lastResult = result;
  }
  if (status == PENDING && alarmStartMillis != 0) {
    if (millis() - alarmStartMillis >= ALARM_TIMEOUT) {
      status = CONFIRMED;
    }
  }
  
  if (status == PENDING || status == CONFIRMED) {
    digitalWrite(BUZZER_PIN, HIGH);
    if (status == CONFIRMED && btnState) {
      status = IDLE;
    }
  }

  float tempF = dht.readTemperature();
  float humF = dht.readHumidity();
  int Temperature = (!isnan(tempF)) ? (int)tempF : 0;
  int Hum = (!isnan(humF)) ? (int)humF : 0;

  delay(100); // Pequeno delay de estabilidade do sensor

  // --- 2. GERAÇÃO DO PAYLOAD (Sempre gera para debug no Serial) ---
  uint64_t efuseMac = ESP.getEfuseMac();
  memset(uplinkPayload, 0, sizeof(uplinkPayload));
  uplinkPayloadLen = snprintf(
    (char *)uplinkPayload,
    sizeof(uplinkPayload),
    "%d;%d;%d;%d;%d;%04X%08X;%d",
    result,
    MQ2AV,
    MQ5AV,
    Temperature,
    Hum,
    (uint16_t)(efuseMac >> 32),
    (uint32_t)efuseMac,
    status);

  Serial.print("Uplink payload: ");
  Serial.println((char*)uplinkPayload);

  // --- 3. BLOCO DE ENVIO TEMPORIZADO (Respeita o LORAWAN_UPLINK_PERIOD) ---
  uint32_t currentMillis = millis();
  if (currentMillis - previousMillis >= LORAWAN_UPLINK_PERIOD) {
    previousMillis = currentMillis;

    if (COMMTYPE == WIFI) {
      Serial.println(F("Sending WiFi uplink (MQTT)"));
      if (!mqttClient.connected()) {
        mqttClient.connect("ESP32_Client"); 
      }
      
      if (mqttClient.connected()) {
        mqttClient.loop();
        if (mqttClient.publish("sensor/data", (char*)uplinkPayload)) {
          Serial.println("MQTT Publish successful!");
        }
      }
    } 
    else if (COMMTYPE == LORA) {
      Serial.println(F("Sending LoRa uplink"));
      int16_t state = node.sendReceive(uplinkPayload, uplinkPayloadLen, LORAWAN_UPLINK_USER_PORT);

      if (state == RADIOLIB_ERR_NONE || state == RADIOLIB_LORAWAN_NO_DOWNLINK) {
        Serial.println("Sending uplink successful!");
        if (status == CANCELED && needsCancel) {
          needsCancel = false;
          status = IDLE;
        }
      } else {
        Serial.print("Error in LoRa send: ");
        Serial.println(state);
      }
    }
  }

  delay(1000); // Delay original de 1 segundo do loop
  if (status == CANCELED) status = IDLE;
}


// void loop() {
//   if (status == CANCELED) {
//     digitalWrite(BUZZER_PIN, LOW);
//   }
//   Serial.println(status);
//   uplinkPayloadLen = 0;
//   memset(uplinkPayload, 0, sizeof(uplinkPayload));
//   int MQ2AV = analogRead(MQ2_A_PIN);
//   int MQ5AV = analogRead(MQ5_A_PIN);
//   int dv2 = !digitalRead(MQ2_D_PIN);
//   int dv5 = !digitalRead(MQ5_D_PIN);
//   int result = detectGas(dv2, dv5, MQ2AV, MQ5AV);
//   bool btnState = (bool)digitalRead(BUTTON_PIN);
//   static bool _ = -1;
//   if ((status == PENDING) && btnState) {
//     status = CANCELED;
//     needsCancel = true;
//   }
//   if ((result > 0) && (status == IDLE)) {
//     status = PENDING;
//     alarmStartMillis = millis();
//     _ = result;
//   }
//   if (status == PENDING && alarmStartMillis != 0) {
//     if (millis() - alarmStartMillis >= ALARM_TIMEOUT) {
//       status = CONFIRMED;
//       if (result < 0) {
//         if (!(status == IDLE)) {
//           result = _;
//         }
//       }
//     }
//   }
//   if (status == PENDING) {
//     digitalWrite(BUZZER_PIN, HIGH);
//   } else if (status == CONFIRMED) {
//     digitalWrite(BUZZER_PIN, HIGH);
//     if (btnState) {
//       status = IDLE;
//     }
//   }
//   // int Temperature = dht.readTemperature();
//   // int Hum = dht.readHumidity();

//   float tempF = dht.readTemperature();
//   float humF = dht.readHumidity();

//   int Temperature = 0;
//   int Hum = 0;

//   if (!isnan(tempF) && !isnan(humF)) {
//     Temperature = (int)tempF;
//     Hum = (int)humF;
//   }

//   delay(100);

//   // Payload format:
//   // result;MQ2_AV;MQ5_AV;T;H;MAC
//   uint64_t efuseMac = ESP.getEfuseMac();

//   uplinkPayloadLen = snprintf(
//     (char *)uplinkPayload,
//     sizeof(uplinkPayload),
//     "%d;%d;%d;%d;%d;%04X%08X;%d",
//     result,
//     MQ2AV,
//     MQ5AV,
//     Temperature,
//     Hum,
//     (uint16_t)(efuseMac >> 32),  // upper 16 bits
//     (uint32_t)efuseMac,          // lower 32 bits,
//     status);


//   Serial.print("Uplink payload: ");
//   Serial.write(uplinkPayload, uplinkPayloadLen);
//   Serial.println();


//   uint32_t currentMillis = millis();
//   if (currentMillis - previousMillis >= LORAWAN_UPLINK_PERIOD) {
//     previousMillis = currentMillis;

//     Serial.println(F("Sending uplink"));
//     int16_t state = node.sendReceive(
//       uplinkPayload,
//       uplinkPayloadLen,
//       LORAWAN_UPLINK_USER_PORT);

//     if (state == RADIOLIB_ERR_NONE) {
//       if (state == CANCELED && needsCancel) {
//         needsCancel = false;
//         state = IDLE;
//       }
//     }
//     if (state != RADIOLIB_LORAWAN_NO_DOWNLINK && state != RADIOLIB_ERR_NONE) {
//       Serial.println("Error in sendReceive:");
//       Serial.println(state);
//     } else {
//       Serial.println("Sending uplink successful!");
//     }
//   }

//   delay(1000);
//   if (status == CANCELED) status = IDLE;
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