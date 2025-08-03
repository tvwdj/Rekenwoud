// src/HomePage.js
import React from 'react';
import './HomePage.css';
import ThreeGrid from './ThreeGrid';

export default function HomePage() {
    return (
        <div className="homepage-container">
            <ThreeGrid />
            <div className="content-container">

                <div className="landing-page">
                    <nav className="navbar">
                        <a href="#over-ons">over ons</a>
                        <a href="#ons-doel">ons doel</a>
                        <a href="#hoe-werkt-de-tool">hoe werkt de tool</a>
                    </nav>
                    {/* Dit is de nieuwe container voor de tekst */}
                    <div className="title-container">
                        <h1 className="main-title">Rekenwoud</h1>
                        <p className="subtitle">
                            Elke Tuin telt: Maak samen met anderen een netwerk van tuinen voor vlinders, bijen en biodiversiteit.
                        </p>
                    </div>
                    <div className="scroll-arrow">
                        {/* ... */}
                    </div>
                </div>

                <div id="tuin-maken">
                    <h2 className="title">Maak tuin</h2>
                </div>
            </div>
        </div>
    );
}