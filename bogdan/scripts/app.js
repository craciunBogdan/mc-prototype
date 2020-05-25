// Helper functions and constants
const MIN_FREQUENCY = 2000;
const MAX_FREQUENCY = 20000;
const TONES_NUMBER = 257;
const MARK_BYTE = 256;
const SEPARATOR_BYTE = -1;
const FREQUENCY_RANGE = Math.floor((MAX_FREQUENCY - MIN_FREQUENCY) / TONES_NUMBER);

let areSameFrequency = function (freq1, freq2) {
  return (Math.floor((freq1 - MIN_FREQUENCY) / FREQUENCY_RANGE) === Math.floor((freq2 - MIN_FREQUENCY) / FREQUENCY_RANGE));
}

let frequencyToByte = function (freq) {
  return (Math.floor((freq - MIN_FREQUENCY) / FREQUENCY_RANGE));
}

let isMarkTone = function (freq, duration) {
  return (frequencyToByte(freq) === MARK_BYTE ) && (duration >= 0.1);
}

// We add FREQUENCY_RANGE / 2 instead of 
// FREQUENCY_RANGE because in this way,
// the frequency we produce is at the middle of the
// range of frequencies that match to the given byte
// instead of the lower end of the range.
let byteToFrequency = function (value) {
  return (value * FREQUENCY_RANGE + (MIN_FREQUENCY + Math.floor(FREQUENCY_RANGE / 2)));
}

let buildFrequencyArray = function (byteArray) {
  var freqArray = byteArray.map(x => byteToFrequency(x));
  // Insert mark tones at both ends of the array
  freqArray.unshift(byteToFrequency(MARK_BYTE));
  freqArray.push(byteToFrequency(MARK_BYTE));
  // Insert separators between 2 equal frequencies 
  for (var i = 0; i < freqArray.length - 1; i++) {
    if (freqArray[i] === freqArray[i + 1]) {
      freqArray.splice(i + 1, 0, byteToFrequency(SEPARATOR_BYTE));
    }
  }
  return freqArray;
}

let intToByteArray = function (value) {
  var byteArray = [0, 0, 0, 0];

  for (var i = 0; i < byteArray.length; i++) {
      var byte = value & 0xff;
      byteArray[i] = byte;
      value = (value - byte) / 256 ;
  }

  return byteArray;
}

let byteArrayToInt = function (byteArray) {
  var value = 0;
  
  for (var i = byteArray.length - 1; i >= 0; i--) {
      value = (value * 256) + byteArray[i];
  }

  return value;
}

let stringToByteArray = function (string) {
  return string.split('').map(x => x.charCodeAt());
}

let byteArrayToString = function (byteArray) {
  return byteArray.map(x => String.fromCharCode(x));
}
// Helper functions and constants END

// set up basic variables for app
let recording = false;
let dataType = 'color';
document.getElementById('dataType').value = dataType;
let timeOfRecording = 0;
let recordedValues = [];
const canvas = document.querySelector('.visualizer');
const canvasCtx = canvas.getContext("2d");
let audioCtx = new AudioContext();

// oscillator does the audio playback
const oscillator = audioCtx.createOscillator();
let playbackValue = [255, 0, 255];
let playbackBytes = [255, 0, 255]; // byte values
let playbackFrequencies = buildFrequencyArray(playbackBytes); // Hz
let playbackDuration = 0.5; // seconds
document.getElementById('playbackBytes').value = playbackBytes;
document.getElementById('playbackFrequencies').value = playbackFrequencies;
document.getElementById('playbackDuration').value = playbackDuration;
oscillator.type = 'square';
oscillator.frequency.setValueAtTime(playbackFrequencies[0], audioCtx.currentTime);
oscillator.start();

// Form submit function
let onFormPlaybackSubmit = function () {
  var e = document.getElementById('dataType');
  dataType = e.options[e.selectedIndex].value;
  console.log(`Data type set to ${dataType}`);

  switch (dataType) {
    case 'color':
      playbackValue = document.getElementById('playbackValue').value.split(',').map(s => parseInt(s));
      playbackBytes = playbackValue;
      break;
    case 'integer':
      playbackValue = [parseInt(document.getElementById('playbackValue').value)];
      playbackBytes = intToByteArray(playbackValue[0]);
      break;
    case 'string':
      playbackValue = document.getElementById('playbackValue').value;
      playbackBytes = stringToByteArray(playbackValue);
      console.log("Not yet implemented.")
  }
  document.getElementById('playbackBytes').value = playbackBytes;
  
  playbackFrequencies = buildFrequencyArray(playbackBytes);
  document.getElementById('playbackFrequencies').value = playbackFrequencies;
  for (var i = 0; i < playbackFrequencies.length; i++) {
    console.log("Audio playback frequency set to: " + playbackFrequencies[i]);
  }
  
  playbackDuration = parseFloat(document.getElementById('playbackDuration').value);
  console.log("Audio playback duration for each tone set to: " + playbackDuration + " seconds");
  
  console.log("Audio ready.");
}

// Start audio playback button function
let onStartAudio = function () {
  audioCtx.resume();
  currentTime = audioCtx.currentTime;
  for (var i = 0; i < playbackFrequencies.length; i++) {
    oscillator.frequency.setValueAtTime(playbackFrequencies[i], currentTime + (i * playbackDuration));
  }
  oscillator.connect(audioCtx.destination);
}

// Stop audio playback button function
let onStopAudio = function () {
  audioCtx.resume();
  oscillator.disconnect(audioCtx.destination);
}

// Start recording button function
let onStartRecord = function () {
  timeOfRecording = audioCtx.currentTime;
  recordedValues = [];
  recording = true;
}

// Stop recording button function
let onStopRecord = function () {
  recording = false;
  
  console.log(audioCtx.currentTime - timeOfRecording);
  console.log(recordedValues.length + " values recorded:\n" + recordedValues);
  
  var realSampleRate = recordedValues.length / (audioCtx.currentTime - timeOfRecording);
  var recordingMap = processRecording(recordedValues, realSampleRate);
  console.log("The following records represent the frequencies and the duration they were recorded for:");
  console.log("{");
  for (let [index, data] of recordingMap) {
    console.log(`${index}: ${data}`);
  }
  console.log("}");

  processData(recordingMap, dataType);
}

// Function that receives the recording and generates the frequencies it finds and
// how long they were recorded for.
let processRecording = function (recordedValues, realSampleRate) {
  var recordingMap = new Map();
  var counter = 1;
  var index = 0;

  if (recordedValues.length < 1) {
    return recordingMap;
  }

  for (var i = 1; i < recordedValues.length; i++) {
    if ((i + 1 === recordedValues.length) || 
        (!areSameFrequency(recordedValues[i], recordedValues[i + 1]))) {
      recordingMap.set(index, [recordedValues[i], counter / realSampleRate]);
      counter = 1;
      index++;
    } else {
      counter++;
    }
  }

  return recordingMap;
}

// Given the frequencies and the type of data, process the data and
// generate the appropriate response.
let processData = function (recordingMap, dataType) {
  var valid = false;
  var data = [];

  for (let [_, [freq, duration]] of recordingMap) {
    if (isMarkTone(freq, duration)) {
      valid = !valid;
    } else if (valid) {
      // Check if the current tone is a separator tone
      var byteValue = frequencyToByte(freq);
      if (byteValue !== -1) {
        data.push(frequencyToByte(freq));
      }
    }
  }

  switch (dataType) {
    case 'color':
      processColor(data);
      break;
    case 'integer':
      processInteger(data);
      break;
    case 'string':
      processString(data);
      break;
    default:
      console.log("You shouldn't be here...");
  }
}

// Process the data when the data type is color
let processColor = function (data) {
  console.log(data);
  console.log(data.length);
  if (data.length !== 3) {
    console.log("Invalid color data. More or less than 3 values were received.");
  } else {
    document.getElementById('recordedColor').style.background = `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
    console.log(`Received color:\nR:${data[0]}\nG:${data[1]}\nB:${data[2]}`);
  }
}

// Process the data when the data type is integer
let processInteger = function (data) {
  console.log(data);
  console.log(data.length);
  if (data.length !== 4) {
    console.log("Invalid integer data. More or less than 4 values were received.");
  } else {
    var value = byteArrayToInt(data);
    document.getElementById('recordedInteger').innerHTML = value;
    console.log(`Received integer: ${value}`);
  }
}

// Process the data when the data type is string
let processString = function (data) {
  console.log(data);
  console.log(data.length);
  var string = byteArrayToString(data);
  document.getElementById('recordedString').innerHTML = string.join('');
  console.log(`Received string: ${string}`);
}

//main block for doing the audio recording
if (navigator.mediaDevices.getUserMedia) {
  const constraints = { audio: true };

  let onSuccess = function (stream) {
    const mediaRecorder = new MediaRecorder(stream);
    visualize(stream);
  }

  let onError = function (err) {
    console.log('The following error occured: ' + err);
  }

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

} else {
  console.log('getUserMedia not supported on your browser!');
}

function visualize(stream) {
  audioCtx.resume();

  const source = audioCtx.createMediaStreamSource(stream);

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 8192;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);

  draw();

  //Analyze data here
  function process_data(data) {
    let maxval = [].reduce.call(data, (m, c, i, arr) => c > arr[m] ? i : m) // argmax
    return maxval;
  }

  function draw() {
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    //Run draw() about 60 times/second -> we put it here so it gets
    // called again the next time
    requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);   //Get FFT
    // analyser.getByteTimeDomainData(dataArray);    //Get waveform

    //Abusing the draw function to easily get the data array
    let sampleRate = audioCtx.sampleRate;
    let maxFrequency = sampleRate / 2;
    // This converts the frequency data from their representation into Hz.
    let loudestFrequency = Math.round(maxFrequency / bufferLength * process_data(dataArray));

    document.getElementById('loudestFrequency').innerHTML = loudestFrequency;
    document.getElementById('sampleRate').innerHTML = sampleRate;
    document.getElementById('maxFrequency').innerHTML = maxFrequency;

    // This is probably the worst way to do this.
    // We check that it is greater than 950 in order
    // to get rid of some noise.
    if (recording && loudestFrequency > byteToFrequency(-2)) {
      recordedValues.push(loudestFrequency);
    }

    //Clear the canvas
    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    //Set up visualization line
    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    //Everything from here down is drawing
    canvasCtx.beginPath();

    let sliceWidth = WIDTH * 1.0 / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      let v = dataArray[i] / 128.0;
      let y = v * HEIGHT / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();

  }
}

window.onresize = function () {
  const mainSection = document.querySelector('.main-controls');
  canvas.width = mainSection.offsetWidth;
}

window.onresize();
