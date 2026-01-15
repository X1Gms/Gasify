#include "GasDetector.h"
#include "Arduino.h"
/*
  Returns:
  -1 : Nothing detected
   0 : CO
   1 : GAS
*/
int detectGas(
  int mq2Digital,
  int mq5Digital,
  int mq2Analog,
  int mq5Analog
) {
  
  // If neither sensor reports anything digitally
  if (mq2Digital == LOW && mq5Digital == LOW) {
    return -1;  // Nothing
  }

  // Difference between analog readings
  int diff = mq2Analog - mq5Analog;

  // Threshold to avoid noise (tune this!)
  const int THRESHOLD = 100;

  // MQ-5 stronger → CO
  if (diff < -THRESHOLD && mq5Digital == HIGH) {
    return 0;  // CO
  }

  // MQ-2 stronger → GAS (LPG/propane/etc.)
  if (diff > THRESHOLD && mq2Digital == HIGH) {
    return 1;  // GAS
  }

  // If unclear or weak signal
  return -1;
}
