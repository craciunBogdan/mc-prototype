import { byteToFrequency, buildFrequencyArray, checkRequestType, colorToByteArray, intToByteArray, stringToByteArray, areSameFrequency, isRequestMarkTone, isResponseMarkTone, frequencyToByte, byteArrayToColor, byteArrayToInt, byteArrayToString, createOscillator, hexToRGBArray, buildIntegerRequestArray, buildStringRequestArray, buildColorRequestArray } from './audio-utils';

export default class AudioTransmitter {
    constructor(selfStateUpdater) {
        this.audioCtx = new AudioContext();
        this.dataType = 'color';
        this.isPlayingBack = false;
        this.isRecording = false;
        this.oscillator = null;
        this.recordedValues = [];
        this.sendType = 'response';
        this.timeOfRecording = 0;

        this.playbackValue = '255, 0, 255';
        this.playbackBytes = colorToByteArray([255, 0, 255]);
        this.playbackFrequencies = this.__buildFrequencyArray() // Hz
        this.playbackDuration = 0.5; // seconds

        this.analyser = null;
        this.rawRecordedDataArray = [];
        this.interval = null;
        
        this.selfStateUpdater = selfStateUpdater ? selfStateUpdater : () => {};
    }

    /**
     * Destroys any live input or output from the audio transmitter.
     */
    destroy = () => {
        this.stopAudioInputSource();
        this.stopPlaying();
    }

    selfUpdate = () => {
        this.selfStateUpdater(this);
    }

    // ===== RECORDING METHODS
    /**
     * Request permissions and aquire live input from the microphone.
     */
    requestAudioInputSource = (onComplete) => {
        if (navigator.mediaDevices.getUserMedia) {
            const constraints = { audio: true };

            let onSuccess = (stream) => {
                this.stream = stream;

                // Do the rest of preparation to record
                this.prepareAudioInputSource();

                this.selfUpdate();

                if (onComplete) {
                    onComplete();
                }
            }

            let onError = (err) => {
                console.log('The following error occured: ' + err);
            }

            navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
        } else {
            console.log('getUserMedia not supported on your browser!');
        }
    }

    stopAudioInputSource = () => {
        // Clear input stream
        if (this.stream) {
            this.stream.getTracks().forEach((track) => {
                track.stop();
            });
        }

        this.stream = null;

        this.selfUpdate();
    }

    /**
     * Do the initialization to support live audio recording.
     */
    prepareAudioInputSource = () => {
        this.audioCtx.resume();

        const source = this.audioCtx.createMediaStreamSource(this.stream);

        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 8192;
        this.bufferLength = this.analyser.frequencyBinCount;

        // Data array used for recording
        this.rawRecordedDataArray = new Uint8Array(this.bufferLength);

        source.connect(this.analyser);

        this.recordedValues = [];
        this.isRecording = true;
        this.timeOfRecording = this.audioCtx.currentTime;

        this.recorderLoop();

        this.selfUpdate();
        console.log('Started recording');
    }

    recorderLoop = () => {
        this.interval = setInterval(() => {
            if (!this.isRecording) {
                clearInterval(this.interval);
                return;
            }

            // Get FFT
            this.analyser.getByteFrequencyData(this.rawRecordedDataArray);

            //Abusing the draw function to easily get the data array
            let sampleRate = this.audioCtx.sampleRate;
            let maxFrequency = sampleRate / 2;

            //Analyze data here
            const getMaxVal = (data) => {
                let maxval = [].reduce.call(data, (m, c, i, arr) => c > arr[m] ? i : m) // argmax
                return maxval;
            }

            // This converts the frequency data from their representation into Hz.
            let loudestFrequency = Math.round(maxFrequency / this.bufferLength * getMaxVal(this.rawRecordedDataArray));

            // This is probably the worst way to do this.
            // We check that it is greater than 950 in order
            // to get rid of some noise.
            if (loudestFrequency >= byteToFrequency(-2)) {
                this.recordedValues.push(loudestFrequency);
            }

            // Rerun the loop
            this.recorderLoop();

            this.selfUpdate();
        }, 16);
    }

    startRecording = (onComplete) => {
        if (this.isRecording) {
            return;
        }

        // Get microphone input
        this.requestAudioInputSource(onComplete);
    }

    stopRecording = () => {
        if (!this.isRecording) {
            return;
        }

        this.isRecording = false;

        // Clear interval
        clearInterval(this.interval);

        // Stop audio input source
        this.stopAudioInputSource();

        // Remove unused variables
        this.analyser = null;
        this.rawRecordedDataArray = [];

        const realSampleRate = this.recordedValues.length / (this.audioCtx.currentTime - this.timeOfRecording);
        const recordingMap = this.__processRecording(this.recordedValues, realSampleRate);

        this.selfUpdate();

        // Do the data processing
        return this.__processData(recordingMap, this.dataType);
    }
    // ===== END OF RECORDING METHODS

    // ===== PLAYING METHODS 
    startPlaying = (onStoppedPlaying) => {
        this.isPlayingBack = true;

        this.oscillator = createOscillator(this.audioCtx, this.playbackFrequencies[0], () => {
            console.log('stopped playing');

            this.isPlayingBack = false;

            this.selfUpdate();

            if (onStoppedPlaying) {
                onStoppedPlaying(this);
            }
        });

        this.audioCtx.resume();
        const currentTime = this.audioCtx.currentTime;
        const endTime = currentTime + (this.playbackFrequencies.length * this.playbackDuration);

        this.playbackFrequencies.forEach((item, index) => {
            this.oscillator.frequency.setValueAtTime(item, currentTime + (index * this.playbackDuration));
        });

        this.oscillator.connect(this.audioCtx.destination);
        this.oscillator.start(currentTime)
        this.oscillator.stop(endTime);

        this.selfUpdate();
    }

    stopPlaying = () => {
        this.isPlayingBack = false;
        this.oscillator.stop(0);

        this.selfUpdate();
    }
    // ===== END OF PLAYING METHODS 

    refreshValues = () => {
        switch (this.dataType) {
            case 'color':
                // If the playbackValue is a hex value, convert it to a string input array
                if (this.playbackValue[0] === '#') {
                    const rgb = hexToRGBArray(this.playbackValue);
                    this.playbackValue = rgb.join(',')
                }

                if (this.sendType === 'request') {
                    this.playbackBytes = buildColorRequestArray();
                } else {
                    this.playbackBytes = colorToByteArray(this.playbackValue.split(',').map(s => parseInt(s)));
                }
                break;
            case 'integer':
                if (this.sendType === 'request') {
                    this.playbackBytes = buildIntegerRequestArray();
                } else {
                    this.playbackBytes = intToByteArray([parseInt(this.playbackValue)][0])
                }
                break;
            case 'string':
                if (this.sendType === 'request') {
                    this.playbackBytes = buildStringRequestArray();
                } else {
                    this.playbackBytes = stringToByteArray(this.playbackValue);
                }
                break;
            default:
                console.error("Undefined data type provide: " + this.dataType);
        }

        this.playbackDuration = parseFloat(this.playbackDuration);
        this.playbackFrequencies = this.__buildFrequencyArray();

        this.selfUpdate();
        // TODO log debug??
    }

    updateSendType = (newSendType) => {
        this.sendType = newSendType;
        this.refreshValues();
    }

    updateDataType = (newDataType) => {
        this.dataType = newDataType;
        this.refreshValues();
    }

    updatePlaybackValue = (newPlaybackValue) => {
        this.playbackValue = newPlaybackValue;
        this.refreshValues();
    }

    updatePlaybackDuration = (newPlaybackDuration) => {
        this.playbackDuration = newPlaybackDuration;
        this.refreshValues();
    }

    // ===== PRIVATE METHODS (that can be still accessed from the outside but eh)
    // Function that receives the recording and generates the frequencies it finds and
    // how long they were recorded for.
    __buildFrequencyArray = () => {
        return buildFrequencyArray(this.playbackBytes, this.sendType);
    }

    __processRecording = (recValues, realSampleRate) => {
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
    __processData = (recordingMap, dt) => {
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
                    this.dataType = requestType;
                }
                break;
            case 'response':
                switch (dt) {
                    case 'color':
                        return this.__processColor(data);
                    case 'integer':
                        return this.__processInteger(data);
                    case 'string':
                        return this.__processString(data);
                    default:
                        console.error("Undefined data type in response: " + dt);
                }
                break;
            default:
                console.warn("Undefined message type: " + messageType);
        }
    }

    // Process the data when the data type is color
    __processColor = (data) => {
        console.log(data);
        if (data.length !== 6) {
            console.log("Unexpected number of values were received: " + data.length + "\nExpected 6");
        } else {
            var value = byteArrayToColor(data);
            console.log(value);
            console.log(`Received color:\nR:${value[0]}\nG:${value[1]}\nB:${value[2]}`);
            return value;
        }
    }

    // Process the data when the data type is integer
    __processInteger = (data) => {
        console.log(data);
        console.log(data.length);
        if (data.length !== 8) {
            console.log("Unexpected number of values were received: " + data.length + "\nExpected 8.");
        } else {
            var value = byteArrayToInt(data);
            console.log(`Received integer: ${value}`);
            return value;
        }
    }

    // Process the data when the data type is string
    __processString = (data) => {
        console.log(data);
        console.log(data.length);
        var string = byteArrayToString(data);
        console.log(`Received string: ${string}`);
        return string;
    }
}