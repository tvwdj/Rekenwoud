// src/HomePage.js

import React, { useState, useEffect, useRef } from "react";
import "./HomePage.css";
import ThreeGrid from "./ThreeGrid";

export default function HomePage() {
    const [scrollPosition, setScrollPosition] = useState(0);
    const homePageRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
            setScrollPosition(scrollPercentage);
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return (
        <div className="homepage-container" ref={homePageRef}>
            <div className="landing-page">
                <nav className="navbar">
                    <a href="#over-ons">over ons</a>
                    <a href="#ons-doel">ons doel</a>
                    <a href="#hoe-werkt-de-tool">hoe werkt de tool</a>
                </nav>
                <h1 className="title">Rekenwoud</h1>
                <div className="flower-animation-placeholder">
                    {/* We geven de scrollPosition door als een prop */}
                    <ThreeGrid viewMode="landing" scrollPosition={scrollPosition} />
                </div>
                <div className="scroll-arrow">
                    <a href="#tuin-maken">
                        <span role="img" aria-label="pijl naar beneden">
                            ↓
                        </span>
                    </a>
                </div>
            </div>
            <div id="tuin-maken" style={{ height: "100vh", position: "relative" }}>
                {/* Later komt hier de knop 'Maak tuin' */}
                <h2 style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 10,
                }}>Maak tuin</h2>
            </div>
        </div>
    );
}