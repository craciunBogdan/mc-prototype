import React, { useState } from 'react';
import './ModeListener.css';
import '../../../common/components/styles/containers.css';
import RoundedButton from '../../../common/components/rounded-button/RoundedButton';
import { Link, useHistory } from 'react-router-dom';
import AudioTransmitter from '../../../common/functions/audio-transmitter';

function ModeListener() {
    const [audioTransmitter, setAudioTransmitter] = useState(new AudioTransmitter());
    const [buttonText, setButtonText] = useState('Start listening for mode');
    const history = useHistory();
    const [encKey, setEncKey] = useState('');

    if (audioTransmitter.selfStateUpdater !== setAudioTransmitter) {
        audioTransmitter.selfStateUpdater = setAudioTransmitter;
        setAudioTransmitter(audioTransmitter);
    }

    const startRecording = () => {
        if (audioTransmitter.isRecording) {
            const data = audioTransmitter.stopRecording();
            console.log(data);
        
            if (data === 'color') {
                history.push('/picker');
            } else if (data === 'integer') {
                history.push('raw?type=integer');
            } else if (data === 'string') {
                history.push('raw?type=string');
            }

            setButtonText('Start listening for mode');
        } else {
            setButtonText('Stop listening for mode');
            audioTransmitter.startRecording();
        }
    }

    const encKeyChanged = (event) =>{
        setEncKey(event.target.value);
        localStorage.setItem("encKey", event.target.value);
    }

    return (
        <div className="full-screen-base">
            <div className="full-screen-container centered-dimensions">
                <p className="input-item">{`Input your key`}</p>
                <input value={encKey} onChange={encKeyChanged} className="input-item" />
                <RoundedButton
                    text={buttonText}
                    onClick={startRecording}
                />
            </div>
        </div>
    )
};

export default ModeListener;