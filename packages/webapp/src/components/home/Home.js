import React, { useState } from 'react';
import {
    HashRouter,
    Switch,
    Route,
    Link
} from "react-router-dom";
import ColorPicker from './components/color-picker/ColorPicker';
import ModeListener from './components/mode-listener/ModeListener';
import Raw from './components/raw/Raw';

function Home() {
    return (
        <div className="home">
            <HashRouter>
                <Route path="/picker">
                    <ColorPicker />
                </Route>
                <Route path="/raw">
                    <Raw />
                </Route>
                <Route exact path="/">
                    <ModeListener/>
                </Route>
            </HashRouter>
        </div>
    );
}

export default Home;