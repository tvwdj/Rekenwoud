import React, { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './HomePage.css';
import ThreeGrid from './ThreeGrid';

export default function HomePage() {

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".homepage-container",
                start: "top top",
                end: "bottom center",
                scrub: true,
            },
        });

        // Animatie:
        // Verplaats alleen de verticale positie en pas de transform aan.
        tl.to(".title-container", {
            top: "2rem",
            transform: "translateY(0)" // Verwijder de verticale centrering
        }, 0);

        tl.to(".subtitle", { opacity: 0, duration: 0.3 }, 0);

        setTimeout(() => {
            ScrollTrigger.refresh();
        }, 500);

    }, []);


    return (
        <div className="homepage-container">
            <ThreeGrid />
            <div className="content-container">

                <div className="title-container">
                    <h1 className="main-title">Rekenwoud</h1>
                    <p className="subtitle">
                        Elke Tuin telt: Maak samen met anderen een netwerk van tuinen voor vlinders, bijen en biodiversiteit.
                    </p>
                </div>

                <div className="landing-page">
                    <nav className="navbar">
                        <a href="#over-ons">over ons</a>
                        <a href="#ons-doel">ons doel</a>
                        <a href="#hoe-werkt-de-tool">hoe werkt de tool</a>
                    </nav>
                    <div className="scroll-arrow">
                        <a href="#tuin-maken">
                            <span role="img" aria-label="pijl naar beneden">
                                ↓
                            </span>
                        </a>
                    </div>
                </div>

                <div id="tuin-maken">
                    <h2 className="title">Maak tuin</h2>
                </div>
            </div>
        </div>
    );
}