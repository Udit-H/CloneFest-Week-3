"use client";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { useEffect, useRef, useState, FC, FormEvent } from "react";
import { createClient, type Session } from '@supabase/supabase-js';

// --- 1. SETUP SUPABASE CLIENT ---
// Replace with your actual Supabase URL and Key
const supabaseUrl = 'https://ptgvzghuvmgblekaazhh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0Z3Z6Z2h1dm1nYmxla2FhemhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDA1MTAsImV4cCI6MjA3Mzg3NjUxMH0.oDejvWr3hLqYTB7KVSYT_kYdDRi1rn_3zEqknbALVhI';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- SOUNDS ---
const hitSound = typeof Audio !== "undefined" ? new Audio('/sounds/hit.mp3') : undefined;
const collisionSound = typeof Audio !== "undefined" ? new Audio('/sounds/collision.mp3') : undefined;
const waterSound = typeof Audio !== "undefined" ? new Audio('/sounds/water.mp3') : undefined;
const successSound = typeof Audio !== "undefined" ? new Audio('/sounds/success.mp3') : undefined;

// --- LEVEL DATA ---
const levelData = [
    {
        name: 'Easy: The Starter',
        par: 2,
        ballStart: new THREE.Vector3(0, 0.4, -8),
        holePos: new THREE.Vector3(0, 0.05, 8),
        friction: 0.97,
        walls: [
            { type: 'wall', x: 0, z: -10, w: 20, h: 1, d: 0.5 }, { type: 'wall', x: 0, z: 10, w: 20, h: 1, d: 0.5 },
            { type: 'wall', x: -10, z: 0, w: 0.5, h: 1, d: 20 }, { type: 'wall', x: 10, z: 0, w: 0.5, h: 1, d: 20 },
        ],
    },
    {
        name: 'Medium: Sandy Zigzag',
        par: 3,
        ballStart: new THREE.Vector3(-8, 0.4, -8),
        holePos: new THREE.Vector3(8, 0.05, 8),
        friction: 0.96,
        walls: [
            { type: 'wall', x: 0, z: -10, w: 20, h: 1, d: 0.5 }, { type: 'wall', x: 0, z: 10, w: 20, h: 1, d: 0.5 },
            { type: 'wall', x: -10, z: 0, w: 0.5, h: 1, d: 20 }, { type: 'wall', x: 10, z: 0, w: 0.5, h: 1, d: 20 },
            { type: 'wall', x: 0, z: 0, w: 0.5, h: 1, d: 15 },
        ],
        sandTrap: {
            xMin: 2, xMax: 8, zMin: -2, zMax: 2, friction: 0.88,
        }
    },
    {
        name: 'Hard: The Hazard Slope',
        par: 4,
        ballStart: new THREE.Vector3(-8, 0.4, 8),
        holePos: new THREE.Vector3(0, 0.05, 8),
        friction: 0.95,
        walls: [
            { type: 'wall', x: 0, z: -10, w: 20, h: 1, d: 0.5 }, { type: 'wall', x: 0, z: 10, w: 20, h: 1, d: 0.5 },
            { type: 'wall', x: -10, z: 0, w: 0.5, h: 1, d: 20 }, { type: 'wall', x: 10, z: 0, w: 0.5, h: 1, d: 20 },
        ],
        sandTrap: {
            xMin: 2, xMax: 8, zMin: -8, zMax: 0, friction: 0.88,
        },
        water: {
            xMin: -8, xMax: -2, zMin: -8, zMax: 0,
        },
        slope: {
            zStart: 3, force: new THREE.Vector3(0, 0, 0.002)
        }
    },
    {
        name: 'Complex: The Rock Garden',
        par: 5,
        ballStart: new THREE.Vector3(0, 0.4, -8),
        holePos: new THREE.Vector3(0, 0.05, 8),
        friction: 0.97,
        walls: [
            { type: 'wall', x: 0, z: -10, w: 20, h: 1, d: 0.5 }, { type: 'wall', x: 0, z: 10, w: 20, h: 1, d: 0.5 },
            { type: 'wall', x: -10, z: 0, w: 0.5, h: 1, d: 20 }, { type: 'wall', x: 10, z: 0, w: 0.5, h: 1, d: 20 },
        ],
        movingWalls: [
            { type: 'wall', x: 0, z: 0, w: 8, h: 1, d: 0.5, axis: 'x', range: 5, speed: 0.0025 }
        ],
        rocks: [
            { type: 'rock', x: -2, z: 4, size: 0.6 },
            { type: 'rock', x: 2, z: 4, size: 0.6 },
            { type: 'rock', x: 0, z: -4, size: 0.8 },
        ]
    },
];

// --- TYPE DEFINITIONS ---
interface AuthProps {
    onLoginSuccess: () => void;
}
interface LeaderboardProps {
    onPlay: () => void;
    onLogout: () => void;
}
interface SuccessScreenProps {
    strokes: number;
    par: number;
    onNextLevel: () => void;
    isLastLevel: boolean;
    levelIndex: number;
    username: string;
    onExit: () => void;
}
interface GameProps {
    username: string;
    onExitToLeaderboard: () => void;
}
interface LevelSelectionProps {
    onSelectLevel: (index: number) => void;
}

// --- UI COMPONENTS ---

const Auth: FC<AuthProps> = ({ onLoginSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (event: FormEvent) => {
        event.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            alert("Login Failed: " + error.message);
        } else {
            onLoginSuccess();
        }
        setLoading(false);
    };

    return (
        <div className="menu-container">
            <form className="auth-box" onSubmit={handleLogin}>
                <h1>CloneFest Minigolf</h1>
                <input
                    type="text"
                    placeholder="Username (e.g., user@email.com)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging In...' : 'Login'}
                </button>
            </form>
            <style jsx>{`
                .menu-container {
                    display: flex; align-items: center; justify-content: center; height: 100vh;
                    background: linear-gradient(to bottom right, #1e293b, #0f172a); color: white;
                }
                .auth-box { 
                    text-align: center; background-color: rgba(0,0,0,0.3);
                    padding: 2.5rem; border-radius: 1rem;
                    display: flex; flex-direction: column; gap: 1rem;
                    width: 100%; max-width: 400px;
                }
                h1 { font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; }
                input {
                    padding: 0.75rem 1rem; border-radius: 0.5rem; border: 1px solid #475569;
                    background-color: #1e293b; color: white; font-size: 1rem;
                }
                button {
                    padding: 0.75rem 1rem; background-color: #2563eb; border-radius: 0.5rem;
                    transition: background-color 0.2s; border: none; cursor: pointer;
                    font-size: 1.1rem; font-weight: bold; color: white; margin-top: 0.5rem;
                }
                button:hover { background-color: #1d4ed8; }
                button:disabled { background-color: #94a3b8; cursor: not-allowed; }
            `}</style>
        </div>
    );
}

const Leaderboard: FC<LeaderboardProps> = ({ onPlay, onLogout }) => {
    // UPDATED STATE to match the function's return value
    const [scores, setScores] = useState<{ Username: string, total_strokes: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScores = async () => {
            setLoading(true);

            // UPDATED QUERY to call your RPC function
            const { data, error } = await supabase
                .rpc('get_leaderboard');
            
            if (error) {
                console.error("Error fetching leaderboard:", error);
            } else {
                setScores(data as { Username: string, total_strokes: number }[]);
            }
            setLoading(false);
        };
        fetchScores();
    }, []);

    return (
        <div className="menu-container">
            <div className="leaderboard-box">
                <h1>Leaderboard</h1>
                {loading ? <p>Loading Scores...</p> : (
                    <table>
                        <thead>
                            <tr>
                                {/* UPDATED TABLE HEADERS */}
                                <th>Player</th>
                                <th>Total Strokes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scores.map((score, index) => (
                                <tr key={index}>
                                    {/* UPDATED TABLE DATA */}
                                    <td>{score.Username}</td>
                                    <td>{score.total_strokes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <div className="button-group">
                    <button onClick={onPlay}>Play Game</button>
                    <button onClick={onLogout} className="logout-btn">Logout</button>
                </div>
            </div>
            <style jsx>{`
                .menu-container {
                    display: flex; align-items: center; justify-content: center; height: 100vh;
                    background: linear-gradient(to bottom right, #1e293b, #0f172a); color: white;
                }
                .leaderboard-box { background-color: rgba(0,0,0,0.3); padding: 2rem 3rem; border-radius: 1rem; text-align: center; min-width: 400px; }
                h1 { font-size: 2.5rem; margin-bottom: 1.5rem; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
                th, td { padding: 0.75rem; text-align: center; }
                th { border-bottom: 2px solid #475569; font-size: 1.1rem; }
                td { font-size: 1rem; }
                tbody tr:nth-child(even) { background-color: rgba(255,255,255,0.05); }
                .button-group { display: flex; gap: 1rem; justify-content: center; }
                button {
                    padding: 1rem 2rem; background-color: #2563eb; border-radius: 0.5rem;
                    transition: background-color 0.2s; border: none; cursor: pointer;
                    font-size: 1.25rem; font-weight: bold; color: white;
                }
                button:hover { background-color: #1d4ed8; }
                .logout-btn { background-color: #94a3b8; }
                .logout-btn:hover { background-color: #64748b; }
            `}</style>
        </div>
    );
}


const SuccessScreen: FC<SuccessScreenProps> = ({ strokes, par, onNextLevel, isLastLevel, levelIndex, username, onExit }) => {
    const scoreSubmitted = useRef(false);

    useEffect(() => {
        successSound?.play();

        if (!scoreSubmitted.current) {
            const saveScore = async () => {
                const { error } = await supabase.from('Scores').insert([
                    { Username: username, Scores: strokes, level: levelIndex + 1 }
                ]);
                if (error) console.error("Error saving score:", error);
            };
            
            saveScore();
            scoreSubmitted.current = true;
        }
    }, [strokes, par, levelIndex, username]);

    const getScoreText = () => {
        const score = strokes - par;
        if (strokes === 1) return "Hole in One!";
        if (score < -1) return `Albatross! ${score}`;
        if (score === -1) return `Birdie! ${score}`;
        if (score === 0) return "Par!";
        if (score === 1) return `Bogey... +${score}`;
        return `Double Bogey... +${score}`;
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-box">
                <h1>{getScoreText()}</h1>
                <p>You finished in {strokes} strokes (Par {par}).</p>
                <div className="button-container">
                    <button onClick={onNextLevel}>{isLastLevel ? "Back to Menu" : "Next Level"}</button>
                    <button onClick={onExit} className="exit-btn">Exit to Leaderboard</button>
                </div>
            </div>
            <style jsx>{`
                .modal-backdrop {
                    position: absolute; top: 0; left: 0; z-index: 50; width: 100%; height: 100%;
                    background-color: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center;
                    text-align: center;
                }
                .modal-box {
                    max-width: 32rem; border-radius: 0.75rem; background-color: #1e293b; padding: 2rem;
                    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); color: white;
                }
                h1 { margin-bottom: 1rem; font-size: 3rem; font-weight: 700; }
                p { margin-bottom: 2rem; font-size: 1.25rem; color: #cbd5e1; }
                .button-container { display: flex; justify-content: center; gap: 1rem; }
                button {
                    border-radius: 0.5rem; padding: 0.75rem 1.5rem; font-size: 1.1rem; font-weight: 700;
                    color: white; transition: background-color 0.2s; border: none; cursor: pointer;
                }
                button:first-child { background-color: #16a34a; }
                button:first-child:hover { background-color: #15803d; }
                .exit-btn { background-color: #94a3b8; }
                .exit-btn:hover { background-color: #64748b; }
            `}</style>
        </div>
    );
}

const Game: FC<GameProps> = ({ username, onExitToLeaderboard }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const velocityRef = useRef(new THREE.Vector3());
    const collidingObstacleRef = useRef<THREE.Object3D | null>(null);
    const [strokes, setStrokes] = useState(0);
    const [gameState, setGameState] = useState("menu");
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);

    const handleLevelSelect = (index: number) => {
        setCurrentLevelIndex(index);
        setStrokes(0);
        setGameState("playing");
    };

    const handleNextLevel = () => {
        const nextLevelIndex = currentLevelIndex + 1;
        if (nextLevelIndex < levelData.length) {
            handleLevelSelect(nextLevelIndex);
        } else {
            onExitToLeaderboard();
        }
    };
    
    const LevelSelectionMenu: FC<LevelSelectionProps> = ({ onSelectLevel }) => {
        return (
            <div className="menu-container">
                <div className="menu-box">
                    <h1>Select a Level</h1>
                    <div className="button-group">
                        <button onClick={() => onSelectLevel(0)}>Easy</button>
                        <button onClick={() => onSelectLevel(1)}>Medium</button>
                        <button onClick={() => onSelectLevel(2)}>Hard</button>
                        <button onClick={() => onSelectLevel(3)}>Complex</button>
                    </div>
                </div>
                <style jsx>{`
                    .menu-container {
                        display: flex; align-items: center; justify-content: center; height: 100%;
                        background: linear-gradient(to bottom right, #1e293b, #0f172a);
                    }
                    .menu-box { text-align: center; }
                    h1 { color: white; font-size: 3rem; font-weight: bold; margin-bottom: 2rem; }
                    .button-group { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; }
                    button {
                        padding: 1rem 2rem; background-color: #2563eb;
                        border-radius: 0.5rem; color: white;
                        transition: background-color 0.2s; border: none;
                        cursor: pointer; font-size: 1.25rem; font-weight: bold;
                    }
                    button:hover { background-color: #1d4ed8; }
                `}</style>
            </div>
        );
    }

    useEffect(() => {
        if (!mountRef.current || gameState !== "playing") return;
        const currentLevel = levelData[currentLevelIndex];
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xbfd1e5);
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 15, 20);
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
        const createTrapMesh = (trap: any, color: number | string) => {
            const trapWidth = trap.xMax - trap.xMin;
            const trapDepth = trap.zMax - trap.zMin;
            const trapGeo = new THREE.PlaneGeometry(trapWidth, trapDepth);
            const trapMat = new THREE.MeshStandardMaterial({ color });
            const trapMesh = new THREE.Mesh(trapGeo, trapMat);
            trapMesh.rotation.x = -Math.PI / 2;
            trapMesh.position.set(trap.xMin + trapWidth / 2, 0.01, trap.zMin + trapDepth / 2);
            scene.add(trapMesh);
        };
        if (currentLevel.sandTrap) createTrapMesh(currentLevel.sandTrap, 0xc2b280);
        if (currentLevel.water) createTrapMesh(currentLevel.water, 0x3366ff);
        if (currentLevel.slope) {
            const slope = currentLevel.slope;
            const slopeDepth = 10 - slope.zStart;
            const slopeGeo = new THREE.PlaneGeometry(20, slopeDepth);
            const slopeMat = new THREE.MeshStandardMaterial({ color: 0x2e4b09 });
            const slopeMesh = new THREE.Mesh(slopeGeo, slopeMat);
            slopeMesh.rotation.x = -Math.PI / 2;
            slopeMesh.position.set(0, 0.015, slope.zStart + slopeDepth / 2);
            scene.add(slopeMesh);
        }
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
        const obstacles: { mesh: THREE.Object3D, type: string }[] = [];
        if (currentLevel.walls) {
            currentLevel.walls.forEach(w => {
                const wall = new THREE.Mesh(new THREE.BoxGeometry(w.w, w.h, w.d), wallMaterial);
                wall.position.set(w.x, w.h / 2, w.z);
                scene.add(wall);
                obstacles.push({ mesh: wall, type: w.type });
            });
        }
        const movingWallMeshes: THREE.Mesh[] = [];
        if (currentLevel.movingWalls) {
            currentLevel.movingWalls.forEach(w => {
                const wall = new THREE.Mesh(new THREE.BoxGeometry(w.w, w.h, w.d), wallMaterial);
                wall.position.set(w.x, w.h / 2, w.z);
                scene.add(wall);
                obstacles.push({ mesh: wall, type: w.type });
                movingWallMeshes.push(wall);
            });
        }
        if (currentLevel.rocks) {
            const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
            currentLevel.rocks.forEach(r => {
                const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(r.size, 1), rockMaterial);
                rock.position.set(r.x, r.size / 2, r.z);
                scene.add(rock);
                obstacles.push({ mesh: rock, type: r.type });
            });
        }
        const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 32), new THREE.MeshStandardMaterial({ color: 0x000000 }));
        hole.position.copy(currentLevel.holePos);
        scene.add(hole);
        const flag = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.2, 16), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
        flag.position.copy(currentLevel.holePos).add(new THREE.Vector3(0, 1.15, 0));
        scene.add(flag);
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        ball.position.copy(currentLevel.ballStart);
        scene.add(ball);
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
            setStrokes((s) => s + 1);
        }
        renderer.domElement.addEventListener("mousedown", onMouseDown);
        renderer.domElement.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        let animationFrameId: number;
        function animate() {
            animationFrameId = requestAnimationFrame(animate);
            if (currentLevel.movingWalls) {
                const time = Date.now();
                currentLevel.movingWalls.forEach((wallData, index) => {
                    const wallMesh = movingWallMeshes[index];
                    if (wallData.axis === 'x') wallMesh.position.x = Math.sin(time * wallData.speed) * wallData.range;
                    else wallMesh.position.z = Math.sin(time * wallData.speed) * wallData.range;
                });
            }
            if (currentLevel.water) {
                const water = currentLevel.water;
                if (ball.position.x > water.xMin && ball.position.x < water.xMax && ball.position.z > water.zMin && ball.position.z < water.zMax) {
                    waterSound?.play();
                    ball.position.copy(currentLevel.ballStart);
                    velocityRef.current.set(0, 0, 0);
                    setStrokes(s => s + 1);
                }
            }
            ball.position.add(velocityRef.current);
            let friction = currentLevel.friction;
            if (currentLevel.sandTrap) {
                const trap = currentLevel.sandTrap;
                if (ball.position.x > trap.xMin && ball.position.x < trap.xMax && ball.position.z > trap.zMin && ball.position.z < trap.zMax) {
                    friction = trap.friction;
                }
            }
            velocityRef.current.multiplyScalar(friction);
            if (currentLevel.slope && ball.position.z > currentLevel.slope.zStart && ball.position.z < 10) {
                velocityRef.current.add(currentLevel.slope.force);
            }
            let collisionDetectedThisFrame = false;
            obstacles.forEach(obstacle => {
                const obstacleBox = new THREE.Box3().setFromObject(obstacle.mesh);
                const ballBox = new THREE.Box3().setFromObject(ball);
                if (obstacleBox.intersectsBox(ballBox)) {
                    collisionDetectedThisFrame = true;
                    if (collidingObstacleRef.current !== obstacle.mesh) {
                        if (obstacle.type === 'wall') hitSound?.play();
                        else if (obstacle.type === 'rock') collisionSound?.play();
                        collidingObstacleRef.current = obstacle.mesh;
                    }
                    const overlap = ballBox.clone().intersect(obstacleBox);
                    const overlapSize = overlap.getSize(new THREE.Vector3());
                    if (overlapSize.x < overlapSize.z) {
                        velocityRef.current.x *= -0.7;
                        ball.position.x += (ball.position.x > obstacle.mesh.position.x ? 1 : -1) * overlapSize.x;
                    } else {
                        velocityRef.current.z *= -0.7;
                        ball.position.z += (ball.position.z > obstacle.mesh.position.z ? 1 : -1) * overlapSize.z;
                    }
                }
            });
            if (!collisionDetectedThisFrame) {
                collidingObstacleRef.current = null;
            }
            if (ball.position.distanceTo(hole.position) < 0.6 && velocityRef.current.lengthSq() < 0.05) {
                velocityRef.current.set(0, 0, 0);
                setGameState("success");
            }
            controls.update();
            renderer.render(scene, camera);
        }
        function screenOverBall(x: number, y: number) {
            const rect = renderer.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            return raycaster.intersectObject(ball).length > 0;
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
            {gameState === 'menu' && <LevelSelectionMenu onSelectLevel={handleLevelSelect} />}
            {(gameState === 'playing' || gameState === 'success') && (
                <>
                    <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
                    <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0, 0, 0, 0.6)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.75rem' }}>
                        <p style={{ fontWeight: 'bold' }}>{levelData[currentLevelIndex].name}</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <p>Strokes: {strokes}</p>
                            <p>Par: {levelData[currentLevelIndex].par}</p>
                        </div>
                    </div>
                    <button onClick={() => onExitToLeaderboard()} style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 50, padding: '0.5rem 1rem', background: '#dc2626', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>
                        Exit
                    </button>
                </>
            )}
            {gameState === 'success' && (
                <SuccessScreen
                    strokes={strokes}
                    par={levelData[currentLevelIndex].par}
                    onNextLevel={handleNextLevel}
                    isLastLevel={currentLevelIndex === levelData.length - 1}
                    levelIndex={currentLevelIndex}
                    username={username}
                    onExit={onExitToLeaderboard}
                />
            )}
        </div>
    );
}

// --- THE MAIN APP CONTROLLER ---
export default function MinigolfPage() {
    const [session, setSession] = useState<Session | null>(null);
    const [view, setView] = useState('auth');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setSession(session);
                setView('leaderboard');
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) setView('leaderboard');
            else setView('auth');
        });
        return () => subscription.unsubscribe();
    }, []);
    
    const handleLogout = async () => {
        await supabase.auth.signOut();
        setView('auth');
    };

    if (view === 'auth') {
        return <Auth onLoginSuccess={() => setView('leaderboard')} />;
    }
    
    if (view === 'leaderboard') {
        return <Leaderboard onPlay={() => setView('game')} onLogout={handleLogout} />;
    }

    if (view === 'game') {
        return <Game username="CloneFest2025" onExitToLeaderboard={() => setView('leaderboard')} />;
    }

    return <div style={{height: '100vh', background: '#0f172a'}} />;
}