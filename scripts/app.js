// set up basic variables for app
let recording = false;
let recordedDataType = 'color';
document.getElementById('recordedDataType').value = recordedDataType;
let timeOfRecording = 0;
let recordedValues = [];
const canvas = document.querySelector('.visualizer');
const canvasCtx = canvas.getContext("2d");
let audioCtx = new AudioContext();

// oscillator does the audio playback
const oscillator = audioCtx.createOscillator();
let playbackFrequencies = [1000, 2000, 2400, 22000, 1000]; // Hz
let playbackDuration = 0.5; // seconds
document.getElementById('playbackFrequencies').value = playbackFrequencies;
document.getElementById('playbackDuration').value = playbackDuration;
oscillator.type = 'square';
oscillator.frequency.setValueAtTime(playbackFrequencies[0], audioCtx.currentTime);
oscillator.start();

let onFormRecordSubmit = function () {
  let submittedDataType = document.getElementById('recordedDataType').value.toLowerCase();
  if (submittedDataType.localeCompare('color') == 0 || submittedDataType.localeCompare('colour') == 0) {
    recordedDataType = 'color';
    console.log("Data type set to \'color\'");
  } else {
    console.log("Data type not recognized");
  }
}

let onFormPlaybackSubmit = function () {
  playbackFrequencies = document.getElementById('playbackFrequencies').value.split(',').map(s => parseInt(s));
  playbackDuration = parseFloat(document.getElementById('playbackDuration').value);
  for (var i = 0; i < playbackFrequencies.length; i++) {
    console.log("Audio playback frequency set to: " + playbackFrequencies[i]);
  }
  console.log("Audio playback duration for each tone set to: " + playbackDuration + " seconds");
  console.log("Audio ready.");
}

let onStartAudio = function () {
  audioCtx.resume();
  currentTime = audioCtx.currentTime;
  for (var i = 0; i < playbackFrequencies.length; i++) {
    oscillator.frequency.setValueAtTime(playbackFrequencies[i], currentTime + (i * playbackDuration));
  }
  oscillator.connect(audioCtx.destination);
}

let onStopAudio = function () {
  audioCtx.resume();
  oscillator.disconnect(audioCtx.destination);
}

let onStartRecord = function () {
  timeOfRecording = audioCtx.currentTime;
  recordedValues = [];
  recording = true;
}

let onStopRecord = function () {
  recording = false;
  
  console.log(audioCtx.currentTime - timeOfRecording);
  console.log(recordedValues.length + " values recorded:\n" + recordedValues);
  
  var realSampleRate = recordedValues.length / (audioCtx.currentTime - timeOfRecording);
  var recordingMap = processRecording(recordedValues, realSampleRate);
  console.log("The following records represent the frequencies and the duration they were recorded for:");
  console.log("{");
  for (let [freq, duration] of recordingMap) {
    console.log(`${freq}: ${duration}`);
  }
  console.log("}")

  processData(recordingMap, recordedDataType);
}

// Function that receives the recording and generates the frequencies it finds and
// how long they were recorded for.
let processRecording = function (recordedValues, realSampleRate) {
  var recordingMap = new Map();
  var counter = 1;
  
  if (recordedValues.length < 1) {
    return recordingMap;
  }

  for (var i = 1; i < recordedValues.length; i++) {
    if (recordedValues[i] < recordedValues[i - 1] + 40 &&
      recordedValues[i] > recordedValues[i - 1] - 40) {
        counter++;
    } else {
      if (recordingMap.has(recordedValues[i - 1])) {
        recordingMap.set(recordedValues[i - 1] + 1, counter / realSampleRate);
        counter = 1;
      } else {
        recordingMap.set(recordedValues[i - 1], counter / realSampleRate);
        counter = 1;
      }
    }
  }
  if (recordingMap.has(recordedValues[recordedValues.length - 1])) {
    recordingMap.set(recordedValues[recordedValues.length - 1] + 1);
  } else {
    recordingMap.set(recordedValues[recordedValues.length - 1], counter / realSampleRate);
  }
  
  return recordingMap;
}

// Given the frequencies and the type of data, process the data and
// generate the appropriate response.
let processData = function (recordingMap, recordedDataType) {
  var valid = false;
  var data = [];

  for (let [freq, duration] of recordingMap) {
    if (((Math.round((freq - 1000) / 80)) === 0 ) && (duration >= 0.2) ) {
      valid = !valid;
    } else if (valid) {
      data.push(Math.round((freq - 1000) / 80));
    }
  }

  switch (recordedDataType) {
    case 'color':
      console.log(data);
      processColor(data);
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
    console.log("Invalid color data. More than 3 values were provided.");
  } else {
    document.body.style.backgroundColor = `rgb(${data[0]}, ${data[1]}, ${data[2]}`;
    console.log(`Received color:\nR:${data[0]}\nG:${data[1]}\nB:${data[2]}`);
  }
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
    if (recording) {
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
