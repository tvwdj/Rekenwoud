// src/HomePage.js

import React from "react";
import "./HomePage.css";
import ThreeGrid from "./ThreeGrid";

export default function HomePage() {
    return (
        <div className="homepage-container">
            {/* De ThreeGrid component wordt nu in een aparte container geplaatst.
        Deze container heeft een 'fixed' positie in de CSS, waardoor hij 
        altijd zichtbaar blijft op de achtergrond.
      */}
            <div className="three-grid-container">
                <ThreeGrid />
            </div>

            {/* De content-container omvat alle tekstuele en interactieve elementen.
        Deze container scrollt over de ThreeGrid-achtergrond heen.
      */}
            <div className="content-container">
                <div className="landing-page">
                    <nav className="navbar">
                        <a href="#over-ons">over ons</a>
                        <a href="#ons-doel">ons doel</a>
                        <a href="#hoe-werkt-de-tool">hoe werkt de tool</a>
                    </nav>
                    <h1 className="title">Rekenwoud</h1>
                    <div className="scroll-arrow">
                        <a href="#tuin-maken">
                            <span role="img" aria-label="pijl naar beneden">
                                ↓
                            </span>
                        </a>
                    </div>
                </div>

                <div id="tuin-maken">
                    <h2>Maak tuin</h2>
                </div>
            </div>
        </div>
    );
}