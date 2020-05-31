import React, { useEffect, useState } from 'react';
import './Debug.css';
import { buildFrequencyArray, intToByteArray, stringToByteArray, areSameFrequency, isMarkTone, frequencyToByte, byteArrayToInt, byteArrayToString, byteToFrequency, createOscillator } from './utils';

function Debug() {
  // State items
  const [dataType, setDataType] = useState('color');
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [playbackValue, setPlaybackValue] = useState('1,0,1');
  const [playbackBytes, setPlaybackBytes] = useState([1, 0, 1]);
  const [playbackFrequencies, setPlaybackFrequencies] = useState(buildFrequencyArray(playbackBytes)); // Hz
  const [playbackDuration, setPlaybackDuration] = useState(0.5); // seconds
  const [recording, setRecording] = useState(false);
  const [recordedValues, setRecorededValues] = useState([]);
  const [timeOfRecording, setTimeOfRecording] = useState(0);

  let canvas = null;
  let canvasCtx = null;
  let canvasRequestAnimationFrameId = null;
  let mediaRecorder = null;

  // TODO maybe not as clean as I thought
  const [audioCtx, oscillator] = createOscillator(playbackFrequencies[0], () => {
    console.log('stopped playing');
    setIsPlayingBack(false);
  });

  useEffect(() => {
    window.onresize = () => {
      canvas.width = window.innerWidth;
    }
  });

  // Cleanup
  useEffect(() => () => {
    console.log('cleaning up');

    // Clear animation frame requests
    if (canvasRequestAnimationFrameId) {
      cancelAnimationFrame(canvasRequestAnimationFrameId);
    }

    // Clear audio recording
    if (mediaRecorder) {
      mediaRecorder.getTracks().forEach(function(track) {
        track.stop();
      });
    }
  }, []);

  // Form submit function
  const onFormPlaybackSubmit = (event) => {
    console.log(`Data type set to ${dataType}`);

    // Don't refresh the page please
    event.preventDefault();

    let futurePlaybackBytes = null;

    switch (dataType) {
      case 'color':
        futurePlaybackBytes = playbackValue.split(',').map(s => parseInt(s));
        break;
      case 'integer':
        futurePlaybackBytes = intToByteArray([parseInt(playbackValue)][0]);
        break;
      case 'string':
        futurePlaybackBytes = stringToByteArray(playbackValue);
        console.warn("Not yet implemented.")
    }
    
    setPlaybackBytes(futurePlaybackBytes);
    setPlaybackFrequencies(buildFrequencyArray(futurePlaybackBytes));

    for (var i = 0; i < playbackFrequencies.length; i++) {
      console.log("Audio playback frequency set to: " + playbackFrequencies[i]);
    }
    
    setPlaybackDuration(parseFloat(playbackDuration));
    console.log("Audio playback duration for each tone set to: " + playbackDuration + " seconds");
    
    console.log("Audio ready.");
  }

  // Start audio playback button function
  let onStartAudio = function () {
    audioCtx.resume();
    const currentTime = audioCtx.currentTime;
    let endTime = null;

    playbackFrequencies.forEach((item, index) => {
      oscillator.frequency.setValueAtTime(item, currentTime + (index * playbackDuration));

      if (index === playbackFrequencies.length - 1) {
        endTime = currentTime + (playbackFrequencies.length * playbackDuration);
      }
    });

    oscillator.connect(audioCtx.destination);

    oscillator.start(currentTime);
    oscillator.stop(endTime);

    setIsPlayingBack(true);
  }

  // Stop audio playback button function
  let onStopAudio = () => {
    audioCtx.resume();
    oscillator.stop();
  }

  // Start recording button function
  let onStartRecord = () => {
    setTimeOfRecording(audioCtx.currentTime);
    setRecorededValues([]);
    setRecording(true);
  }

  // Stop recording button function
  let onStopRecord = () => {
    setRecording(false);
    
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

    processData(recordingMap, this.dataType);
  }

  // Function that receives the recording and generates the frequencies it finds and
  // how long they were recorded for.
  let processRecording = function (recValues, realSampleRate) {
    var recordingMap = new Map();
    var counter = 1;
    var index = 0;

    if (recValues.length < 1) {
      return recordingMap;
    }

    for (var i = 1; i < recValues.length; i++) {
      if ((i + 1 === recValues.length) || 
          (!areSameFrequency(recValues[i], recValues[i + 1]))) {
        recordingMap.set(index, [recValues[i], counter / realSampleRate]);
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
  let processData = function (recordingMap, dt) {
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

    switch (dt) {
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

  // main block for doing the audio recording
  const startAudioRecording = () => {
    if (navigator.mediaDevices.getUserMedia) {
      const constraints = { audio: true };
  
      let onSuccess = function (stream) {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder = stream;
        visualize(stream);
      }
  
      let onError = function (err) {
        console.log('The following error occured: ' + err);
      }
  
      navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
  
    } else {
      console.log('getUserMedia not supported on your browser!');
    }
  }

  const visualize = (stream) => {
    audioCtx.resume();

    const source = audioCtx.createMediaStreamSource(stream);

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 8192;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    //Analyze data here
    const process_data = (data) => {
      let maxval = [].reduce.call(data, (m, c, i, arr) => c > arr[m] ? i : m) // argmax
      return maxval;
    }

    const draw = () => {
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;

      //Run draw() about 60 times/second -> we put it here so it gets
      // called again the next time
      canvasRequestAnimationFrameId = requestAnimationFrame(draw);
    
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

    draw();
  }

  // Inputs reactions
  const setCanvas = (ref) => {
    // No need to use on every state update
    if (canvas) {
      return;
    }

    canvas = ref;
    canvasCtx = canvas.getContext("2d");
    canvas.width = window.innerWidth;

    startAudioRecording();
  }

  const onDataTypeSelectChanged = (event) => {
    setDataType(event.target.value);
  }

  const onPlaybackValueInputChanged = (event) => {
    setPlaybackValue(event.target.value);
  }

  const onPlaybackDurationInputChanged = (event) => {
    setPlaybackDuration(event.target.value);
  }

  return (
    <div className="Debug">
      <header>
        <h1>Web audio demo</h1>
      </header>

      <section class="main-controls">
        <canvas class="visualizer" height="60px" ref={setCanvas}></canvas>
      </section>

			<div id="log-container">
				<pre id="log"></pre>
      </div>

      <table style={{ width: '100%' }}>
        <tr>
          <th>Recorded Color</th>
          <th>Recorded Integer</th>
          <th>Recorded String</th>
        </tr>
        <tr>
          <td>
            <div id="recordedColor"></div>
          </td>
          <td id='recordedInteger'></td>
          <td id='recordedString'></td>
        </tr>
      </table>
      
      <button type="button" onClick={onStartRecord}>Start Recording</button>

      <button type="button" onClick={onStopRecord}>Stop Recording</button>

      <br></br>

      <form id="frequencyForm">
        <label><b>Data type </b>(ensure that this is the same both on the receiver, as well as the sender)</label>
        <select id="dataType" value={dataType} onChange={onDataTypeSelectChanged}>
          <option value="color">Color</option>
          <option value="integer">Integer</option>
          <option value="string">String</option>
        </select><br></br>
        <label>Value to transmit</label>
        <input type="text" id="playbackValue" size="50" value={playbackValue} onChange={onPlaybackValueInputChanged}></input><br></br>
        <label>Tone byte values (separated by ',')</label>
        <input type="text" id="playbackBytes" size="50" disabled="disabled" value={playbackBytes}></input><br></br>
        <label>Tone frequencies</label>
        <input type="text" id="playbackFrequencies" size="50" disabled="disabled" value={playbackFrequencies}></input><br></br>
        <label>Tone duration (in seconds)</label>
        <input type="text" id="playbackDuration" size="50" value={playbackDuration} onChange={onPlaybackDurationInputChanged}></input><br></br>
        <label><b>Don't forget to hit Submit!</b></label><br></br>
        <input type="submit" onClick={onFormPlaybackSubmit}></input>
      </form>

      <button type="button" onClick={onStartAudio}>Start Audio Playback</button>

      <button type="button" onClick={onStopAudio} disabled={!isPlayingBack}>Stop Audio Playback</button>

      <table style={{width: '100%' }}>
        <tr>
          <th>Property</th>
          <th>Value</th>
        </tr>
        <tr>
          <td>Loudest frequency recorded</td>
          <td id='loudestFrequency'>0</td>
        </tr>
        <tr>
          <td>Sample rate</td>
          <td id='sampleRate'>0</td>
        </tr>
        <tr>
          <td>Maximum possible frequency</td>
          <td id='maxFrequency'>0</td>
        </tr>
      </table>

    </div>
  );
}

export default Debug;
