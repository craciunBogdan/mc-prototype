import React from 'react';
import './RoundedButton.css'

function RoundedButton({ color, disabled, onClick, text }) {
    return (
        <button
            className="rounded-button"
            onClick={onClick}
            disabled={disabled}
            style={{ backgroundColor: color }}
        >
            {text}
        </button>
    );
}

export default RoundedButton;