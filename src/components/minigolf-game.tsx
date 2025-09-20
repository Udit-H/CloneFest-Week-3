"use client";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { useEffect, useRef, useState, FC, FormEvent } from "react";
import { createClient, type Session } from '@supabase/supabase-js';

// --- SETUP SUPABASE CLIENT ---
const supabaseUrl = 'https://ptgvzghuvmgblekaazhh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0Z3Z6Z2h1dm1nYmxla2FhemhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDA1MTAsImV4cCI6MjA3Mzg3NjUxMH0.oDejvWr3hLqYTB7KVSYT_kYdDRi1rn_3zEqknbALVhI';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- SOUNDS ---
const hitSound = typeof Audio !== "undefined" ? new Audio('/sounds/hit.mp3') : undefined;
const collisionSound = typeof Audio !== "undefined" ? new Audio('/sounds/collision.mp3') : undefined;
const waterSound = typeof Audio !== "undefined" ? new Audio('/sounds/water.mp3') : undefined;
const successSound = typeof Audio !== "undefined" ? new Audio('/sounds/success.mp3') : undefined;

// --- CONSTANTS ---
const GRAVITY = 0.005;
const BALL_RADIUS = 0.4;

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
        sandTrap: { xMin: 2, xMax: 8, zMin: -2, zMax: 2, friction: 0.88, }
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
        sandTrap: { xMin: 2, xMax: 8, zMin: -8, zMax: 0, friction: 0.88, },
        water: { xMin: -8, xMax: -2, zMin: -8, zMax: 0, },
        slope: { zStart: 3, force: new THREE.Vector3(0, 0, 0.002) }
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
        movingWalls: [{ type: 'wall', x: 0, z: 0, w: 8, h: 1, d: 0.5, axis: 'x', range: 5, speed: 0.0025 }],
        rocks: [
            { type: 'rock', x: -2, z: 4, size: 0.6 }, { type: 'rock', x: 2, z: 4, size: 0.6 }, { type: 'rock', x: 0, z: -4, size: 0.8 },
        ]
    },
    {
        name: 'Expert: The Climb',
        par: 4,
        useGravity: true,
        ballStart: new THREE.Vector3(0, 0.4, 8),
        holePos: new THREE.Vector3(0, 3.05, -8),
        friction: 0.98,
        grounds: [
            { x: 0, y: 0, z: 6, w: 8, d: 8 },
            { x: 0, y: 3, z: -6, w: 8, d: 8 }
        ],
        ramps: [{ xMin: -2, xMax: 2, yStart: 0, yEnd: 3, zStart: 2, zEnd: -2, }],
        walls: [
            { y: 0, type: 'wall', x: -4, z: 6, w: 0.5, h: 1, d: 8 }, { y: 0, type: 'wall', x: 4, z: 6, w: 0.5, h: 1, d: 8 },
            { y: 0, type: 'wall', x: 0, z: 10, w: 8, h: 1, d: 0.5 },
            { y: 3, type: 'wall', x: -4, z: -6, w: 0.5, h: 1, d: 8 }, { y: 3, type: 'wall', x: 4, z: -6, w: 0.5, h: 1, d: 8 },
            { y: 3, type: 'wall', x: 0, z: -10, w: 8, h: 1, d: 0.5 },
        ],
    },
    {
        name: 'Challenge: The Gauntlet',
        par: 6,
        ballStart: new THREE.Vector3(0, 0.4, -18),
        holePos: new THREE.Vector3(0, 0.05, 18),
        friction: 0.97,
        walls: [
            { type: 'wall', x: 0, z: -20, w: 12, h: 1, d: 0.5 }, { type: 'wall', x: 0, z: 20, w: 12, h: 1, d: 0.5 },
            { type: 'wall', x: -6, z: 0, w: 0.5, h: 1, d: 40 }, { type: 'wall', x: 6, z: 0, w: 0.5, h: 1, d: 40 },
            { type: 'wall', x: 0, z: -14, w: 6, h: 0.5, d: 0.5, y: 3.5 }, { type: 'wall', x: -2.75, z: -14, w: 0.5, h: 4, d: 0.5 }, { type: 'wall', x: 2.75, z: -14, w: 0.5, h: 4, d: 0.5 },
            { type: 'wall', x: 0, z: -4, w: 6, h: 0.5, d: 0.5, y: 3.5 }, { type: 'wall', x: -2.75, z: -4, w: 0.5, h: 4, d: 0.5 }, { type: 'wall', x: 2.75, z: -4, w: 0.5, h: 4, d: 0.5 },
            { type: 'wall', x: 0, z: 4, w: 6, h: 0.5, d: 0.5, y: 3.5 }, { type: 'wall', x: -2.75, z: 4, w: 0.5, h: 4, d: 0.5 }, { type: 'wall', x: 2.75, z: 4, w: 0.5, h: 4, d: 0.5 },
            { type: 'wall', x: 0, z: 14, w: 6, h: 0.5, d: 0.5, y: 3.5 }, { type: 'wall', x: -2.75, z: 14, w: 0.5, h: 4, d: 0.5 }, { type: 'wall', x: 2.75, z: 14, w: 0.5, h: 4, d: 0.5 },
        ],
        movingWalls: [
            { type: 'plank', axis: 'z', h: 3, w: 1.6, d: 0.4, pivot: { x: 0, y: 3.25, z: -14 }, speed: 0.002, range: Math.PI / 4, offset: 0 },
            { type: 'plank', axis: 'z', h: 3, w: 1.6, d: 0.4, pivot: { x: 0, y: 3.25, z: -4 }, speed: 0.0022, range: Math.PI / 4, offset: Math.PI / 2 },
            { type: 'plank', axis: 'z', h: 3, w: 1.6, d: 0.4, pivot: { x: 0, y: 3.25, z: 4 }, speed: 0.0018, range: Math.PI / 4, offset: Math.PI },
            { type: 'plank', axis: 'z', h: 3, w: 1.6, d: 0.4, pivot: { x: 0, y: 3.25, z: 14 }, speed: 0.0024, range: Math.PI / 4, offset: Math.PI / 3 },
        ]
    },
];

// --- TYPE DEFINITIONS ---
interface AuthProps { onLoginSuccess: () => void; }
interface LeaderboardProps { onPlay: () => void; onLogout: () => void; }
interface GameProps { username: string; onExitToLeaderboard: () => void; }
interface LevelSelectionProps { onSelectLevel: (index: number) => void; }
interface SuccessScreenProps { strokes: number; par: number; onNextLevel: () => void; isLastLevel: boolean; onExit: () => void; onRetry: () => void; }

// --- UI COMPONENTS ---

const Auth: FC<AuthProps> = ({ onLoginSuccess }) => {
    // This component is unchanged
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const handleLogin = async (event: FormEvent) => {
        event.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert("Login Failed: " + error.message);
        else onLoginSuccess();
        setLoading(false);
    };
    return (
        <div className="menu-container">
            <form className="auth-box" onSubmit={handleLogin}>
                <h1>CloneFest Minigolf</h1>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit" disabled={loading}>{loading ? 'Logging In...' : 'Login'}</button>
            </form>
            <style jsx>{`
                .menu-container { display: flex; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(to bottom right, #1e293b, #0f172a); color: white; }
                .auth-box { text-align: center; background-color: rgba(0,0,0,0.3); padding: 2.5rem; border-radius: 1rem; display: flex; flex-direction: column; gap: 1rem; width: 100%; max-width: 400px; }
                h1 { font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; }
                input { padding: 0.75rem 1rem; border-radius: 0.5rem; border: 1px solid #475569; background-color: #1e293b; color: white; font-size: 1rem; }
                button { padding: 0.75rem 1rem; background-color: #2563eb; border-radius: 0.5rem; transition: background-color 0.2s; border: none; cursor: pointer; font-size: 1.1rem; font-weight: bold; color: white; margin-top: 0.5rem; }
                button:hover { background-color: #1d4ed8; }
                button:disabled { background-color: #94a3b8; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

const Leaderboard: FC<LeaderboardProps> = ({ onPlay, onLogout }) => {
    // This component is unchanged
    const [scores, setScores] = useState<{ Username: string, total_points: number }[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchScores = async () => {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_leaderboard');
            if (error) console.error("Error fetching leaderboard:", error);
            else setScores(data as { Username: string, total_points: number }[]);
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
                        <thead><tr><th>Player</th><th>Total Points</th></tr></thead>
                        <tbody>
                            {scores.map((score, index) => (
                                <tr key={index}>
                                    <td>{score.Username}</td>
                                    <td>{score.total_points}</td>
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
                .menu-container { display: flex; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(to bottom right, #1e293b, #0f172a); color: white; }
                .leaderboard-box { background-color: rgba(0,0,0,0.3); padding: 2rem 3rem; border-radius: 1rem; text-align: center; min-width: 400px; max-height: 90vh; overflow-y: auto;}
                h1 { font-size: 2.5rem; margin-bottom: 1.5rem; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
                th, td { padding: 0.75rem; text-align: center; }
                th { border-bottom: 2px solid #475569; font-size: 1.1rem; }
                td { font-size: 1rem; }
                tbody tr:nth-child(even) { background-color: rgba(255,255,255,0.05); }
                .button-group { display: flex; gap: 1rem; justify-content: center; }
                button { padding: 1rem 2rem; background-color: #2563eb; border-radius: 0.5rem; transition: background-color 0.2s; border: none; cursor: pointer; font-size: 1.25rem; font-weight: bold; color: white; }
                button:hover { background-color: #1d4ed8; }
                .logout-btn { background-color: #94a3b8; }
                .logout-btn:hover { background-color: #64748b; }
            `}</style>
        </div>
    );
};

const SuccessScreen: FC<SuccessScreenProps> = ({ strokes, par, onNextLevel, isLastLevel, onExit, onRetry }) => {
    // This component is unchanged
    useEffect(() => { successSound?.play(); }, []);
    return (
        <div className="modal-backdrop">
            <div className="modal-box">
                <h1>{isLastLevel ? "GAME COMPLETE!" : "YAYY! SUCCESS 🎉"}</h1>
                <p>You finished in {strokes} strokes (Par {par}).</p>
                <div className="button-container">
                    <button onClick={onNextLevel} className="btn-primary">{isLastLevel ? "Back to Menu" : "Next Level"}</button>
                    <button onClick={onRetry} className="btn-secondary">Retry</button>
                    <button onClick={onExit} className="btn-tertiary">Exit to Leaderboard</button>
                </div>
            </div>
            <style jsx>{`
                .modal-backdrop { position: absolute; top: 0; left: 0; z-index: 50; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; text-align: center; }
                .modal-box { max-width: 32rem; border-radius: 0.75rem; background-color: #1e293b; padding: 2rem; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); color: white; }
                h1 { margin-bottom: 1rem; font-size: 3rem; font-weight: 700; }
                p { margin-bottom: 2rem; font-size: 1.25rem; color: #cbd5e1; }
                .button-container { display: flex; justify-content: center; gap: 1rem; }
                button { border-radius: 0.5rem; padding: 0.75rem 1.5rem; font-size: 1.1rem; font-weight: 700; color: white; transition: background-color 0.2s; border: none; cursor: pointer; }
                .btn-primary { background-color: #16a34a; } .btn-primary:hover { background-color: #15803d; }
                .btn-secondary { background-color: #2563eb; } .btn-secondary:hover { background-color: #1d4ed8; }
                .btn-tertiary { background-color: #94a3b8; } .btn-tertiary:hover { background-color: #64748b; }
            `}</style>
        </div>
    );
};

const Game: FC<GameProps> = ({ username, onExitToLeaderboard }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const velocityRef = useRef(new THREE.Vector3());
    const [strokes, setStrokes] = useState(0);
    const [gameState, setGameState] = useState("menu");
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const scoreSubmitted = useRef(false);

    const handleLevelSelect = (index: number) => {
        setCurrentLevelIndex(index);
        setStrokes(0);
        scoreSubmitted.current = false;
        setGameState("playing");
    };

    const saveScore = async (currentStrokes: number) => {
        if (scoreSubmitted.current) return;
        scoreSubmitted.current = true;
        const { error } = await supabase.from('Scores').insert([{ Username: username, Scores: currentStrokes, level: currentLevelIndex + 1 }]);
        if (error) console.error("Error saving score:", error);
    };

    const handleNextLevel = () => {
        const nextLevelIndex = currentLevelIndex + 1;
        if (nextLevelIndex < levelData.length) handleLevelSelect(nextLevelIndex);
        else onExitToLeaderboard();
    };

    const handleRetry = () => handleLevelSelect(currentLevelIndex);

    useEffect(() => {
        if (gameState === "success") {
            saveScore(strokes);
        }
    }, [gameState, strokes]);

    useEffect(() => {
        if (!mountRef.current || gameState !== "playing") return;

        const currentLevel = levelData[currentLevelIndex] as any;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xbfd1e5);
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        camera.position.set(0, 8, 14);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.innerHTML = "";
        mountRef.current.appendChild(renderer.domElement);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        // --- FIX: SET A TARGET FOR THE CAMERA ---
        controls.target.set(0, 0, 0);

        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7);
        scene.add(dirLight);

        const obstacles: { mesh: THREE.Mesh, type: string, data?: any }[] = [];
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });

        if (!currentLevel.useGravity) {
            const floorWidth = currentLevel.name === 'Challenge: The Gauntlet' ? 12 : 20;
            const floorDepth = currentLevel.name === 'Challenge: The Gauntlet' ? 40 : 20;
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(floorWidth, floorDepth), new THREE.MeshStandardMaterial({ color: 0x3a5f0b }));
            floor.rotation.x = -Math.PI / 2;
            scene.add(floor);
        } else {
            currentLevel.grounds?.forEach((g: any) => {
                const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(g.w, g.d), new THREE.MeshStandardMaterial({ color: 0x4A6D23 }));
                groundMesh.rotation.x = -Math.PI / 2;
                groundMesh.position.set(g.x, g.y, g.z);
                scene.add(groundMesh);
            });
        }

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

        currentLevel.ramps?.forEach((rampData: any) => {
            const rampGeo = new THREE.PlaneGeometry(4, 5, 20, 20);
            const pos = rampGeo.attributes.position as THREE.BufferAttribute;
            for (let i = 0; i < pos.count; i++) {
                const zPos = pos.getY(i);
                const t = (zPos + 2.5) / 5;
                pos.setZ(i, rampData.yStart * (1 - t) + rampData.yEnd * t);
            }
            pos.needsUpdate = true;
            rampGeo.computeVertexNormals();
            const rampMesh = new THREE.Mesh(rampGeo, new THREE.MeshStandardMaterial({ color: 0x8B4513, side: THREE.DoubleSide }));
            rampMesh.rotation.x = -Math.PI / 2;
            scene.add(rampMesh);
        });
        
        const createTrapMesh = (trap: any, color: any, y: number = 0.01) => {
            const trapMesh = new THREE.Mesh(new THREE.PlaneGeometry(trap.xMax - trap.xMin, trap.zMax - trap.zMin), new THREE.MeshStandardMaterial({ color }));
            trapMesh.rotation.x = -Math.PI / 2;
            trapMesh.position.set(trap.xMin + (trap.xMax - trap.xMin) / 2, y, trap.zMin + (trap.zMax - trap.zMin) / 2);
            scene.add(trapMesh);
        };
        if (currentLevel.sandTrap) createTrapMesh(currentLevel.sandTrap, 0xc2b280);
        if (currentLevel.water) createTrapMesh(currentLevel.water, 0x006994);

        currentLevel.walls?.forEach((w: any) => {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(w.w, w.h, w.d), wallMaterial);
            wall.position.set(w.x, w.h / 2 + (w.y || 0), w.z);
            scene.add(wall);
            obstacles.push({ mesh: wall, type: w.type });
        });

        const movingWallMeshes: THREE.Mesh[] = [];
        currentLevel.movingWalls?.forEach((w: any) => {
            const geo = new THREE.BoxGeometry(w.w, w.h, w.d);
            if (w.type === 'plank') geo.translate(0, -w.h / 2, 0);
            const mesh = new THREE.Mesh(geo, wallMaterial);
            mesh.position.set(w.pivot?.x || w.x, w.pivot?.y || (w.h / 2 + (w.y || 0)), w.pivot?.z || w.z);
            scene.add(mesh);
            obstacles.push({ mesh: mesh, type: w.type, data: w });
            movingWallMeshes.push(mesh);
        });

        currentLevel.rocks?.forEach((r: any) => {
            const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(r.size, 1), new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 }));
            rock.position.set(r.x, r.size / 2, r.z);
            scene.add(rock);
            obstacles.push({ mesh: rock, type: r.type });
        });

        const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 32), new THREE.MeshStandardMaterial({ color: 0x000000 }));
        hole.position.copy(currentLevel.holePos);
        scene.add(hole);
        
        const flagpole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 8), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
        flagpole.position.copy(currentLevel.holePos).add(new THREE.Vector3(0, 1.5, 0));
        scene.add(flagpole);
        const flag = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.6), new THREE.MeshStandardMaterial({ color: 0xff0000, side: THREE.DoubleSide }));
        flag.position.copy(flagpole.position).add(new THREE.Vector3(0.5, 1.2, 0));
        scene.add(flag);

        const ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_RADIUS, 32, 32), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        ball.position.copy(currentLevel.ballStart);
        scene.add(ball);

        const previewDots: THREE.Mesh[] = [];
        const dotGeom = new THREE.SphereGeometry(0.12, 8, 8);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        for (let i = 0; i < 15; i++) {
            const dot = new THREE.Mesh(dotGeom, dotMat);
            dot.visible = false;
            scene.add(dot);
            previewDots.push(dot);
        }

        let isDragging = false;
        const dragStart = new THREE.Vector2();
        const onMouseDown = (e: MouseEvent) => { if (velocityRef.current.lengthSq() < 0.001) { isDragging = true; controls.enabled = false; dragStart.set(e.clientX, e.clientY); } };
        
        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const dragEnd = new THREE.Vector2(e.clientX, e.clientY);
            const dragVector = new THREE.Vector2().subVectors(dragStart, dragEnd);
            let simVelocity = new THREE.Vector3(dragVector.x * 0.006, 0, dragVector.y * 0.006);
            let simPosition = ball.position.clone();
            previewDots.forEach((dot) => {
                dot.visible = true;
                for (let j = 0; j < 5; j++) {
                    simPosition.add(simVelocity);
                    simVelocity.multiplyScalar(currentLevel.friction);
                }
                dot.position.copy(simPosition);
            });
        };

        const onMouseUp = (e: MouseEvent) => {
            if (!isDragging) return;
            isDragging = false;
            controls.enabled = true;
            previewDots.forEach(dot => dot.visible = false);
            const dragEnd = new THREE.Vector2(e.clientX, e.clientY);
            const dragVector = new THREE.Vector2().subVectors(dragStart, dragEnd);
            velocityRef.current.set(dragVector.x * 0.006, 0, dragVector.y * 0.006);
            setStrokes((s) => s + 1);
            hitSound?.play();
        };

        renderer.domElement.addEventListener("mousedown", onMouseDown);
        renderer.domElement.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);

        let animationFrameId: number;
        function animate() {
            animationFrameId = requestAnimationFrame(animate);
            
            // --- FIX: ALWAYS UPDATE CONTROLS IN THE ANIMATION LOOP ---
            controls.update();

            if (currentLevel.useGravity) {
                velocityRef.current.y -= GRAVITY;
                ball.position.add(velocityRef.current);
                let onSurface = false;
                currentLevel.ramps?.forEach((ramp: any) => {
                    if (ball.position.x > ramp.xMin && ball.position.x < ramp.xMax && ball.position.z < ramp.zStart && ball.position.z > ramp.zEnd) {
                        const t = (ramp.zStart - ball.position.z) / (ramp.zStart - ramp.zEnd);
                        const rampY = ramp.yStart * (1 - t) + ramp.yEnd * t;
                        if (ball.position.y <= rampY + BALL_RADIUS) {
                            ball.position.y = rampY + BALL_RADIUS;
                            velocityRef.current.y = 0; onSurface = true;
                            const slopeAngle = Math.atan2(ramp.yEnd - ramp.yStart, ramp.zStart - ramp.zEnd);
                            velocityRef.current.z += GRAVITY * Math.sin(slopeAngle);
                        }
                    }
                });
                if (!onSurface) {
                    currentLevel.grounds?.forEach((ground: any) => {
                        if (ball.position.x > ground.x - ground.w / 2 && ball.position.x < ground.x + ground.w / 2 && ball.position.z > ground.z - ground.d / 2 && ball.position.z < ground.z + ground.d / 2 && ball.position.y <= ground.y + BALL_RADIUS) {
                            ball.position.y = ground.y + BALL_RADIUS;
                            velocityRef.current.y = 0; onSurface = true;
                        }
                    });
                }
                if (onSurface) {
                    velocityRef.current.x *= currentLevel.friction;
                    velocityRef.current.z *= currentLevel.friction;
                }
                if (ball.position.y < -20) {
                    ball.position.copy(currentLevel.ballStart);
                    velocityRef.current.set(0, 0, 0); setStrokes(s => s + 1);
                }
            } else {
                ball.position.add(velocityRef.current);
                let friction = currentLevel.friction;
                if (currentLevel.sandTrap && ball.position.x > currentLevel.sandTrap.xMin && ball.position.x < currentLevel.sandTrap.xMax && ball.position.z > currentLevel.sandTrap.zMin && ball.position.z < currentLevel.sandTrap.zMax) {
                    friction = currentLevel.sandTrap.friction;
                }
                velocityRef.current.multiplyScalar(friction);
                if (currentLevel.slope && ball.position.z > currentLevel.slope.zStart) {
                    velocityRef.current.add(currentLevel.slope.force);
                }
            }
            const time = Date.now();
            movingWallMeshes.forEach((mesh, index) => {
                const w = currentLevel.movingWalls[index];
                if (w.type === 'plank') {
                    mesh.rotation.z = Math.sin(time * w.speed + (w.offset || 0)) * w.range;
                } else if (w.axis === 'x') {
                    mesh.position.x = w.x + Math.sin(time * w.speed) * w.range;
                }
            });
            obstacles.forEach(obstacle => {
                const obstacleMesh = obstacle.mesh;
                const ballBox = new THREE.Box3().setFromObject(ball);
                const obstacleBox = new THREE.Box3().setFromObject(obstacleMesh);
                if (ballBox.intersectsBox(obstacleBox)) {
                    const overlap = ballBox.clone().intersect(obstacleBox);
                    const overlapSize = overlap.getSize(new THREE.Vector3());
                    if (overlapSize.x < overlapSize.z) {
                        const direction = ball.position.x > obstacleMesh.position.x ? 1 : -1;
                        ball.position.x += direction * overlapSize.x;
                        velocityRef.current.x *= -0.7;
                    } else {
                        const direction = ball.position.z > obstacleMesh.position.z ? 1 : -1;
                        ball.position.z += direction * overlapSize.z;
                        velocityRef.current.z *= -0.7;
                    }
                    collisionSound?.play();
                }
            });
            if (currentLevel.water && ball.position.x > currentLevel.water.xMin && ball.position.x < currentLevel.water.xMax && ball.position.z > currentLevel.water.zMin && ball.position.z < currentLevel.water.zMax) {
                waterSound?.play();
                ball.position.copy(currentLevel.ballStart);
                velocityRef.current.set(0, 0, 0);
                setStrokes(s => s + 1);
            }
            if (ball.position.distanceTo(hole.position) < 0.6 && velocityRef.current.length() < 0.05) {
                velocityRef.current.set(0, 0, 0);
                setGameState("success");
            }

            renderer.render(scene, camera);
        }
        animate();
        return () => {
            window.removeEventListener("mouseup", onMouseUp);
            renderer.domElement.removeEventListener("mousedown", onMouseDown);
            renderer.domElement.removeEventListener("mousemove", onMouseMove);
            cancelAnimationFrame(animationFrameId);
            if (mountRef.current) mountRef.current.innerHTML = "";
            renderer.dispose();
        };
    }, [gameState, currentLevelIndex]);

    const LevelSelectionMenu: FC<LevelSelectionProps> = ({ onSelectLevel }) => (
        <div className="menu-container">
            <div className="menu-box">
                <h1>Select a Level</h1>
                <div className="button-group">
                    {levelData.map((level, index) => (
                        <button key={index} onClick={() => onSelectLevel(index)}>{level.name}</button>
                    ))}
                </div>
            </div>
            <style jsx>{`
                .menu-container { display: flex; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(to bottom right, #1e293b, #0f172a); }
                .menu-box { text-align: center; }
                h1 { color: white; font-size: 3rem; font-weight: bold; margin-bottom: 2rem; }
                .button-group { display: flex; flex-direction: column; flex-wrap: wrap; justify-content: center; gap: 1rem; }
                button { padding: 1rem 2rem; background-color: #2563eb; border-radius: 0.5rem; color: white; transition: background-color 0.2s; border: none; cursor: pointer; font-size: 1.25rem; font-weight: bold; }
                button:hover { background-color: #1d4ed8; }
            `}</style>
        </div>
    );
    
    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
            {gameState === 'menu' && <LevelSelectionMenu onSelectLevel={handleLevelSelect} />}
            {(gameState === 'playing' || gameState === 'success') && (
                <>
                    <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
                    <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0, 0, 0, 0.6)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.75rem' }}>
                        <p style={{ fontWeight: 'bold', margin: 0 }}>{levelData[currentLevelIndex].name}</p>
                        <p style={{ margin: 0 }}>Strokes: {strokes} | Par: {levelData[currentLevelIndex].par}</p>
                    </div>
                    <button onClick={onExitToLeaderboard} style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 50, padding: '0.5rem 1rem', background: '#dc2626', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>
                        Exit to Menu
                    </button>
                </>
            )}
            {gameState === 'success' && (
                <SuccessScreen
                    strokes={strokes}
                    par={levelData[currentLevelIndex].par}
                    onNextLevel={handleNextLevel}
                    isLastLevel={currentLevelIndex === levelData.length - 1}
                    onExit={onExitToLeaderboard}
                    onRetry={handleRetry}
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
            if (!session) setView('auth');
        });

        return () => subscription.unsubscribe();
    }, []);
    
    const handleLogout = async () => {
        await supabase.auth.signOut();
        setView('auth');
    };

    if (!session) {
        return <Auth onLoginSuccess={() => setView('leaderboard')} />;
    }

    if (view === 'leaderboard') {
        return <Leaderboard onPlay={() => setView('game')} onLogout={handleLogout} />;
    }

    if (view === 'game') {
        return <Game username={session.user.email || 'Guest'} onExitToLeaderboard={() => setView('leaderboard')} />;
    }

    return <Leaderboard onPlay={() => setView('game')} onLogout={handleLogout} />;
}