import React, { useState } from 'react';
import './Raw.css';
import '../../../common/components/styles/containers.css';
import RoundedButton from '../../../common/components/rounded-button/RoundedButton';
import { useLocation, useHistory } from 'react-router-dom';
import AudioTransmitter from '../../../common/functions/audio-transmitter';
import BackButton from '../../../common/components/back-button/BackButton';

function Raw() {
    const location = useLocation();
    const history = useHistory();
    const params = new URLSearchParams(location.search);
    const type = params.get('type');

    const [audioTransmitter, setAudioTransmitter] = useState(new AudioTransmitter());
    const [buttonText, setButtonText] = useState('Send data');
    const [textValue, setTextValue] = useState('');

    if (audioTransmitter.selfStateUpdater !== setAudioTransmitter) {
        audioTransmitter.updateDataType(type);
        audioTransmitter.selfStateUpdater = setAudioTransmitter;
        setAudioTransmitter(audioTransmitter);
    }

    const inputTextChanged = (event) => {
        setTextValue(event.target.value);
    }

    const onBackButtonClicked = () => {
        history.push('/');
    }

    const onSendButtonClicked = () => {
        if (audioTransmitter.isPlayingBack) {
            audioTransmitter.stopPlaying();
            setButtonText('Send data');
        } else {
            audioTransmitter.updatePlaybackValue(textValue);
            audioTransmitter.startPlaying();
            setButtonText('Stop sending');
        }
    }

    return (
        <div className="full-screen-base">
            <div className="back-button">
                <BackButton onClick={onBackButtonClicked} />
            </div>
            <div className="full-screen-container input-container">
                <p className="input-item">{`Input your ${type} here...`}</p>
                <input value={textValue} onChange={inputTextChanged} className="input-item" />
                <RoundedButton
                    disabled={!textValue}
                    onClick={onSendButtonClicked}
                    text={buttonText}
                />
            </div>
        </div>
    )
}

export default Raw;