import React, { useState } from 'react';
import './ModeListener.css';
import '../../../common/components/styles/containers.css';
import RoundedButton from '../../../common/components/rounded-button/RoundedButton';
import { Link } from 'react-router-dom';
import AudioTransmitter from '../../../common/functions/audio-transmitter';

function ModeListener() {
    const [audioTransmitter, setAudioTransmitter] = useState(new AudioTransmitter());

    const startRecording = () => {
        audioTransmitter.startRecording();
    }

    return (
        <div className="full-screen-base">
            <div>
                <Link to="/picker" className="full-screen-container centered-dimensions">
                    <RoundedButton
                        text={'Start listening for mode'}
                        onClick={startRecording}
                    />
                </Link>
            </div>
        </div>
    )
};

export default ModeListener;