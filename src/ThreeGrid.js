// src/ThreeGrid.js
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ## WIJZIGING 1: Tuin is nu 12x12 ##
const DEFAULT_SETTINGS = {
    gardenWidth: 12,
    gardenHeight: 12,
};

const species = [
    { name: "Centaurea nigra", img: "/21/Centaurea_nigra.png", patchShape: "round", clusterSize: 3, minFlowers: 4, maxFlowers: 7, baseHeight: 0.8 },
    { name: "Armeria maritima", img: "/21/Armeria_maritima.png", patchShape: "patch", clusterSize: 3, minFlowers: 6, maxFlowers: 15, baseHeight: 0.5 },
    { name: "Borago officinalis", img: "/21/Borago_officinalis.png", patchShape: "oval", clusterSize: 2, minFlowers: 5, maxFlowers: 8, baseHeight: 1.0 },
    { name: "Calluna vulgaris", img: "/21/Calluna_vulgaris.png", patchShape: "stripe", clusterSize: 2, minFlowers: 8, maxFlowers: 16, baseHeight: 0.6 },
    { name: "Centaurea scabiosa", img: "/21/Centaurea_scabiosa.png", patchShape: "patch", clusterSize: 2, minFlowers: 7, maxFlowers: 14, baseHeight: 0.9 },
    { name: "Centaurea cyanus", img: "/21/Centaurea_cyanus.png", patchShape: "stripe", clusterSize: 2, minFlowers: 7, maxFlowers: 14, baseHeight: 0.7 },
    { name: "Heracleum sphondylium", img: "/21/Heracleum_sphondylium.png", patchShape: "polygon", clusterSize: 1, minFlowers: 2, maxFlowers: 3, baseHeight: 1.2 },
    { name: "Origanum vulgare", img: "/21/Origanum_vulgare.png", patchShape: "round", clusterSize: 3, minFlowers: 4, maxFlowers: 8, baseHeight: 0.7 },
    { name: "Trifolium repens", img: "/21/Trifolium_repens.png", patchShape: "patch", clusterSize: 3, minFlowers: 8, maxFlowers: 14, baseHeight: 0.3 },
    { name: "Phacelia tanacetifolia", img: "/21/phacelia_tanacetifolia.png", patchShape: "polygon", clusterSize: 2, minFlowers: 5, maxFlowers: 9, baseHeight: 1.1 },
];

function randomPatchOffset(patchShape, radius) {
    switch (patchShape) { case "round": { const angle = Math.random() * 2 * Math.PI; const r = Math.random() * radius * 0.5; return [Math.cos(angle) * r, Math.sin(angle) * r]; } case "patch": { const angle = Math.random() * 2 * Math.PI; const r = Math.random() * radius; return [Math.cos(angle) * r * 1.5, Math.sin(angle) * r * 0.8]; } case "stripe": { return [(Math.random() - 0.5) * radius * 2.2, (Math.random() - 0.5) * radius * 0.4]; } case "oval": { const angle = Math.random() * 2 * Math.PI; const r = Math.random() * radius; return [Math.cos(angle) * r * 1.1, Math.sin(angle) * r * 0.6]; } case "polygon": { return [(Math.random() - 0.5) * radius * 2.5 * Math.random(), (Math.random() - 0.5) * radius * 2.5 * Math.random()]; } default: { return [(Math.random() - 0.5) * radius * 2.0, (Math.random() - 0.5) * radius * 2.0]; } }
}

export default function ThreeGrid({ settings = DEFAULT_SETTINGS }) {
    const mountRef = useRef(null);

    useEffect(() => {
        let renderer, scrollTriggerInstance;
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        scene.add(new THREE.DirectionalLight(0xffffff, 0.5).position.set(5, 10, 5));

        // ## WIJZIGING 2: Eindcamera is dichterbij voor kleinere tuin ##
        const startCamPos = new THREE.Vector3(0.2, 0.4, 1.5);
        const startCamLook = new THREE.Vector3(0, 0.7, 0);
        const endCamPos = new THREE.Vector3(0, 2.5, 5.3); // Aangepast voor 12x12 tuin
        const endCamLook = new THREE.Vector3(0, 0, 0);

        camera.position.copy(startCamPos);
        camera.lookAt(startCamLook);

        scrollTriggerInstance = ScrollTrigger.create({
            trigger: "body",
            start: "top top",
            end: "bottom bottom",
            scrub: 1.5,
            onUpdate: (self) => {
                camera.position.lerpVectors(startCamPos, endCamPos, self.progress);
                camera.lookAt(startCamLook.clone().lerp(endCamLook, self.progress));
            },
        });

        const gW = settings.gardenWidth;
        const gH = settings.gardenHeight;
        const tileSize = 0.3;
        const halfGridW = (gW / 2) * tileSize;
        const halfGridH = (gH / 2) * tileSize;

        const loader = new THREE.TextureLoader();
        const dummy = new THREE.Object3D();
        const instancedMeshes = new Map();

        const gardenTiles = Array.from({ length: gW * gH }, (_, i) => ({ x: i % gW, z: Math.floor(i / gW) }));
        const plantsData = new Map();
        species.forEach(s => plantsData.set(s.name, []));

        species.forEach(s => {
            const clusterCount = Math.ceil((gW * gH) / 50) * s.clusterSize;
            for (let c = 0; c < clusterCount; c++) {
                const { x: tileX, z: tileZ } = gardenTiles[Math.floor(Math.random() * gardenTiles.length)];
                const centerX = (tileX * tileSize) - halfGridW + (tileSize / 2);
                const centerZ = (tileZ * tileSize) - halfGridH + (tileSize / 2);

                // ## WIJZIGING 3: Bugfix - patchRadius is hier gedefinieerd ##
                const patchRadius = 0.7 + Math.random() * 1.2;
                const flowersInPatch = s.minFlowers + Math.floor(Math.random() * (s.maxFlowers - s.minFlowers + 1));

                for (let i = 0; i < flowersInPatch; i++) {
                    const [dx, dz] = randomPatchOffset(s.patchShape, patchRadius);
                    const posX = centerX + dx;
                    const posZ = centerZ + dz;
                    const scale = 0.7 + Math.random() * 0.5;
                    const baseHeight = s.baseHeight || 1;
                    const variation = Math.random() * 0.1 - 0.05;

                    plantsData.get(s.name).push({
                        position: new THREE.Vector3(posX, 0, posZ),
                        scale: new THREE.Vector3(scale, (baseHeight + variation) * scale, scale),
                        rotationY: Math.random() * Math.PI * 2,
                        windPhase: Math.random() * Math.PI * 2,
                        windSpeed: 0.8 + Math.random() * 0.4,
                    });
                }
            }
        });

        plantsData.forEach((data, name) => {
            if (data.length === 0) return;
            const s = species.find(sp => sp.name === name);
            loader.load(s.img, (texture) => {
                const geometry = new THREE.PlaneGeometry(0.3, 0.4);
                geometry.translate(0, 0.2, 0);
                const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, alphaTest: 0.1, depthWrite: false });
                const mesh = new THREE.InstancedMesh(geometry, material, data.length);

                for (let i = 0; i < data.length; i++) {
                    const { position, scale, rotationY } = data[i];
                    dummy.position.copy(position);
                    dummy.scale.copy(scale);
                    dummy.rotation.set(0, rotationY, 0);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(i, dummy.matrix);
                }
                mesh.instanceMatrix.needsUpdate = true;
                scene.add(mesh);
                instancedMeshes.set(name, { mesh, data });
            });
        });

        const animate = () => {
            if (!renderer) return; // Stop animation if cleaned up
            requestAnimationFrame(animate);
            const t = performance.now() * 0.001;

            instancedMeshes.forEach(({ mesh, data }) => {
                for (let i = 0; i < data.length; i++) {
                    const { position, scale, rotationY, windPhase, windSpeed } = data[i];
                    const angle = Math.sin(t * windSpeed + windPhase) * THREE.MathUtils.degToRad(3);
                    dummy.position.copy(position);
                    dummy.scale.copy(scale);
                    dummy.rotation.set(0, rotationY, angle);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(i, dummy.matrix);
                }
                mesh.instanceMatrix.needsUpdate = true;
            });

            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            if (currentMount && renderer.domElement) {
                currentMount.removeChild(renderer.domElement);
            }
            if (scrollTriggerInstance) scrollTriggerInstance.kill();
            scene.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            renderer.dispose();
            renderer = null;
        };
    }, [settings.gardenWidth, settings.gardenHeight]);

    return <div ref={mountRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }} />;
}