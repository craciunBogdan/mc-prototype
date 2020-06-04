export const MIN_FREQUENCY = 2000;
export const MAX_FREQUENCY = 4960;
export const TONES_NUMBER = 17;
export const RESPONSE_MARK_BYTE = 16;
export const REQUEST_MARK_BYTE = -2;
export const SEPARATOR_BYTE = -1;
export const REQUEST_COLOR_BYTE = 0;
export const REQUEST_INT_BYTE = 7;
export const REQUEST_STR_BYTE = 15;
export const FREQUENCY_RANGE = Math.floor((MAX_FREQUENCY - MIN_FREQUENCY) / TONES_NUMBER);

export const areSameFrequency = (freq1, freq2) => {
    return (Math.floor((freq1 - MIN_FREQUENCY) / FREQUENCY_RANGE) === Math.floor((freq2 - MIN_FREQUENCY) / FREQUENCY_RANGE));
};

export const frequencyToByte = (freq) => {
    return (Math.floor((freq - MIN_FREQUENCY) / FREQUENCY_RANGE));
};

export const isRequestMarkTone = (freq, duration) => {
    return (frequencyToByte(freq) === REQUEST_MARK_BYTE) && (duration >= 0.1);
};

export const isResponseMarkTone = (freq, duration) => {
    return (frequencyToByte(freq) === RESPONSE_MARK_BYTE) && (duration >= 0.1);
}

// We add FREQUENCY_RANGE / 2 instead of 
// FREQUENCY_RANGE because in this way,
// the frequency we produce is at the middle of the
// range of frequencies that match to the given byte
// instead of the lower end of the range.
export const byteToFrequency = (value) => {
    return (value * FREQUENCY_RANGE + (MIN_FREQUENCY + Math.floor(FREQUENCY_RANGE / 2)));
};

export const buildFrequencyArray = (byteArray, type) => {
    var freqArray = byteArray.map(x => byteToFrequency(x));
    // Insert mark tones at both ends of the array
    switch (type) {
        case 'response':
            freqArray.unshift(byteToFrequency(RESPONSE_MARK_BYTE));
            freqArray.push(byteToFrequency(RESPONSE_MARK_BYTE));
            break;
        case 'request':
            freqArray.unshift(byteToFrequency(REQUEST_MARK_BYTE));
            freqArray.push(byteToFrequency(REQUEST_MARK_BYTE));
            break;
        default:
            console.error("Unrecognised message type: " + type);
    }
    // Insert separators between 2 equal frequencies 
    for (var i = 0; i < freqArray.length - 1; i++) {
        if (freqArray[i] === freqArray[i + 1]) {
            freqArray.splice(i + 1, 0, byteToFrequency(SEPARATOR_BYTE));
        }
    }
    return freqArray;
};

export const buildColorRequestArray = () => {
    return [REQUEST_COLOR_BYTE];
};

export const buildIntegerRequestArray = () => {
    return [REQUEST_INT_BYTE];
};

export const buildStringRequestArray = () => {
    return [REQUEST_STR_BYTE];
};

export const checkRequestType = (byteArray) => {
    if (byteArray.length > 1) {
        console.error("Unexpected number of frequencies in request message: " + byteArray.length);
        return 'undefined';
    }

    switch (byteArray[0]) {
        case REQUEST_COLOR_BYTE:
            return 'color';
        case REQUEST_INT_BYTE:
            return 'integer';
        case REQUEST_STR_BYTE:
            return 'string';
        default:
            console.error("Unrecognized frequency in request message: " + byteArray[1]
                + "\nCorresponding byte value: " + frequencyToByte(byteArray[1]));
            return 'undefined';
    }
};

export const hexToRGBArray = (color) => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
}

export const colorToByteArray = (color) => {
    return concatenateAllSubarrays(color.map(x => byteToNibbleArray(x)));
}

export const byteArrayToColor = (byteArray) => {
    var chunkedColor = chunk(byteArray);
    return chunkedColor.map(n => nibbleArrayToInt(n));
}

export const intToByteArray = (value) => {
    var byteArray = [0, 0, 0, 0, 0, 0, 0, 0];

    for (var i = 0; i < byteArray.length; i++) {
        var byte = value & 0xf;
        byteArray[i] = byte;
        value = (value - byte) / 16;
    }

    return byteArray;
};

export const byteArrayToInt = (byteArray) => {
    return nibbleArrayToInt(byteArray);
};

export const stringToByteArray = (string) => {
    return concatenateAllSubarrays(string.split('').map(x => byteToNibbleArray(x.charCodeAt())));
};

export const byteArrayToString = (byteArray) => {
    var chunkArray = chunk(byteArray);
    return chunkArray.map(x => String.fromCharCode(nibbleArrayToInt(x)));
};

export const createOscillator = (audioCtx, firstValue, onEnded) => {
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(firstValue, audioCtx.currentTime);
    oscillator.onended = onEnded;
    // oscillator.start();
    return oscillator;
};

let byteToNibbleArray = (value) => {
    var nibbleArray = [0, 0];

    for (var i = 0; i < nibbleArray.length; i++) {
        var nibble = value & 0xf;
        nibbleArray[i] = nibble;
        value = (value - nibble) / 16;
    }

    return nibbleArray;
}

let nibbleArrayToInt = (nibbleArray) => {
    var value = 0;

    for (var i = nibbleArray.length - 1; i >= 0; i--) {
        value = (value * 16) + nibbleArray[i];
    }

    return value;
}

let chunk = (array) => {
    if (!array.length) {
        return [];
    }
    var chunkSize = 2;
    var i, j, t, chunks = [];
    for (i = 0, j = array.length; i < j; i += chunkSize) {
        t = array.slice(i, i + chunkSize);
        chunks.push(t);
    }
    return chunks;
};

let concatenateAllSubarrays = (array) => {
    let result = [];

    for (var i = 0; i < array.length; i++) {
        result = result.concat(array[i]);
    }

    return result;
}