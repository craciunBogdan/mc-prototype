import React, { useState } from 'react';
import { CirclePicker } from 'react-color';
import './Home.css';
import AudioTransmitter from '../common/audio-transmitter';

function Home() {    
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
        <div className="home">
            <div className="color-picker-container">
                <CirclePicker
                    className="color-picker"
                    color={color}
                    disableAlpha={true}
                    onChange={handleChange}
                    onChangeComplete={handleChangeComplete}
                ></CirclePicker>
            </div>

            <div className="bottom-button-container">
                <button
                    className="activator"
                    onClick={sendColor}
                    disabled={audioTransmitter.isPlayingBack}
                    style={{ backgroundColor: color }}
                >
                    Send color
                </button>
            </div>
        </div>
    )
}

export default Home;