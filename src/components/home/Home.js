import React, { useState } from 'react';
import { CirclePicker } from 'react-color';

function Home() {    
    const colorArray = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b'];
    const [color, setColor] = useState('#22194D');

    const handleChange = (color) => {
        setColor(color.hex)
    };

    const handleChangeComplete = (color) => {
        setColor(color.hex)
    }

    return (
        <div className="Home">
            <CirclePicker
                color={color}
                disableAlpha={true}
                onChange={handleChange}
                onChangeComplete={handleChangeComplete}
            ></CirclePicker>
        </div>
    )
}

export default Home;