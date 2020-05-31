import React, { Component } from 'react';
import './Debug.css';
import { buildFrequencyArray, checkRequestType, buildColorRequestArray, buildIntegerRequestArray, buildStringRequestArray, colorToByteArray, intToByteArray, stringToByteArray, areSameFrequency, isRequestMarkTone, isResponseMarkTone, frequencyToByte, byteArrayToColor, byteArrayToInt, byteArrayToString, byteToFrequency, createOscillator } from './utils';

export default class Debug extends Component {
  constructor(props) {
    super(props);

    const playbackBytes = colorToByteArray([255, 0, 255]);
    this.state = {
      audioCtx: new AudioContext(),
      dataType: 'color',
      isPlayingBack: false,
      oscillator: null,
      playbackValue: '255, 0, 255',
      playbackBytes,
      playbackFrequencies: buildFrequencyArray(playbackBytes, 'response'), // Hz
      playbackDuration: 0.5, // seconds
      recording: false,
      recordedValues: [],
      timeOfRecording: 0,
    }

    this.canvas = null;
    this.canvasCtx = null;
    this.canvasRequestAnimationFrameId = null;
    this.mediaRecorder = null;

    window.onresize = () => {
      if (this.canvas) {
        this.canvas.width = window.innerWidth;
      } 
    }
  }

  componentWillUnmount = () => {
    console.log('cleaning up');

    // Clear animation frame requests
    if (this.canvasRequestAnimationFrameId) {
      cancelAnimationFrame(this.canvasRequestAnimationFrameId);
    }

    // Clear audio recording
    if (this.mediaRecorder) {
      this.mediaRecorder.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }

  // Form submit function
  onFormPlaybackSubmit = (event) => {
    const { dataType, playbackDuration, playbackValue } = this.state;

    console.log(`Data type set to ${dataType}`);

    // Don't refresh the page please
    event.preventDefault();

    let futurePlaybackBytes = null;

    switch (dataType) {
      case 'color':
        futurePlaybackBytes = colorToByteArray(playbackValue.split(',').map(s => parseInt(s)));
        break;
      case 'integer':
        futurePlaybackBytes = intToByteArray([parseInt(playbackValue)][0]);
        break;
      case 'string':
        futurePlaybackBytes = stringToByteArray(playbackValue);
        break;
      default:
        console.error("Undefined data type provide: " + dataType);
    }

    this.setState({
      playbackBytes: futurePlaybackBytes,
      playbackDuration: parseFloat(playbackDuration),
      playbackFrequencies: buildFrequencyArray(futurePlaybackBytes, 'response')
    }, () => {
      const { playbackDuration, playbackFrequencies } = this.state; // Shadowing :(
      for (let i = 0; i < playbackFrequencies.length; i++) {
        console.log("Audio playback frequency set to: " + playbackFrequencies[i]);
      }

      console.log("Audio playback duration for each tone set to: " + playbackDuration + " seconds");

      console.log("Audio ready.");
    });
  }

  onGenerateColorRequest = () => {
    const playbackBytes = buildColorRequestArray();

    this.setState({
      playbackBytes,
      playbackFrequencies: buildFrequencyArray(playbackBytes, 'request'),
      dataType: 'color'
    });
  }

  onGenerateIntegerRequest = () => {
    const playbackBytes = buildIntegerRequestArray();

    this.setState({
      playbackBytes,
      playbackFrequencies: buildFrequencyArray(playbackBytes, 'request'),
      dataType: 'integer'
    });
  }

  onGenerateStringRequest = () => {
    const playbackBytes = buildStringRequestArray();

    this.setState({
      playbackBytes,
      playbackFrequencies: buildFrequencyArray(playbackBytes, 'request'),
      dataType: 'string'
    });
  }

  // Start audio playback button function
  onStartAudio = () => {
    const { audioCtx, playbackFrequencies, playbackDuration } = this.state;

    const oscillator = createOscillator(audioCtx, playbackFrequencies[0], () => {
      console.log('stopped playing');
      this.setState({
        isPlayingBack: false
      });
    });

    this.setState({
      oscillator,
      isPlayingBack: true
    }, () => {
      const { oscillator } = this.state;  // Shadowing :(

      audioCtx.resume();
      const currentTime = audioCtx.currentTime;
      const endTime = currentTime + (playbackFrequencies.length * playbackDuration);

      playbackFrequencies.forEach((item, index) => {
        oscillator.frequency.setValueAtTime(item, currentTime + (index * playbackDuration));
      });

      oscillator.connect(audioCtx.destination);
      oscillator.start(currentTime)
      oscillator.stop(endTime);

      console.log('state changed, started playing audio');

      console.log(oscillator);
    })
  }

  // Stop audio playback button function
  onStopAudio = () => {
    const { oscillator } = this.state;

    oscillator.stop(0);

    this.setState({
      isPlayingBack: false
    });
  }

  // Start recording button function
  onStartRecord = () => {
    const { audioCtx } = this.state;
    this.setState({
      recordedValues: [],
      recording: true,
      timeOfRecording: audioCtx.currentTime
    }, () => { console.log('started recording')});
  }

  // Stop recording button function
  onStopRecord = () => {
    const { audioCtx, dataType, recordedValues, timeOfRecording } = this.state;

    console.log(audioCtx.currentTime - timeOfRecording);
    console.log(recordedValues.length + " values recorded:\n" + recordedValues);

    var realSampleRate = recordedValues.length / (audioCtx.currentTime - timeOfRecording);
    var recordingMap = this.processRecording(recordedValues, realSampleRate);
    console.log("The following records represent the frequencies and the duration they were recorded for:");
    console.log("{");
    for (let [index, data] of recordingMap) {
      console.log(`${index}: ${data}`);
    }
    console.log("}");

    this.processData(recordingMap, dataType);

    this.setState({
      recording: false
    });
  }

  // Function that receives the recording and generates the frequencies it finds and
  // how long they were recorded for.
  processRecording = (recValues, realSampleRate) => {
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
  processData = (recordingMap, dt) => {
    var valid = false;
    var messageType = null;
    var data = [];

    for (let [, [freq, duration]] of recordingMap) {
      if (isRequestMarkTone(freq, duration)) {
        valid = !valid;
        messageType = 'request';
      } else if (isResponseMarkTone(freq, duration)) {
        valid = !valid;
        messageType = 'response';
      } else if (valid) {
        // Check if the current tone is a separator tone
        var byteValue = frequencyToByte(freq);
        if ((byteValue !== -1) && (duration >= 0.3)) {
          data.push(frequencyToByte(freq));
        }
      }
    }

    switch (messageType) {
      case 'request':
        var requestType = checkRequestType(data);
        if (requestType === 'undefined') {
          console.log("The received request did not comply with protocol. Check error to see what the problem was.");
        } else {
          console.log("Received request for " + requestType + " data.");
          this.setState({
            dataType: requestType
          });
        }
        break;
      case 'response':
        switch (dt) {
          case 'color':
            this.processColor(data);
            break;
          case 'integer':
            this.processInteger(data);
            break;
          case 'string':
            this.processString(data);
            break;
          default:
            console.error("Undefined data type in response: " + dt);
        }
        break;
      default:
        console.error("Undefined message type: " + messageType);
    }
  }

  // Process the data when the data type is color
  processColor = (data) => {
    console.log(data);
    if (data.length !== 6) {
      console.log("Unexpected number of values were received: " + data.length + "\nExpected 6");
    } else {
      var value = byteArrayToColor(data);
      console.log(value);
      document.getElementById('recordedColor').style.background = `rgb(${value[0]}, ${value[1]}, ${value[2]})`;
      console.log(`Received color:\nR:${value[0]}\nG:${value[1]}\nB:${value[2]}`);
    }
  }

  // Process the data when the data type is integer
  processInteger = (data) => {
    console.log(data);
    console.log(data.length);
    if (data.length !== 8) {
      console.log("Unexpected number of values were received: " + data.length + "\nExpected 8.");
    } else {
      var value = byteArrayToInt(data);
      document.getElementById('recordedInteger').innerHTML = value;
      console.log(`Received integer: ${value}`);
    }
  }

  // Process the data when the data type is string
  processString = (data) => {
    console.log(data);
    console.log(data.length);
    var string = byteArrayToString(data);
    document.getElementById('recordedString').innerHTML = string.join('');
    console.log(`Received string: ${string}`);
  }

  visualize = (stream) => {
    const { audioCtx } = this.state;

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
      const { recording, recordedValues } = this.state;

      const WIDTH = this.canvas.width;
      const HEIGHT = this.canvas.height;

      //Run draw() about 60 times/second -> we put it here so it gets
      // called again the next time
      this.canvasRequestAnimationFrameId = requestAnimationFrame(draw);

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
      if (recording && loudestFrequency >= byteToFrequency(-2)) {
        recordedValues.push(loudestFrequency);

        this.setState({
          recordedValues
        });
      }

      //Clear the canvas
      this.canvasCtx.fillStyle = 'rgb(200, 200, 200)';
      this.canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      //Set up visualization line
      this.canvasCtx.lineWidth = 1;
      this.canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

      //Everything from here down is drawing
      this.canvasCtx.beginPath();

      let sliceWidth = WIDTH * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        let v = dataArray[i] / 128.0;
        let y = v * HEIGHT / 2;

        if (i === 0) {
          this.canvasCtx.moveTo(x, y);
        } else {
          this.canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      this.canvasCtx.lineTo(this.canvas.width, this.canvas.height / 2);
      this.canvasCtx.stroke();
    }

    draw();
  }

  // main block for doing the audio recording
  startAudioRecording = () => {
    if (navigator.mediaDevices.getUserMedia) {
      const constraints = { audio: true };

      let onSuccess = (stream) => {
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder = stream;
        this.visualize(stream);
      }

      let onError = (err) => {
        console.log('The following error occured: ' + err);
      }

      navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

    } else {
      console.log('getUserMedia not supported on your browser!');
    }
  }

  // Inputs reactions
  setCanvas = (ref) => {
    // No need to use on every state update
    if (this.canvas) {
      return;
    }

    this.canvas = ref;
    this.canvasCtx = this.canvas.getContext("2d");
    this.canvas.width = window.innerWidth;

    this.startAudioRecording();
  }

  onDataTypeSelectChanged = (event) => {
    this.setState({
      dataType: event.target.value
    });
  }

  onPlaybackValueInputChanged = (event) => {
    this.setState({
      playbackValue: event.target.value
    });
  }

  onPlaybackDurationInputChanged = (event) => {
    this.setState({
      playbackDuration: event.target.value
    });
  }

  render = () => {
    const { dataType, isPlayingBack, playbackBytes, playbackDuration, playbackFrequencies, playbackValue, recording } = this.state;

    return (
      <div className="Debug">
        <header>
          <h1>Web audio demo</h1>
        </header>

        <section class="main-controls">
          <canvas class="visualizer" height="60px" ref={this.setCanvas}></canvas>
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

        <button type="button" onClick={this.onStartRecord} disabled={recording}>Start Recording</button>

        <button type="button" onClick={this.onStopRecord} disabled={!recording}>Stop Recording</button>

        <br></br>

        <form id="frequencyForm">
          <label><b>Data type </b>(ensure that this is the same both on the receiver, as well as the sender)</label>
          <select id="dataType" value={dataType} onChange={this.onDataTypeSelectChanged}>
            <option value="color">Color</option>
            <option value="integer">Integer</option>
            <option value="string">String</option>
          </select><br></br>
          <label>Value to transmit</label>
          <input type="text" id="playbackValue" size="50" value={playbackValue} onChange={this.onPlaybackValueInputChanged}></input><br></br>
          <label>Tone byte values (separated by ',')</label>
          <input type="text" id="playbackBytes" size="50" disabled="disabled" value={playbackBytes}></input><br></br>
          <label>Tone frequencies</label>
          <input type="text" id="playbackFrequencies" size="50" disabled="disabled" value={playbackFrequencies}></input><br></br>
          <label>Tone duration (in seconds)</label>
          <input type="text" id="playbackDuration" size="50" value={playbackDuration} onChange={this.onPlaybackDurationInputChanged}></input><br></br>
          <label><b>Don't forget to hit Submit!</b></label><br></br>
          <input type="submit" onClick={this.onFormPlaybackSubmit}></input>
        </form>

        <button type="button" onClick={this.onGenerateColorRequest}>Generate Color Request</button>
        <button type="button" onClick={this.onGenerateIntegerRequest}>Generate Integer Request</button>
        <button type="button" onClick={this.onGenerateStringRequest}>Generate String Request</button><br></br>

        <button type="button" onClick={this.onStartAudio} disabled={isPlayingBack}>Start Audio Playback</button>

        <button type="button" onClick={this.onStopAudio} disabled={!isPlayingBack}>Stop Audio Playback</button>

        <table style={{ width: '100%' }}>
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
}