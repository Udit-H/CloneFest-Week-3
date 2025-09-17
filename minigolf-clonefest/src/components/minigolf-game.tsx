"use client";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { useEffect, useRef, useState } from "react";

export default function MinigolfGame() {
    const mountRef = useRef<HTMLDivElement>(null);
    const ballRef = useRef<THREE.Mesh | null>(null);

    const [strokes, setStrokes] = useState(0);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (!mountRef.current || !started) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xbfd1e5);

        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(0, 10, 20);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.innerHTML = "";
        mountRef.current.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7);
        scene.add(dirLight);

        // Floor
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.MeshStandardMaterial({ color: 0x3a5f0b })
        );
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);

        // Walls
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
        function addWall(x: number, z: number, w: number, d: number) {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), wallMaterial);
            wall.position.set(x, 0.5, z);
            scene.add(wall);
        }
        addWall(0, -10, 20, 0.5);
        addWall(0, 10, 20, 0.5);
        addWall(-10, 0, 0.5, 20);
        addWall(10, 0, 0.5, 20);

        // Hole
        const hole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 0.1, 32),
            new THREE.MeshStandardMaterial({ color: 0x000000 })
        );
        hole.position.set(6, 0.05, 6);
        scene.add(hole);

        // Flag
        const flag = new THREE.Mesh(
            new THREE.ConeGeometry(0.3, 1.2, 16),
            new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
        flag.position.set(6, 1.2, 6);
        scene.add(flag);

        // Ball
        const ball = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        ball.position.set(0, 0.4, 0);
        scene.add(ball);
        ballRef.current = ball;

        // Trajectory preview dots
        const previewDots: THREE.Mesh[] = [];
        const dotGeom = new THREE.SphereGeometry(0.1, 8, 8);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        for (let i = 0; i < 10; i++) {
            const dot = new THREE.Mesh(dotGeom, dotMat);
            dot.visible = false;
            scene.add(dot);
            previewDots.push(dot);
        }

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // Ball movement
        let velocity = new THREE.Vector3();
        let isDragging = false;
        let dragStart = new THREE.Vector2();

        function screenOverBall(x: number, y: number) {
            const rect = renderer.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((x - rect.left) / rect.width) * 2 - 1,
                -((y - rect.top) / rect.height) * 2 + 1
            );
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(ball);
            return intersects.length > 0;
        }

        function onMouseDown(e: MouseEvent) {
            if (screenOverBall(e.clientX, e.clientY)) {
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
            velocity.set(dragVector.x * 0.006, 0, dragVector.y * 0.006);
            setStrokes((s) => s + 1);
        }

        renderer.domElement.addEventListener("mousedown", onMouseDown);
        renderer.domElement.addEventListener("mousemove", onMouseMove);
        renderer.domElement.addEventListener("mouseup", onMouseUp);

        window.addEventListener("resize", () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        function animate() {
            requestAnimationFrame(animate);

            ball.position.add(velocity);
            velocity.multiplyScalar(0.97);

            const limit = 9.5;
            if (ball.position.x < -limit || ball.position.x > limit) {
                velocity.x *= -0.7;
                ball.position.x = THREE.MathUtils.clamp(ball.position.x, -limit, limit);
            }
            if (ball.position.z < -limit || ball.position.z > limit) {
                velocity.z *= -0.7;
                ball.position.z = THREE.MathUtils.clamp(ball.position.z, -limit, limit);
            }

            // Automatic reset on hole
            if (ball.position.distanceTo(hole.position) < 0.6 && velocity.length() < 0.05) {
                velocity.set(0, 0, 0);
                ball.position.set(0, 0.4, 0);
                setStrokes((s) => s + 1);
            }

            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        return () => renderer.dispose();
    }, [started]);

    return (
        <div className="relative w-screen h-screen">
            {!started ? (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-900 to-slate-800">
                    <div className="text-center">
                        <button
                            onClick={() => setStarted(true)}
                            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                        >
                            Start Game
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div ref={mountRef} className="w-full h-full" />
                    <div className="absolute top-4 left-4 bg-white/80 dark:bg-black/60 px-4 py-2 rounded-xl shadow-md">
                        <p className="font-bold">Hole 1</p>
                        <p>Strokes: {strokes}</p>
                    </div>
                    {/* Exit button top-right */}
                    <button
                        onClick={() => setStarted(false)}
                        className="absolute top-4 right-4 z-50 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                        Exit
                    </button>

                </>
            )}
        </div>
    );
}
