// src/Components/ThreeGrid.js

import React, { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { gsap } from "gsap"; // Importeer gsap
import { ScrollTrigger } from "gsap/ScrollTrigger"; // Importeer ScrollTrigger

// Registreer de ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Default settings if props are not provided
const DEFAULT_SETTINGS = {
    gardenWidth: 9,
    gardenHeight: 10,
    showPlant: true, // Example setting, adjust as needed
};

export default function ThreeGrid({ settings = DEFAULT_SETTINGS, onTilesSelected = () => { } }) {
    // Persistent refs for Three.js objects
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const raycaster = useRef(new THREE.Raycaster());
    const mouse = useRef(new THREE.Vector2());
    const tilesRef = useRef([]);
    const spriteMap = useRef(new Map());
    const selectedRefs = useRef([]);
    const isMouseDown = useRef(false);

    // Mouse events for drag-selection
    useEffect(() => {
        const handleMouseDown = () => (isMouseDown.current = true);
        const handleMouseUp = () => (isMouseDown.current = false);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    // Helper to reset sprites (plants and grass) from the scene
    const resetSprites = useCallback(() => {
        spriteMap.current.forEach((sp) => {
            if (sceneRef.current) {
                sceneRef.current.remove(sp);
            }
            if (sp.geometry) sp.geometry.dispose();
            if (sp.material) {
                if (Array.isArray(sp.material)) {
                    sp.material.forEach(m => m.dispose());
                } else {
                    sp.material.dispose();
                }
            }
        });
        spriteMap.current.clear();
    }, []);

    // Main useEffect for setting up the Three.js scene and grid
    useEffect(() => {
        const currentMount = mountRef.current;
        const currentRenderer = rendererRef.current;
        const currentScene = sceneRef.current;

        if (!currentMount) return;

        const width = currentMount.clientWidth || 600;
        const height = currentMount.clientHeight || 400;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);
        sceneRef.current = scene;

        // Camera setup - Gebruikt nu de startpositie voor de GSAP animatie
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        cameraRef.current = camera;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lighting
        scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight.position.set(5, 10, 5);
        scene.add(dirLight);

        // Initial camera positions voor de GSAP animatie
        const startCamPos = new THREE.Vector3(0, 0.4, 2); // Camera dichterbij en lager
        const startCamLook = new THREE.Vector3(0, 0.1, 0); // Kijkpunt is nu op de toppen van de bloemen
        const endCamPos = new THREE.Vector3(0, 2.2, 2.2);
        const endCamLook = new THREE.Vector3(0, 0, 0);

        // Stel de beginpositie van de camera in
        camera.position.copy(startCamPos);
        camera.lookAt(startCamLook);

        // === GSAP ScrollTrigger voor de camera-animatie ===
        ScrollTrigger.create({
            trigger: ".homepage-container",
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onUpdate: (self) => {
                const scrollProgress = self.progress;
                const newCamPos = startCamPos.clone().lerp(endCamPos, scrollProgress);
                const newLookAt = startCamLook.clone().lerp(endCamLook, scrollProgress);
                camera.position.copy(newCamPos);
                camera.lookAt(newLookAt);
            },
        });

        const gW = settings.gardenWidth;
        const gH = settings.gardenHeight;

        const gridTiles = 30;
        const tileSize = 0.3;
        const halfGridSize = (gridTiles / 2) * tileSize;

        const startX = Math.floor((gridTiles - gW) / 2);
        const startZ = Math.floor((gridTiles - gH) / 2);

        const gardenStartX = startX * tileSize - halfGridSize;
        const gardenStartZ = startZ * tileSize - halfGridSize;
        const gardenEndX = (startX + gW) * tileSize - halfGridSize;
        const gardenEndZ = (startZ + gH) * tileSize - halfGridSize;

        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xeeeeee });

        // Horizontal lines (along Z-axis)
        for (let i = 0; i <= gW; i++) {
            const x = gardenStartX + i * tileSize;
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x, 0.002, gardenStartZ),
                new THREE.Vector3(x, 0.002, gardenEndZ),
            ]);
            const line = new THREE.Line(geometry, lineMaterial);
            scene.add(line);
        }

        // Vertical lines (along X-axis)
        for (let j = 0; j <= gH; j++) {
            const z = gardenStartZ + j * tileSize;
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(gardenStartX, 0.002, z),
                new THREE.Vector3(gardenEndX, 0.002, z),
            ]);
            const line = new THREE.Line(geometry, lineMaterial);
            scene.add(line);
        }

        resetSprites();
        tilesRef.current = [];
        selectedRefs.current = [];

        // Create selection tiles
        for (let x = 0; x < gridTiles; x++) {
            for (let z = 0; z < gridTiles; z++) {
                const inGarden =
                  x >= startX && x < startX + gW &&
                  z >= startZ && z < startZ + gH;

              const material = new THREE.MeshBasicMaterial({
                  color: 0xffffff,
                  opacity: 0,
                  transparent: true,
                  side: THREE.DoubleSide,
              });
              const tile = new THREE.Mesh(new THREE.PlaneGeometry(tileSize, tileSize), material);
              tile.rotation.x = -Math.PI / 2;
              tile.position.set(
                  x * tileSize - halfGridSize + tileSize / 2,
                  0,
                  z * tileSize - halfGridSize + tileSize / 2
              );
              tile.userData = { inGarden, selected: false, gridX: x, gridZ: z };
              scene.add(tile);
              tilesRef.current.push(tile);

              if (inGarden) {
                  tile.userData.selected = true;
                  tile.material.color.set(0xf5f5f5);
                  tile.material.opacity = 0.5;
                  selectedRefs.current.push({ x, z });
              }
          }
      }

        const handleTileInteraction = (e) => {
          const rect = renderer.domElement.getBoundingClientRect();
          mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.current.setFromCamera(mouse.current, cameraRef.current);
          const intersects = raycaster.current.intersectObjects(tilesRef.current);

          if (intersects.length > 0) {
              const hit = intersects[0];
              const tile = hit.object;

            if (!tile.userData.inGarden) return;

            if (selectedRefs.current.length >= 80 && !tile.userData.selected) {
                console.warn("Max 80 tiles can be selected.");
                return;
            }

              if (tile.userData.selected) {
                  tile.userData.selected = false;
                  tile.material.color.set(0xffffff);
                  tile.material.opacity = 0;
                  selectedRefs.current = selectedRefs.current.filter(
                      (s) => !(s.x === tile.userData.gridX && s.z === tile.userData.gridZ)
                  );
              } else {
                  tile.userData.selected = true;
                  tile.material.color.set(0xf5f5f5);
                  tile.material.opacity = 0.5;
                  selectedRefs.current.push({ x: tile.userData.gridX, z: tile.userData.gridZ });
              }
              onTilesSelected([...selectedRefs.current]);
          }
      };

        renderer.domElement.addEventListener("pointermove", (e) => {
            if (isMouseDown.current) handleTileInteraction(e);
        });
        renderer.domElement.addEventListener("click", handleTileInteraction);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.maxPolarAngle = Math.PI / 2;

        const animate = () => {
            requestAnimationFrame(animate);

          const t = performance.now() * 0.001;
          spriteMap.current.forEach((sp) => {
              const { windPhase, windSpeed } = sp.userData;
              const angle = Math.sin(t * windSpeed + windPhase) * THREE.MathUtils.degToRad(3);
              sp.rotation.z = angle;
          });

            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            const { innerWidth, innerHeight } = window;
            renderer.setSize(innerWidth, innerHeight);
            camera.aspect = innerWidth / innerHeight;
            camera.updateProjectionMatrix();
        };

        window.addEventListener("resize", handleResize);

        return () => {
          ScrollTrigger.getAll().forEach(st => st.kill());
          window.removeEventListener("resize", handleResize);
          if (currentMount && currentRenderer && currentRenderer.domElement) {
              currentMount.removeChild(currentRenderer.domElement);
          }
          if (currentRenderer) {
              currentRenderer.dispose();
          }
          scene.traverse((object) => {
              if (object.isMesh || object.isLine) {
                  if (object.geometry) object.geometry.dispose();
                  if (object.material) {
                      if (Array.isArray(object.material)) {
                        object.material.forEach(m => m.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            }
        });
            lineMaterial.dispose();
        };
    }, [
        settings.gardenWidth,
        settings.gardenHeight,
        onTilesSelected,
        resetSprites
    ]);

    // useEffect for loading and placing flowers and grass
    useEffect(() => {
        if (!selectedRefs.current.length || !sceneRef.current) return;

        const scene = sceneRef.current;
        const tileSize = 0.3;
        const gridTiles = 30;
        const halfGridSize = (gridTiles / 2) * tileSize;
        const loader = new THREE.TextureLoader();

        resetSprites();

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

        function randomPatchOffset(patchShape, radius = 1.2) {
          switch (patchShape) {
              case "round": {
                  const angle = Math.random() * 2 * Math.PI;
                  const r = Math.random() * radius * 0.5;
                  return [Math.cos(angle) * r, Math.sin(angle) * r];
              }
              case "patch": {
                  const angle = Math.random() * 2 * Math.PI;
                  const r = Math.random() * radius;
                  return [Math.cos(angle) * r * 1.5, Math.sin(angle) * r * 0.8];
              }
              case "stripe": {
                  return [
                      (Math.random() - 0.5) * radius * 2.2,
                    (Math.random() - 0.5) * radius * 0.4
                ];
            }
            case "oval": {
                const angle = Math.random() * 2 * Math.PI;
                const r = Math.random() * radius;
                return [Math.cos(angle) * r * 1.1, Math.sin(angle) * r * 0.6];
            }
            case "polygon": {
                return [
                    (Math.random() - 0.5) * radius * 2.5 * Math.random(),
                    (Math.random() - 0.5) * radius * 2.5 * Math.random()
                ];
            }
            default: {
                return [
                    (Math.random() - 0.5) * radius * 2.0,
                      (Math.random() - 0.5) * radius * 2.0
                  ];
              }
          }
      }

        const inGardenTiles = selectedRefs.current;
        const flowerTiles = new Set();

        species.forEach((s) => {
            for (let c = 0; c < s.clusterSize; c++) {
                if (inGardenTiles.length === 0) continue;

              const { x: centerX, z: centerZ } = inGardenTiles[Math.floor(Math.random() * inGardenTiles.length)];
              const patchRadius = 0.7 + Math.random() * 1.2;
              const flowersInPatch = s.minFlowers + Math.floor(Math.random() * (s.maxFlowers - s.minFlowers + 1));

              for (let i = 0; i < flowersInPatch; i++) {
                  const [dx, dz] = randomPatchOffset(s.patchShape, patchRadius);
                  const px = centerX + dx;
                  const pz = centerZ + dz;

              const posX = px * tileSize - halfGridSize + tileSize / 2;
              const posZ = pz * tileSize - halfGridSize + tileSize / 2;

              const tileX = Math.round(px);
              const tileZ = Math.round(pz);
              flowerTiles.add(`${tileX}_${tileZ}`);

              loader.load(s.img, (tex) => {
                  const w = 0.3, h = 0.4;
                  const geom = new THREE.PlaneGeometry(w, h);
                  geom.translate(0, h / 2, 0);

                const mat = new THREE.MeshBasicMaterial({
                    map: tex,
                    transparent: true,
                    side: THREE.DoubleSide,
                    alphaTest: 0.1,
                    depthWrite: false,
                });

                const scale = 0.7 + Math.random() * 0.5;
                const baseHeight = s.baseHeight || 1;
                const variation = Math.random() * 0.1 - 0.05;
                const adjustedHeightScale = baseHeight + variation;

                const sp = new THREE.Mesh(geom, mat);
                sp.scale.set(scale, adjustedHeightScale, scale);
                sp.position.set(posX, 0, posZ);
                sp.rotation.y = Math.random() * Math.PI * 2;
                sp.userData.windPhase = Math.random() * Math.PI * 2;
                sp.userData.windSpeed = 0.8 + Math.random() * 0.4;
                scene.add(sp);
                spriteMap.current.set(`flower_${Math.random()}`, sp);
            });
              }
          }
      });

        const grassGeometry = new THREE.PlaneGeometry(0.2, 0.24);
        grassGeometry.translate(0, 0.12, 0);

        const grassTexture = loader.load("/20/Poa_pratensis.png");
        const grassMaterial = new THREE.MeshBasicMaterial({
            map: grassTexture,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.7,
        });

        const grassCount = 2000;
        const grassMesh = new THREE.InstancedMesh(grassGeometry, grassMaterial, grassCount);

        const grassTiles = inGardenTiles.filter(({ x, z }) => !flowerTiles.has(`${x}_${z}`));

        const dummy = new THREE.Object3D();
        if (grassTiles.length > 0) {
            for (let i = 0; i < grassCount; i++) {
                const tile = grassTiles[Math.floor(Math.random() * grassTiles.length)];
                const offsetX = (Math.random() - 0.5) * tileSize * 0.8;
                const offsetZ = (Math.random() - 0.5) * tileSize * 0.8;
                const scale = 0.2 + Math.random() * 0.2;

                dummy.position.set(
                    tile.x * tileSize - halfGridSize + tileSize / 2 + offsetX,
                    0.001,
                    tile.z * tileSize - halfGridSize + tileSize / 2 + offsetZ
                );
                dummy.scale.set(scale, scale, scale);
                dummy.rotation.y = Math.random() * Math.PI * 2;
                dummy.updateMatrix();
                grassMesh.setMatrixAt(i, dummy.matrix);
            }
        }
        scene.add(grassMesh);

        return () => {
            if (grassMesh) {
                scene.remove(grassMesh);
                if (grassMesh.geometry) grassMesh.geometry.dispose();
                if (grassMesh.material) grassMesh.material.dispose();
            }
            resetSprites();
        };
    }, [
        settings.showPlant,
        settings.gardenWidth, settings.gardenHeight,
        resetSprites
    ]);

    return (
        <div
            ref={mountRef}
            className="three-grid-canvas"
            style={{ width: "100%", height: "100%", borderRadius: "14px", overflow: "hidden" }}
        />
    );
}