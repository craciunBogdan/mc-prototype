export const MIN_FREQUENCY = 2000;
export const MAX_FREQUENCY = 20000;
export const TONES_NUMBER = 257;
export const MARK_BYTE = 256;
export const FREQUENCY_RANGE = Math.floor((MAX_FREQUENCY - MIN_FREQUENCY) / TONES_NUMBER);
export const SEPARATOR_BYTE = -1;

export const areSameFrequency = (freq1, freq2) => {
    return (Math.floor((freq1 - MIN_FREQUENCY) / FREQUENCY_RANGE) === Math.floor((freq2 - MIN_FREQUENCY) / FREQUENCY_RANGE));
};

export const frequencyToByte = (freq) => {
    return (Math.floor((freq - MIN_FREQUENCY) / FREQUENCY_RANGE));
};

export const isMarkTone = (freq, duration) => {
    return (frequencyToByte(freq) === MARK_BYTE) && (duration >= 0.1);
};

// We add FREQUENCY_RANGE / 2 instead of 
// FREQUENCY_RANGE because in this way,
// the frequency we produce is at the middle of the
// range of frequencies that match to the given byte
// instead of the lower end of the range.
export const byteToFrequency = (value) => {
    return (value * FREQUENCY_RANGE + (MIN_FREQUENCY + Math.floor(FREQUENCY_RANGE / 2)));
};

export const buildFrequencyArray = (byteArray) => {
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
};

export const intToByteArray = (value) => {
    var byteArray = [0, 0, 0, 0];

    for (var i = 0; i < byteArray.length; i++) {
        var byte = value & 0xff;
        byteArray[i] = byte;
        value = (value - byte) / 256;
    }

    return byteArray;
};

export const byteArrayToInt = (byteArray) => {
    var value = 0;

    for (var i = byteArray.length - 1; i >= 0; i--) {
        value = (value * 256) + byteArray[i];
    }

    return value;
};

export const stringToByteArray = (string) => {
    console.log(string);
    return string.split('').map(x => x.charCodeAt());
};

export const byteArrayToString = (byteArray) => {
    return byteArray.map(x => String.fromCharCode(x));
};

export const createOscillator = (firstValue, onEnded) => {
    const audioCtx = new AudioContext();

    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(firstValue, audioCtx.currentTime);
    
    oscillator.onended = onEnded;

    return [audioCtx, oscillator];
};