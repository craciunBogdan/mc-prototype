// set up basic variables for app
const canvas = document.querySelector('.visualizer');
const canvasCtx = canvas.getContext("2d");
let audioCtx = new AudioContext();
audioCtx.resume();

// oscillator does the audio playback
const oscillator = audioCtx.createOscillator();
let playbackFrequencies = [1000, 1200, 1400]; // Hz
let playbackDuration = 0.2; // seconds
document.getElementById('playbackFrequencies').value = playbackFrequencies;
document.getElementById('playbackDuration').value = playbackDuration;
oscillator.type = 'square';
oscillator.frequency.setValueAtTime(playbackFrequencies[0], audioCtx.currentTime);
oscillator.start();

let onFormSubmit = function () {
  playbackFrequencies = document.getElementById('playbackFrequencies').value.split(',').map(s => parseInt(s));
  playbackDuration = parseFloat(document.getElementById('playbackDuration').value);
  for (var i = 0; i < playbackFrequencies.length; i++) {
    console.log("Audio playback frequency set to: " + playbackFrequencies[i]);
  }
  console.log("Audio playback duration for each tone set to: " + playbackDuration + " seconds");
  console.log("Audio ready.");
}

let onStartAudio = function () {
  currentTime = audioCtx.currentTime;
  for (var i = 0; i < playbackFrequencies.length; i++) {
    oscillator.frequency.setValueAtTime(playbackFrequencies[i], currentTime + (i * playbackDuration));
  }
  oscillator.connect(audioCtx.destination);
}

let onStopAudio = function () {
  oscillator.disconnect(audioCtx.destination);
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
    let loudestFrequency = Math.round(maxFrequency / bufferLength) * process_data(dataArray);
  
    document.getElementById('loudestFrequency').innerHTML = loudestFrequency;
    document.getElementById('sampleRate').innerHTML = sampleRate;
    document.getElementById('maxFrequency').innerHTML = maxFrequency;

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
