import React, { useState, useEffect } from 'react';
import { CirclePicker } from 'react-color';
import './ColorPicker.css';
import '../../../common/components/styles/containers.css';
import AudioTransmitter from '../../../common/functions/audio-transmitter';
import RoundedButton from '../../../common/components/rounded-button/RoundedButton';
import { useHistory } from 'react-router-dom';
import BackButton from '../../../common/components/back-button/BackButton';

function ColorPicker() {
    const history = useHistory();
    const colorArray = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b'];
    const [color, setColor] = useState('#f44336');
    const [audioTransmitter, setAudioTransmitter] = useState(new AudioTransmitter());
    const [buttonText, setButtonText] = useState('Send color');

    if (audioTransmitter.selfStateUpdater !== setAudioTransmitter) {
        audioTransmitter.selfStateUpdater = setAudioTransmitter;
        setAudioTransmitter(audioTransmitter);
    }

    const handleChange = (color) => {
        setColor(color.hex);
    };

    const handleChangeComplete = (color) => {
        setColor(color.hex);

        // Update the color in the audio transmitter
        audioTransmitter.updatePlaybackValue(color.hex);
    }

    const sendColor = () => {
        if (audioTransmitter.isPlayingBack) {
            audioTransmitter.stopPlaying();
            setButtonText('Send color');
        } else {
            audioTransmitter.startPlaying();
            setButtonText('Stop sending');
        }
    }

    const onBackButtonClicked = () => {
        history.push('/');
    }

    return (
        <div className="full-screen-base">
            <div className="back-button">
                <BackButton
                    onClick={onBackButtonClicked}
                />
            </div>
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
                    text={buttonText}
                    onClick={sendColor}
                />
            </div>
        </div>
    )
}

export default ColorPicker;