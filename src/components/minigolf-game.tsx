"use client";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { useEffect, useRef, useState } from "react";

// This is the self-contained success screen component with its own styling.
function SuccessScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <>
      <div className="success-screen-backdrop">
        <div className="success-screen-modal">
          <h1>YAYY! SUCCESS 🎉</h1>
          <p>You completed the hole!</p>
          <button onClick={onRestart}>
            Play Again
          </button>
        </div>
      </div>
      <style jsx>{`
        .success-screen-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 50;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .success-screen-modal {
          max-width: 28rem;
          border-radius: 0.75rem;
          background-color: #1e293b;
          padding: 2rem;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
          color: white;
        }
        h1 {
          margin-bottom: 1rem;
          font-size: 3rem;
          line-height: 1;
          font-weight: 700;
        }
        p {
          margin-bottom: 2rem;
          font-size: 1.25rem;
          color: #cbd5e1;
        }
        button {
          border-radius: 0.5rem;
          background-color: #16a34a;
          padding: 1rem 2rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          transition: background-color 0.2s;
          border: none;
          cursor: pointer;
        }
        button:hover {
          background-color: #15803d;
        }
      `}</style>
    </>
  );
}


export default function MinigolfGame() {
    const mountRef = useRef<HTMLDivElement>(null);
    const ballRef = useRef<THREE.Mesh | null>(null);
    const velocityRef = useRef(new THREE.Vector3());

    const [strokes, setStrokes] = useState(0);
    const [gameState, setGameState] = useState("menu");

    const handleRestart = () => {
        setStrokes(0);
        if (ballRef.current) {
            ballRef.current.position.set(0, 0.4, 0);
        }
        velocityRef.current.set(0, 0, 0);
        setGameState("playing");
    };

    useEffect(() => {
        if (!mountRef.current || gameState !== "playing") return;

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
        function addWall(x: number, z: number, w: number, d: number) {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), wallMaterial);
            wall.position.set(x, 0.5, z);
            scene.add(wall);
        }
        addWall(0, -10, 20, 0.5); addWall(0, 10, 20, 0.5);
        addWall(-10, 0, 0.5, 20); addWall(10, 0, 0.5, 20);
        const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 32), new THREE.MeshStandardMaterial({ color: 0x000000 }));
        hole.position.set(6, 0.05, 6);
        scene.add(hole);
        const flag = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.2, 16), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
        flag.position.set(6, 1.2, 6);
        scene.add(flag);
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        ball.position.set(0, 0.4, 0);
        scene.add(ball);
        ballRef.current = ball;
        
        // --- Restored projectile line logic ---
        const previewDots: THREE.Mesh[] = [];
        const dotGeom = new THREE.SphereGeometry(0.1, 8, 8);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        for (let i = 0; i < 10; i++) {
            const dot = new THREE.Mesh(dotGeom, dotMat);
            dot.visible = false;
            scene.add(dot);
            previewDots.push(dot);
        }
        // ---

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
        
        // --- Added back onMouseMove function ---
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
        // ---

        function onMouseUp(e: MouseEvent) {
            if (!isDragging) return;
            isDragging = false;
            controls.enabled = true;
            previewDots.forEach((dot) => (dot.visible = false)); // Hide dots on release
            
            const dragEnd = new THREE.Vector2(e.clientX, e.clientY);
            const dragVector = new THREE.Vector2().subVectors(dragStart, dragEnd);
            velocityRef.current.set(dragVector.x * 0.006, 0, dragVector.y * 0.006);
            setStrokes((s) => s + 1);
        }

        renderer.domElement.addEventListener("mousedown", onMouseDown);
        renderer.domElement.addEventListener("mousemove", onMouseMove); // Added back listener
        window.addEventListener("mouseup", onMouseUp);

        let animationFrameId: number;
        function animate() {
            animationFrameId = requestAnimationFrame(animate);
            ball.position.add(velocityRef.current);
            velocityRef.current.multiplyScalar(0.97);

            const limit = 9.5;
            if (ball.position.x < -limit || ball.position.x > limit) {
                velocityRef.current.x *= -0.7;
                ball.position.x = THREE.MathUtils.clamp(ball.position.x, -limit, limit);
            }
            if (ball.position.z < -limit || ball.position.z > limit) {
                velocityRef.current.z *= -0.7;
                ball.position.z = THREE.MathUtils.clamp(ball.position.z, -limit, limit);
            }

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
            renderer.domElement.removeEventListener("mousemove", onMouseMove); // Added to cleanup
            cancelAnimationFrame(animationFrameId);
            renderer.dispose();
        };
    }, [gameState]);

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
            {gameState === "menu" && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'linear-gradient(to bottom right, #1e293b, #0f172a)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <button onClick={() => setGameState("playing")} style={{ padding: '0.75rem 1.5rem', background: '#2563eb', borderRadius: '0.5rem', color: 'white', transition: 'background-color 0.2s', border: 'none', cursor: 'pointer' }}>
                            Start Game
                        </button>
                    </div>
                </div>
            )}

            {(gameState === "playing" || gameState === "success") && (
                <>
                    <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
                    <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0, 0, 0, 0.6)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
                        <p style={{ fontWeight: 'bold' }}>Hole 1</p>
                        <p>Strokes: {strokes}</p>
                    </div>
                    <button onClick={() => setGameState("menu")} style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 50, padding: '0.5rem 1rem', background: '#dc2626', color: 'white', borderRadius: '0.5rem', transition: 'background-color 0.2s', border: 'none', cursor: 'pointer' }}>
                        Exit
                    </button>
                </>
            )}

            {gameState === "success" && <SuccessScreen onRestart={handleRestart} />}
        </div>
    );
}