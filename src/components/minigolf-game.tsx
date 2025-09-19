"use client";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { useEffect, useRef, useState } from "react";

// --- LEVEL DATA ---
const levelData = [
  {
    name: 'Easy: The Starter',
    ballStart: new THREE.Vector3(0, 0.4, -8),
    holePos: new THREE.Vector3(0, 0.05, 8),
    friction: 0.97,
    walls: [
      { x: 0, z: -10, w: 20, h: 1, d: 0.5 },
      { x: 0, z: 10, w: 20, h: 1, d: 0.5 },
      { x: -10, z: 0, w: 0.5, h: 1, d: 20 },
      { x: 10, z: 0, w: 0.5, h: 1, d: 20 },
    ],
  },
  {
    name: 'Medium: The Zigzag',
    ballStart: new THREE.Vector3(-8, 0.4, -8),
    holePos: new THREE.Vector3(8, 0.05, 8),
    friction: 0.96,
    walls: [
      { x: 0, z: -10, w: 20, h: 1, d: 0.5 },
      { x: 0, z: 10, w: 20, h: 1, d: 0.5 },
      { x: -10, z: 0, w: 0.5, h: 1, d: 20 },
      { x: 10, z: 0, w: 0.5, h: 1, d: 20 },
      { x: 0, z: 0, w: 0.5, h: 1, d: 15 }, // Central obstacle wall
    ],
  },
  {
    name: 'Hard: The Trap',
    ballStart: new THREE.Vector3(0, 0.4, -8),
    holePos: new THREE.Vector3(0, 0.05, 8),
    friction: 0.94,
    walls: [
      { x: 0, z: -10, w: 20, h: 1, d: 0.5 },
      { x: 0, z: 10, w: 20, h: 1, d: 0.5 },
      { x: -10, z: 0, w: 0.5, h: 1, d: 20 },
      { x: 10, z: 0, w: 0.5, h: 1, d: 20 },
      { x: 5, z: 0, w: 0.5, h: 1, d: 10 },
      { x: -5, z: 0, w: 0.5, h: 1, d: 10 },
    ],
  },
];

// --- UI COMPONENTS (Self-Styled) ---

function SuccessScreen({ onNextLevel, isLastLevel }: { onNextLevel: () => void; isLastLevel: boolean }) {
  return (
    <>
      <div className="modal-backdrop">
        <div className="modal-box">
          <h1>{isLastLevel ? "GAME COMPLETE!" : "YAYY! SUCCESS 🎉"}</h1>
          <p>{isLastLevel ? "You've beaten all the levels!" : "You completed the hole!"}</p>
          <button onClick={onNextLevel}>
            {isLastLevel ? "Play Again" : "Next Level"}
          </button>
        </div>
      </div>
      <style jsx>{`
        .modal-backdrop {
          position: absolute; top: 0; left: 0; z-index: 50;
          width: 100%; height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex; align-items: center; justify-content: center;
          text-align: center;
        }
        .modal-box {
          max-width: 32rem; border-radius: 0.75rem;
          background-color: #1e293b; padding: 2rem;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
          color: white;
        }
        h1 { margin-bottom: 1rem; font-size: 3rem; font-weight: 700; }
        p { margin-bottom: 2rem; font-size: 1.25rem; color: #cbd5e1; }
        button {
          border-radius: 0.5rem; background-color: #16a34a;
          padding: 1rem 2rem; font-size: 1.25rem; font-weight: 700;
          color: white; transition: background-color 0.2s;
          border: none; cursor: pointer;
        }
        button:hover { background-color: #15803d; }
      `}</style>
    </>
  );
}

function LevelSelectionMenu({ onSelectLevel }: { onSelectLevel: (index: number) => void }) {
  return (
    <>
      <div className="menu-container">
        <div className="menu-box">
          <h1>Select a Level</h1>
          <div className="button-group">
            <button onClick={() => onSelectLevel(0)}>Easy</button>
            <button onClick={() => onSelectLevel(1)}>Medium</button>
            <button onClick={() => onSelectLevel(2)}>Hard</button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .menu-container {
          display: flex; align-items: center; justify-content: center;
          height: 100%;
          background: linear-gradient(to bottom right, #1e293b, #0f172a);
        }
        .menu-box { text-align: center; }
        h1 { color: white; font-size: 3rem; font-weight: bold; margin-bottom: 2rem; }
        .button-group { display: flex; gap: 1rem; }
        button {
          padding: 1rem 2rem; background-color: #2563eb;
          border-radius: 0.5rem; color: white;
          transition: background-color 0.2s; border: none;
          cursor: pointer; font-size: 1.25rem; font-weight: bold;
        }
        button:hover { background-color: #1d4ed8; }
      `}</style>
    </>
  );
}


// --- MAIN GAME COMPONENT ---

export default function MinigolfGame() {
    const mountRef = useRef<HTMLDivElement>(null);
    const ballRef = useRef<THREE.Mesh | null>(null);
    const velocityRef = useRef(new THREE.Vector3());

    const [strokes, setStrokkes] = useState(0);
    const [gameState, setGameState] = useState("menu");
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);

    const handleLevelSelect = (index: number) => {
        setCurrentLevelIndex(index);
        setStrokkes(0);
        setGameState("playing");
    };

    const handleNextLevel = () => {
        const nextLevelIndex = currentLevelIndex + 1;
        if (nextLevelIndex < levelData.length) {
            handleLevelSelect(nextLevelIndex);
        } else {
            setGameState("menu");
        }
    };
    
    useEffect(() => {
        if (!mountRef.current || gameState !== "playing") return;

        const currentLevel = levelData[currentLevelIndex];

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xbfd1e5);
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 10, 20);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.innerHTML = "";
        mountRef.current.appendChild(renderer.domElement);
        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7);
        scene.add(dirLight);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: 0x3a5f0b }));
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);
        
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
        const walls: THREE.Mesh[] = []; // Store walls for collision detection
        currentLevel.walls.forEach(w => {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(w.w, w.h, w.d), wallMaterial);
            wall.position.set(w.x, w.h / 2, w.z);
            scene.add(wall);
            walls.push(wall);
        });

        const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 32), new THREE.MeshStandardMaterial({ color: 0x000000 }));
        hole.position.copy(currentLevel.holePos);
        scene.add(hole);
        
        const flag = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.2, 16), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
        flag.position.copy(currentLevel.holePos).add(new THREE.Vector3(0, 1.15, 0));
        scene.add(flag);

        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        ball.position.copy(currentLevel.ballStart);
        scene.add(ball);
        ballRef.current = ball;

        const ballRadius = 0.4;
        
        const previewDots: THREE.Mesh[] = [];
        const dotGeom = new THREE.SphereGeometry(0.1, 8, 8);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        for (let i = 0; i < 10; i++) {
            const dot = new THREE.Mesh(dotGeom, dotMat);
            dot.visible = false;
            scene.add(dot);
            previewDots.push(dot);
        }
        
        let isDragging = false;
        let dragStart = new THREE.Vector2();

        function screenOverBall(x: number, y: number) {
            const rect = renderer.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            return raycaster.intersectObject(ball).length > 0;
        }

        function onMouseDown(e: MouseEvent) {
            if (screenOverBall(e.clientX, e.clientY) && velocityRef.current.lengthSq() < 0.001) {
                isDragging = true;
                controls.enabled = false;
                dragStart.set(e.clientX, e.clientY);
            }
        }

        function onMouseMove(e: MouseEvent) {
            if (!isDragging) return;
            const dragEnd = new THREE.Vector2(e.clientX, e.clientY);
            const dragVector = new THREE.Vector2().subVectors(dragStart, dragEnd);
            const power = dragVector.length() * 0.02;
            const angle = Math.atan2(dragVector.y, dragVector.x);
            const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).normalize();
            previewDots.forEach((dot, i) => {
                const t = (i + 1) / previewDots.length;
                dot.position.copy(ball.position.clone().add(dir.clone().multiplyScalar(power * t * 3)));
                dot.visible = true;
            });
        }
        
        function onMouseUp(e: MouseEvent) {
            if (!isDragging) return;
            isDragging = false;
            controls.enabled = true;
            previewDots.forEach((dot) => (dot.visible = false));
            
            const dragEnd = new THREE.Vector2(e.clientX, e.clientY);
            const dragVector = new THREE.Vector2().subVectors(dragStart, dragEnd);
            velocityRef.current.set(dragVector.x * 0.006, 0, dragVector.y * 0.006);
            setStrokkes((s) => s + 1);
        }

        renderer.domElement.addEventListener("mousedown", onMouseDown);
        renderer.domElement.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);

        let animationFrameId: number;
        function animate() {
            animationFrameId = requestAnimationFrame(animate);
            ball.position.add(velocityRef.current);
            velocityRef.current.multiplyScalar(currentLevel.friction);

            // --- NEW WALL COLLISION LOGIC ---
            walls.forEach(wall => {
                const wallBox = new THREE.Box3().setFromObject(wall);
                const ballBox = new THREE.Box3().setFromObject(ball);
                
                if (wallBox.intersectsBox(ballBox)) {
                    // Find the overlap
                    const overlap = ballBox.clone().intersect(wallBox);
                    const overlapSize = overlap.getSize(new THREE.Vector3());

                    // If width is smaller than depth, it's a side collision
                    if (overlapSize.x < overlapSize.z) {
                        velocityRef.current.x *= -0.7; // Bounce
                        // Move ball out of wall slightly to prevent sticking
                        ball.position.x += (ball.position.x > wall.position.x ? 1 : -1) * overlapSize.x;
                    } else { // It's a front/back collision
                        velocityRef.current.z *= -0.7; // Bounce
                        ball.position.z += (ball.position.z > wall.position.z ? 1 : -1) * overlapSize.z;
                    }
                }
            });
            // --- END NEW LOGIC ---

            if (ball.position.distanceTo(hole.position) < 0.6 && velocityRef.current.length() < 0.05) {
                velocityRef.current.set(0, 0, 0);
                setGameState("success");
            }

            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        return () => {
            window.removeEventListener("mouseup", onMouseUp);
            renderer.domElement.removeEventListener("mousedown", onMouseDown);
            renderer.domElement.removeEventListener("mousemove", onMouseMove);
            cancelAnimationFrame(animationFrameId);
            renderer.dispose();
        };
    }, [gameState, currentLevelIndex]);

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
            {gameState === "menu" && <LevelSelectionMenu onSelectLevel={handleLevelSelect} />}

            {(gameState === "playing" || gameState === "success") && (
                <>
                    <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
                    <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0, 0, 0, 0.6)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.75rem' }}>
                        <p style={{ fontWeight: 'bold' }}>{levelData[currentLevelIndex].name}</p>
                        <p>Strokes: {strokes}</p>
                    </div>
                    <button onClick={() => setGameState("menu")} style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 50, padding: '0.5rem 1rem', background: '#dc2626', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>
                        Exit
                    </button>
                </>
            )}

            {gameState === "success" && (
                <SuccessScreen
                    onNextLevel={handleNextLevel}
                    isLastLevel={currentLevelIndex === levelData.length - 1}
                />
            )}
        </div>
    );
}