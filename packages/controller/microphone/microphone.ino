#include "arduinoFFT.h"
#include <TFT_eSPI.h> // Hardware-specific library

#define SAMPLES 1024             //Must be a power of 2
#define SAMPLING_FREQUENCY 10000 //Hz, must be less than 10000 due to ADC

#define MIN_FREQUENCY 2000
#define MAX_FREQUENCY 4960
#define TONES_NUMBER 17
#define FREQUENCY_RANGE floor((MAX_FREQUENCY - MIN_FREQUENCY) / TONES_NUMBER)
#define MAX_LENGTH 1024

arduinoFFT FFT = arduinoFFT();

TFT_eSPI tft = TFT_eSPI(); // Invoke custom library

int redpin = 25; // select the pin for the red LED
int greenpin = 26;// select the pin for the green LED
int bluepin = 27; // select the pin for the blue LED
int freq = 2000;
int channel = 0;
int resolution = 8;
int cipherNum;
 
unsigned int sampling_period_us;
unsigned long microseconds;

double vReal[SAMPLES];
double vImag[SAMPLES];

int arrayIndex;
boolean recording;
double recordedValues[MAX_LENGTH];
long timeOfRecording;

void setup() {
  tft.init();
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_WHITE);
  
  Serial.begin(115200);
 
  sampling_period_us = round(1000000*(1.0/SAMPLING_FREQUENCY));

  // microphone
  pinMode(2, INPUT);
  // right button
  pinMode(35, INPUT);
  arrayIndex = 0;
  timeOfRecording = 0;
  // beeper
  ledcSetup(channel, freq, resolution);
  ledcAttachPin(17, channel);

  // generate random number for encryption
  do {
    cipherNum = random(1, 50);
  } while (cipherNum == 8 || cipherNum == 6);
  drawCipherNum();
}
 
void loop() {
  if (digitalRead(35) == LOW) {
    // first time recording send request
    if (recording == false) {
      ledcWrite(channel, 150);
      ledcWriteTone(channel, 1739);
      delay(1000);
//      requestColor();
      requestInteger();
//      requestString();
      delay(1000);
      ledcWriteTone(channel, 1739);
      delay(1000);
      ledcWrite(channel, 0);
    }
    Serial.println("Button down ---> Recording");
    recording = true;
    // just started to record
    if (timeOfRecording == 0) {
          timeOfRecording = micros();
    }
    
    /*SAMPLING*/
    for(int i=0; i<SAMPLES; i++) {
      microseconds = micros();    //Overflows after around 70 minutes!
   
      vReal[i] = analogRead(2);
      vImag[i] = 0;
   
      while(micros() < (microseconds + sampling_period_us)){
      }
    }
    
    /*FFT*/
    FFT.Windowing(vReal, SAMPLES, FFT_WIN_TYP_RECTANGLE, FFT_FORWARD);
    FFT.Compute(vReal, vImag, SAMPLES, FFT_FORWARD);
    FFT.ComplexToMagnitude(vReal, vImag, SAMPLES);
    double peak = FFT.MajorPeak(vReal, SAMPLES, SAMPLING_FREQUENCY);

    recordedValues[arrayIndex] = peak;
    arrayIndex++;
    
    /*PRINT RESULTS*/
    Serial.println(peak);     //Print out what frequency is the most dominant.
    
    delay(250);  //Repeat the process every second OR:
    // while(1);       //Run code once
  } else {
    // when the button was released
    if (recording == true){
      Serial.println("Button up");
      recording = false;
      // process recorded values
      processRecording();
      // clean recorded values
      for(int i = 0; i < MAX_LENGTH; i++) {
        if (recordedValues[i] != 0) {
          recordedValues[i] = 0;
        }
      }
    }
  }
}

void requestColor() {
  ledcWriteTone(channel, 2087);
}

void requestInteger() {
  ledcWriteTone(channel, 3305);
}

void requestString() {
  ledcWriteTone(channel, 4697);
}

void processRecording() {
  double recordingMap[arrayIndex];
  double sampleRate[arrayIndex];
  int index = 0;
  double counter = 1;
  double realSampleRate = 1000/250;
  for(int i = 0; i < arrayIndex - 1; i++) {
    if (!areSameFrequency(recordedValues[i], recordedValues[i + 1])){
      recordingMap[index] = recordedValues[i];
      sampleRate[index] = counter / realSampleRate;
//      Serial.println(recordingMap[index]);
//      Serial.println(sampleRate[index]);
      counter = 1;
      index++;
    } else {
      counter++;
    }
  }
  processData(recordingMap, sampleRate, index);
  
}

void processData (double recordingMap[], double sampleRate[], int arraySize) {
  boolean valid = false;
  double dataValues[arraySize], encodedDataValues[arraySize];
  boolean isResponse;
  int byteValue, dataIndex = 0, leftShift;
  for(int i = 0; i < arraySize; i++) {
    if (isResponseMarkTone(recordingMap[i], sampleRate[i])) {
      Serial.println("mark tone");
      valid = !valid;
      isResponse = true;
    } else if (valid) {
      byteValue = frequencyToByte(recordingMap[i]);
      if ((byteValue != -1) && (sampleRate[i] >= 0.3)) {
          encodedDataValues[dataIndex] = byteValue;
          dataIndex++;
          Serial.println(byteValue);
      }
    }
  }
  // shift left Ceaser Cipher
  Serial.println("Ceaser Cipher");
  leftShift = cipherNum % dataIndex;
  Serial.println((String)"Left shift:" + leftShift);
  for (int i = 0; i < dataIndex; i++){
    if (i < leftShift) {
      dataValues[dataIndex - leftShift + i] = encodedDataValues[i];
    } else {
      dataValues[i - leftShift] = encodedDataValues[i];
    }
  }

  for (int i = 0; i < dataIndex; i++) {
    Serial.println(dataValues[i]);
  }
  
//  processColor(dataValues, dataIndex);
  processInteger(dataValues, dataIndex);
//  processString(dataValues, dataIndex);
}

void processColor (double dataValues[], int arraySize) {
  double chunkedColor[arraySize/2];
  int indexChunk = 0;
  tft.fillScreen(TFT_BLACK);
  if (arraySize != 6) {
    Serial.println("Unexpected number of values were received");
  } else {
    for (int i = 0; i < arraySize; i += 2) {
      chunkedColor[indexChunk] = (dataValues[i+1] * 16) + dataValues[i];
      Serial.println(chunkedColor[indexChunk]);
      indexChunk++;
    }
    // LED
    ledcAttachPin(redpin, 1);
    ledcAttachPin(bluepin, 2);
    ledcAttachPin(greenpin, 3);
  
    ledcSetup(1, 12000, 8);
    ledcSetup(2, 12000, 8);
    ledcSetup(3, 12000, 8);
    
    ledcWrite(1, chunkedColor[0]);
    ledcWrite(2, chunkedColor[1]);
    ledcWrite(3, chunkedColor[2]);
    tft.drawString("Color received", 5, 90, 2);
    tft.drawNumber(chunkedColor[0], 5, 120, 2);
    tft.drawNumber(chunkedColor[0], 25, 120, 2);
    tft.drawNumber(chunkedColor[0], 45, 120, 2);

    drawCipherNum();
  }
}

void processInteger (double dataValues[], int arraySize) {
  unsigned int value = 0;
  tft.fillScreen(TFT_BLACK);
  if (arraySize != 8) {
    Serial.println("Unexpected number of values were received");
  } else {
    for (int i = arraySize - 1; i >= 0; i--) {
      value = (value * 16) + dataValues[i];
    }
    Serial.println(value);
    tft.drawString("Integer received", 5, 90, 2);
    tft.drawNumber(value, 5, 120, 4);
  }
  drawCipherNum();
}

void processString (double dataValues[], int arraySize) {
  double chunkedString[arraySize/2];
  int indexChunk = 0;
  String values = "";
  tft.drawString(values, 5, 120, 4);
  tft.fillScreen(TFT_BLACK);
  tft.drawString("String received", 5, 90, 2);
  for (int i = 0; i < arraySize; i += 2) {
    chunkedString[indexChunk] = (dataValues[i+1] * 16) + dataValues[i];
    values.concat(char(chunkedString[indexChunk]));
    Serial.println(chunkedString[indexChunk]);
    indexChunk++;
  }
  tft.drawString(values, 5, 120, 4);

  drawCipherNum();
}

void drawCipherNum() {
  tft.drawString("Caesar Cipher:", 5, 20, 2);
  tft.drawNumber(cipherNum, 5, 40, 2);
}

int frequencyToByte(double freq) {
  return (floor((freq - MIN_FREQUENCY) / FREQUENCY_RANGE));
}

boolean areSameFrequency (double freq1, double freq2) {
    return (floor((freq1 - MIN_FREQUENCY) / FREQUENCY_RANGE) == floor((freq2 - MIN_FREQUENCY) / FREQUENCY_RANGE));
}

boolean isResponseMarkTone (double freq, double duration) {
//  Serial.println(frequencyToByte(freq));
//  Serial.println(duration);
  return ((frequencyToByte(freq) == 16) && (duration >= 0.1));
}
