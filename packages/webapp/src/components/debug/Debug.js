import React, { Component } from 'react';
import './Debug.css';
import { buildFrequencyArray, buildColorRequestArray, buildIntegerRequestArray, buildStringRequestArray, byteToFrequency } from '../common/audio-utils';
import AudioTransmitter from '../common/audio-transmitter';

export default class Debug extends Component {
  constructor(props) {
    super(props);

    this.state = {
      audioTransmitter: new AudioTransmitter(),
      lastRecordedColor: '#ffffff'
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

  updateAudioTransmitter = (audioTransmitter) => {
    this.setState({ audioTransmitter });
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
    const { audioTransmitter } = this.state;
    audioTransmitter.startPlaying();

    this.updateAudioTransmitter(audioTransmitter);
  }

  // Stop audio playback button function
  onStopAudio = () => {
    const { audioTransmitter } = this.state;
    audioTransmitter.stopPlaying();

    this.updateAudioTransmitter(audioTransmitter);
  }

  // Start recording button function
  onStartRecord = () => {
    const { audioTransmitter } = this.state;
    audioTransmitter.startRecording();

    this.updateAudioTransmitter(audioTransmitter);
  }

  // Stop recording button function
  onStopRecord = () => {
    const { audioTransmitter } = this.state;
    audioTransmitter.stopRecording();

    this.updateAudioTransmitter(audioTransmitter);
  }

  visualize = (stream) => {
    const { audioTransmitter } = this.state;
    const audioCtx = audioTransmitter.audioCtx;

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
    const { audioTransmitter } = this.state;
    audioTransmitter.updateDataType(event.target.value);

    this.updateAudioTransmitter(audioTransmitter);
  }

  onPlaybackValueInputChanged = (event) => {
    const { audioTransmitter } = this.state;
    audioTransmitter.updatePlaybackValue(event.target.value);

    this.updateAudioTransmitter(audioTransmitter);
  }

  onPlaybackDurationInputChanged = (event) => {
    const { audioTransmitter } = this.state;
    audioTransmitter.updatePlaybackDuration(event.target.value);

    this.updateAudioTransmitter(audioTransmitter);
  }

  render = () => {
    const { audioTransmitter, lastRecordedColor } = this.state;

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
              <div id="recordedColor" style={{ backgroundColor: lastRecordedColor }}></div>
            </td>
            <td id='recordedInteger'></td>
            <td id='recordedString'></td>
          </tr>
        </table>

        <button type="button" onClick={this.onStartRecord} disabled={audioTransmitter.isRecording}>Start Recording</button>

        <button type="button" onClick={this.onStopRecord} disabled={!audioTransmitter.isRecording}>Stop Recording</button>

        <br></br>

        <form id="frequencyForm">
          <label><b>Data type </b>(ensure that this is the same both on the receiver, as well as the sender)</label>
          <select id="dataType" value={audioTransmitter.dataType} onChange={this.onDataTypeSelectChanged}>
            <option value="color">Color</option>
            <option value="integer">Integer</option>
            <option value="string">String</option>
          </select><br></br>
          <label>Value to transmit</label>
          <input type="text" id="playbackValue" size="50" value={audioTransmitter.playbackValue} onChange={this.onPlaybackValueInputChanged}></input><br></br>
          <label>Tone byte values (separated by ',')</label>
          <input type="text" id="playbackBytes" size="50" disabled="disabled" value={audioTransmitter.playbackBytes}></input><br></br>
          <label>Tone frequencies</label>
          <input type="text" id="playbackFrequencies" size="50" disabled="disabled" value={audioTransmitter.playbackFrequencies}></input><br></br>
          <label>Tone duration (in seconds)</label>
          <input type="text" id="playbackDuration" size="50" value={audioTransmitter.playbackDuration} onChange={this.onPlaybackDurationInputChanged}></input><br></br>
          <label><b>Don't forget to hit Submit!</b></label><br></br>
        </form>

        <button type="button" onClick={this.onGenerateColorRequest}>Generate Color Request</button>
        <button type="button" onClick={this.onGenerateIntegerRequest}>Generate Integer Request</button>
        <button type="button" onClick={this.onGenerateStringRequest}>Generate String Request</button><br></br>

        <button type="button" onClick={this.onStartAudio} disabled={audioTransmitter.isPlayingBack}>Start Audio Playback</button>

        <button type="button" onClick={this.onStopAudio} disabled={!audioTransmitter.isPlayingBack}>Stop Audio Playback</button>

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