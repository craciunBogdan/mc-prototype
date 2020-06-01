import { buildFrequencyArray, checkRequestType, colorToByteArray, intToByteArray, stringToByteArray, areSameFrequency, isRequestMarkTone, isResponseMarkTone, frequencyToByte, byteArrayToColor, byteArrayToInt, byteArrayToString, createOscillator } from './audio-utils';

export default class AudioTransmitter {
    constructor() {
        this.audioCtx = new AudioContext();
        this.dataType = 'color';
        this.isPlayingBack = false;
        this.isRecording = false;
        this.oscillator = null;
        this.playbackValue = '255, 0, 255';
        this.playbackBytes = colorToByteArray([255, 0, 255]);
        this.playbackFrequencies = buildFrequencyArray(this.playbackBytes, 'response'); // Hz
        this.playbackDuration = 0.5; // seconds
        this.recordedValues = [];
        this.timeOfRecording = 0;
    }

    startRecording = () => {
        if (this.isRecording) {
            return;
        }

        this.recordedValues = [];
        this.isRecording = true;
        this.timeOfRecording = this.audioCtx.currentTime;

        console.log('Started recording');
    }

    stopRecording = () => {
        if (!this.isRecording) {
            return;
        }

        this.isRecording = false;

        const realSampleRate = this.recordedValues.length / (this.audioCtx.currentTime - this.timeOfRecording);
        const recordingMap = this.processRecording(this.recordedValues, realSampleRate);

        return this.processData(recordingMap, this.dataType);
    }

    startPlaying = () => {
        this.isPlayingBack = true;

        this.oscillator = createOscillator(this.audioCtx, this.playbackFrequencies[0], () => {
            console.log('stopped playing');

            this.isPlayingBack = false;
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
    }

    stopPlaying = () => {
        this.isPlayingBack = false;
        this.oscillator.stop(0);
    }

    refreshValues = () => {
        switch (this.dataType) {
            case 'color':
                this.playbackBytes = colorToByteArray(this.playbackValue.split(',').map(s => parseInt(s)));
                break;
            case 'integer':
                this.playbackBytes = intToByteArray([parseInt(this.playbackValue)][0]);
                break;
            case 'string':
                this.playbackBytes = stringToByteArray(this.playbackValue);
                break;
            default:
                console.error("Undefined data type provide: " + this.dataType);
        }

        this.playbackDuration = parseFloat(this.playbackDuration);
        this.playbackFrequencies = buildFrequencyArray(this.playbackBytes, 'response');

        // TODO log debug??
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
                        return this.processColor(data);
                    case 'integer':
                        return this.processInteger(data);
                    case 'string':
                        return this.processString(data);
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
            console.log(`Received color:\nR:${value[0]}\nG:${value[1]}\nB:${value[2]}`);
            return value;
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
            console.log(`Received integer: ${value}`);
            return value;
        }
    }

    // Process the data when the data type is string
    processString = (data) => {
        console.log(data);
        console.log(data.length);
        var string = byteArrayToString(data);
        console.log(`Received string: ${string}`);
        return string;
    }
}