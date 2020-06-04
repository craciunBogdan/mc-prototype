import React, { useState } from 'react';
import './ModeListener.css';
import '../../../common/components/styles/containers.css';
import RoundedButton from '../../../common/components/rounded-button/RoundedButton';
import { Link } from 'react-router-dom';
import AudioTransmitter from '../../../common/functions/audio-transmitter';

function ModeListener() {
    const [audioTransmitter, setAudioTransmitter] = useState(new AudioTransmitter());
    const [buttonText, setButtonText] = useState('Start listening for mode');

    if (audioTransmitter.selfStateUpdater !== setAudioTransmitter) {
        audioTransmitter.selfStateUpdater = setAudioTransmitter;
        setAudioTransmitter(audioTransmitter);
    }

    const startRecording = () => {
        if (audioTransmitter.isRecording) {
            const data = audioTransmitter.stopRecording();
            console.log(data);
            setButtonText('Start listening for mode');
        } else {
            setButtonText('Stop listening for mode');
            audioTransmitter.startRecording();
        }
    }

    return (
        <div className="full-screen-base">
            <div className="full-screen-container centered-dimensions">
                <RoundedButton
                    text={buttonText}
                    onClick={startRecording}
                />
            </div>
        </div>
    )
};

export default ModeListener;