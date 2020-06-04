import React, { useState } from 'react';
import { CirclePicker } from 'react-color';
import './ColorPicker.css';
import '../../../common/components/styles/containers.css';
import AudioTransmitter from '../../../common/functions/audio-transmitter';
import RoundedButton from '../../../common/components/rounded-button/RoundedButton';

function ColorPicker() {
    const colorArray = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b'];
    const [color, setColor] = useState('#22194D');
    const [audioTransmitter, setAudioTransmitter] = useState(new AudioTransmitter());

    const handleChange = (color) => {
        setColor(color.hex);
    };

    const handleChangeComplete = (color) => {
        setColor(color.hex);

        // Update the color in the audio transmitter
        audioTransmitter.updatePlaybackValue(color.hex);

        // Refresh audio transmitter
        setAudioTransmitter(audioTransmitter);
    }

    const sendColor = () => {
        if (audioTransmitter.isPlayingBack) {
            return;
        }

        audioTransmitter.startPlaying((at) => {
            setAudioTransmitter(at);
        });

        // Refresh audio transmitter
        setAudioTransmitter(audioTransmitter);

        console.log(`Sent ${color}`);
    }

    return (
        <div className="full-screen-base">
            <div className="full-screen-container">
                <CirclePicker
                    className="color-picker"
                    color={color}
                    disableAlpha={true}
                    onChange={handleChange}
                    onChangeComplete={handleChangeComplete}
                ></CirclePicker>
            </div>

            <div className="bottom-button-container">
                <RoundedButton
                    color={color}
                    disabled={audioTransmitter.isPlayingBack}
                    text={'Send color'}
                    onClick={sendColor}
                />
            </div>
        </div>
    )
}

export default ColorPicker;