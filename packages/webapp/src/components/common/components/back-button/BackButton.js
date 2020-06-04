import React from 'react';
import './BackButton.css'
import icon from '../../../../icons/back-button.png';

function BackButton({ onClick }) {
    return (
        <div onClick={onClick}>
            <img src={icon} alt="logo" className="back-button"/>
        </div>
    );
}

export default BackButton;