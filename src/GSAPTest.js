// src/GSAPTest.js
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import './GSAPTest.css';

gsap.registerPlugin(ScrollTrigger);

export default function GSAPTest() {
    const mountRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);

    useEffect(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x333333);

        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        cameraRef.current = camera;

        // BELANGRIJKE AANPASSINGEN: De camera-posities zijn nu correct
        // Startpositie: ingezoomd, lage hoek
        const startCamPos = { x: 0, y: 0.5, z: 5 };
        const startCamLook = { x: 0, y: 20, z: -10 };
        // Eindpositie: uitgezoomd, overzicht van de grid
        const endCamPos = { x: 0, y: 20, z: 40 };
        const endCamLook = { x: 0, y: 0, z: 0 };

        camera.position.set(startCamPos.x, startCamPos.y, startCamPos.z);
        camera.lookAt(startCamLook.x, startCamLook.y, startCamLook.z);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        if (mountRef.current) {
            mountRef.current.appendChild(renderer.domElement);
        }
        rendererRef.current = renderer;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enabled = false;
        controlsRef.current = controls;

        const gridHelper = new THREE.GridHelper(100, 100);
        scene.add(gridHelper);

        // === GSAP ScrollTrigger ===
        gsap.to(camera.position, {
            x: endCamPos.x,
            y: endCamPos.y,
            z: endCamPos.z,
            scrollTrigger: {
                trigger: ".test-scroll-div",
                start: "top top",
                end: "bottom bottom",
                scrub: true,
            },
        });

        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            const { innerWidth, innerHeight } = window;
            camera.aspect = innerWidth / innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(innerWidth, innerHeight);
        };
        window.addEventListener("resize", handleResize);

        return () => {
            ScrollTrigger.getAll().forEach(st => st.kill());
            window.removeEventListener("resize", handleResize);
            if (rendererRef.current) {
                rendererRef.current.domElement.remove();
            }
        };
    }, []);

    return (
        <>
            <div className="test-canvas" ref={mountRef} />
            <div className="test-scroll-div" style={{ height: '300vh', backgroundColor: 'transparent' }} />
        </>
    );
}