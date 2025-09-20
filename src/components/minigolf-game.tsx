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

// --- LEVEL DATA (MERGED) ---
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
    ramps: [
      {
        xMin: -2, xMax: 2, zMin: -2, zMax: 2,
        yStart: 0, yEnd: 3, zStart: 2, zEnd: -2,
        mesh: { x: 0, y: 1.5, z: 0, w: 4, h: 0.2, d: 5, color: 0x4A6D23 }
      }
    ],
    walls: [
      { y: 0, type: 'wall', x: -4, z: 6, w: 0.5, h: 1, d: 8 }, { y: 0, type: 'wall', x: 4, z: 6, w: 0.5, h: 1, d: 8 },
      { y: 0, type: 'wall', x: 0, z: 10, w: 8, h: 1, d: 0.5 },
      { y: 3, type: 'wall', x: -4, z: -6, w: 0.5, h: 1, d: 8 }, { y: 3, type: 'wall', x: 4, z: -6, w: 0.5, h: 1, d: 8 },
      { y: 3, type: 'wall', x: 0, z: -10, w: 8, h: 1, d: 0.5 },
    ],
    movingWalls: [
      { type: 'wall', y: 3, x: 0, z: -6, w: 3, h: 2, d: 0.5, axis: 'x', range: 2.5, speed: 0.002 }
    ]
  },
  {
    name: 'Challenge: The Gauntlet',
    par: 6,
    ballStart: new THREE.Vector3(0, 0.4, -18),
    holePos: new THREE.Vector3(0, 0.05, 18),
    friction: 0.97,
    walls: [
      { type: 'wall', x: 0, z: -20, w: 12, h: 1, d: 0.5 },
      { type: 'wall', x: 0, z: 20, w: 12, h: 1, d: 0.5 },
      { type: 'wall', x: -6, z: 0, w: 0.5, h: 1, d: 40 },
      { type: 'wall', x: 6, z: 0, w: 0.5, h: 1, d: 40 },
      { type: 'wall', x: 0, z: -14, w: 6, h: 0.5, d: 0.5, y: 3.5 },
      { type: 'wall', x: -2.75, z: -14, w: 0.5, h: 4, d: 0.5 },
      { type: 'wall', x: 2.75, z: -14, w: 0.5, h: 4, d: 0.5 },
      { type: 'wall', x: 0, z: -4, w: 6, h: 0.5, d: 0.5, y: 3.5 },
      { type: 'wall', x: -2.75, z: -4, w: 0.5, h: 4, d: 0.5 },
      { type: 'wall', x: 2.75, z: -4, w: 0.5, h: 4, d: 0.5 },
      { type: 'wall', x: 0, z: 4, w: 6, h: 0.5, d: 0.5, y: 3.5 },
      { type: 'wall', x: -2.75, z: 4, w: 0.5, h: 4, d: 0.5 },
      { type: 'wall', x: 2.75, z: 4, w: 0.5, h: 4, d: 0.5 },
      { type: 'wall', x: 0, z: 14, w: 6, h: 0.5, d: 0.5, y: 3.5 },
      { type: 'wall', x: -2.75, z: 14, w: 0.5, h: 4, d: 0.5 },
      { type: 'wall', x: 2.75, z: 14, w: 0.5, h: 4, d: 0.5 },
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
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage("Login Failed: " + error.message);
    } else {
      onLoginSuccess();
    }
  };

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setMessage("Sign Up Failed: " + error.message);
    } else {
      setMessage('Confirmation email sent! Please check your inbox.');
      setIsSignUp(false);
      setEmail('');
      setPassword('');
    }
  };

  return (
    <div className="menu-container">
      <form className="auth-box" onSubmit={isSignUp ? handleSignUp : handleLogin}>
        <h1>CloneFest Minigolf</h1>
        {message && <p className="message">{message}</p>}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading}>
          {loading ? (isSignUp ? 'Creating...' : 'Logging In...') : (isSignUp ? 'Create Account' : 'Login')}
        </button>
      </form>
      <div className="button-group">
        <button onClick={() => setIsSignUp(!isSignUp)} className="toggle-btn" disabled={loading}>
          {isSignUp ? 'Back to Login' : 'Create an Account'}
        </button>
      </div>
      <style jsx>{`
                .menu-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(to bottom right, #1e293b, #0f172a); color: white; }
                .auth-box { text-align: center; background-color: rgba(0,0,0,0.3); padding: 2.5rem; border-radius: 1rem; display: flex; flex-direction: column; gap: 1rem; width: 100%; max-width: 400px; }
                h1 { font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; }
                .message { color: yellow; font-size: 1rem; margin-top: -0.5rem; }
                input { padding: 0.75rem 1rem; border-radius: 0.5rem; border: 1px solid #475569; background-color: #1e293b; color: white; font-size: 1rem; }
                button { padding: 0.75rem 1rem; background-color: #2563eb; border-radius: 0.5rem; transition: background-color 0.2s; border: none; cursor: pointer; font-size: 1.1rem; font-weight: bold; color: white; margin-top: 0.5rem; }
                button:hover { background-color: #1d4ed8; }
                button:disabled { background-color: #94a3b8; cursor: not-allowed; }
                .button-group { margin-top: 1rem; }
                .toggle-btn { background: none; border: none; text-decoration: underline; font-weight: normal; font-size: 1rem; color: #94a3b8; cursor: pointer; }
                .toggle-btn:hover { color: white; }
            `}</style>
    </div>
  );
};

const Leaderboard: FC<LeaderboardProps> = ({ onPlay, onLogout }) => {
  // This component is unchanged
  const [scores, setScores] = useState<{ Username: string, total_points: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const mountRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 4, 10);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(25, 25), new THREE.MeshStandardMaterial({ color: 0x3a5f0b }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshStandardMaterial({ color: 0x3366ff }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(6, 0.01, 2);
    scene.add(water);
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshStandardMaterial({ color: 0xc2b280 }));
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(-6, 0.01, -2);
    scene.add(sand);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const slidingWall = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 0.5), wallMaterial);
    slidingWall.position.set(0, 0.5, -4);
    scene.add(slidingWall);
    const plankGeo = new THREE.BoxGeometry(0.4, 3, 0.4);
    plankGeo.translate(0, -1.5, 0);
    const plank = new THREE.Mesh(plankGeo, wallMaterial);
    plank.position.set(0, 3, 4);
    scene.add(plank);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    ball.position.set(0, 0.4, 0);
    scene.add(ball);
    const handleResize = () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };
    window.addEventListener('resize', handleResize);
    let animationFrameId: number;
    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      const time = Date.now();
      slidingWall.position.x = Math.sin(time * 0.001) * 4;
      plank.rotation.z = Math.sin(time * 0.002) * (Math.PI / 4);
      ball.position.z = Math.sin(time * 0.0005) * 6;
      renderer.render(scene, camera);
    }
    animate();
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement) { renderer.dispose(); }
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div ref={mountRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}></div>
      <div style={{ position: 'absolute', top: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10, backgroundColor: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(8px)', padding: '1rem 2rem', borderRadius: '1rem', textAlign: 'center', width: '90%', maxWidth: '700px', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Leaderboard</h1>
        <div style={{ maxHeight: '40vh', overflowY: 'auto', marginBottom: '1rem' }}>
          {loading ? <p>Loading Scores...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={{ borderBottom: '2px solid #475569', fontSize: '1rem', padding: '0.5rem 1rem' }}>Rank</th><th style={{ borderBottom: '2px solid #475569', fontSize: '1rem', padding: '0.5rem 1rem' }}>Player</th><th style={{ borderBottom: '2px solid #475569', fontSize: '1rem', padding: '0.5rem 1rem' }}>Total Points</th></tr></thead>
              <tbody>
                {scores.map((score, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>{index + 1}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>{score.Username}</td>
                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>{score.total_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={onPlay} style={{ padding: '0.5rem 1.5rem', backgroundColor: '#2563eb', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>Play Game</button>
          <button onClick={onLogout} style={{ padding: '0.5rem 1.5rem', backgroundColor: '#94a3b8', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>Logout</button>
        </div>
      </div>
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
  const [levelComplete, setLevelComplete] = useState(false);

  const handleLevelSelect = (index: number) => {
    setCurrentLevelIndex(index);
    setStrokes(0);
    setLevelComplete(false);
    setGameState("playing");
  };

  const saveScore = async (currentStrokes: number) => {
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
    if (gameState === "success" && !levelComplete) {
      setLevelComplete(true);
      saveScore(strokes);
    }
  }, [gameState, strokes, levelComplete]);

  useEffect(() => {
    if (!mountRef.current || gameState !== "playing") return;

    const textureLoader = new THREE.TextureLoader();
    const grassTexture = textureLoader.load('/grass.jpg');
    const sandTexture = textureLoader.load('/sand.jpg');
    const waterTexture = textureLoader.load('/water.jpg');

    const currentLevel = levelData[currentLevelIndex] as any;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const oppositeViewLevels = [0, 1, 3, 5];
    if (oppositeViewLevels.includes(currentLevelIndex)) {
      camera.position.set(0, 8, -14);
    } else {
      camera.position.set(0, 8, 14);
    }
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const isLongLevel = [4, 5].includes(currentLevelIndex);
    const floorWidth = isLongLevel ? 12 : 20;
    const floorDepth = isLongLevel ? 40 : 20;

    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(floorWidth / 4, floorDepth / 4);
    const floorMaterial = new THREE.MeshStandardMaterial({ map: grassTexture });

    if (!currentLevel.useGravity) {
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(floorWidth, floorDepth), floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      scene.add(floor);
    } else {
      if (currentLevel.grounds) {
        currentLevel.grounds.forEach((g: any) => {
          const groundTexture = textureLoader.load('/grass.jpg');
          groundTexture.wrapS = THREE.RepeatWrapping;
          groundTexture.wrapT = THREE.RepeatWrapping;
          groundTexture.repeat.set(g.w / 4, g.d / 4);
          const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(g.w, g.d), new THREE.MeshStandardMaterial({ map: groundTexture }));
          groundMesh.rotation.x = -Math.PI / 2;
          groundMesh.position.set(g.x, g.y, g.z);
          scene.add(groundMesh);
        });
      }
      if (currentLevel.ramps) {
        currentLevel.ramps.forEach((rampData: any) => {
          const width = rampData.mesh?.w || 4;
          const depth = rampData.mesh?.d || 5;
          const height = rampData.yEnd - rampData.yStart;
          const segmentsW = 20;
          const segmentsD = 40;
          const geometry = new THREE.PlaneGeometry(width, depth, segmentsW, segmentsD);
          const pos = geometry.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < pos.count; i++) {
            const z = pos.getY(i);
            const t = (z + depth / 2) / depth;
            const baseY = rampData.yStart + (rampData.yEnd - rampData.yStart) * t;
            const curveOffset = -height * 1 * (t - t * t);
            pos.setZ(i, baseY + curveOffset);
          }
          pos.needsUpdate = true;
          geometry.computeVertexNormals();
          const material = new THREE.MeshStandardMaterial({ color: rampData.mesh?.color || 0x8B4513, side: THREE.DoubleSide, });
          const rampMesh = new THREE.Mesh(geometry, material);
          rampMesh.rotation.x = -Math.PI / 2;
          rampMesh.position.set(rampData.mesh?.x || 0, (rampData.mesh?.y || 0) - 1.5, (rampData.mesh?.z || 0));
          scene.add(rampMesh);
        });
      }
    }

    const createTrapMesh = (trap: any, texture: THREE.Texture) => {
      const trapWidth = trap.xMax - trap.xMin;
      const trapDepth = trap.zMax - trap.zMin;

      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(trapWidth / 2, trapDepth / 2);

      const trapGeo = new THREE.PlaneGeometry(trapWidth, trapDepth);
      const trapMat = new THREE.MeshStandardMaterial({ map: texture });
      const trapMesh = new THREE.Mesh(trapGeo, trapMat);
      trapMesh.rotation.x = -Math.PI / 2;
      trapMesh.position.set(trap.xMin + trapWidth / 2, 0.01, trap.zMin + trapDepth / 2);
      scene.add(trapMesh);
    };
    if (currentLevel.sandTrap) createTrapMesh(currentLevel.sandTrap, sandTexture.clone());
    if (currentLevel.water) createTrapMesh(currentLevel.water, waterTexture.clone());
    if (currentLevel.slope) {
      const slope = currentLevel.slope;
      const slopeDepth = 10 - slope.zStart;
      const slopeGeo = new THREE.PlaneGeometry(20, slopeDepth);
      const slopeMat = new THREE.MeshStandardMaterial({ color: 0x2e4b09 }); // Slope remains a dark green color
      const slopeMesh = new THREE.Mesh(slopeGeo, slopeMat);
      slopeMesh.rotation.x = -Math.PI / 2;
      slopeMesh.position.set(0, 0.015, slope.zStart + slopeDepth / 2);
      scene.add(slopeMesh);
    }

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const obstacles: { mesh: THREE.Mesh, type: string, data?: any }[] = [];
    if (currentLevel.walls) {
      currentLevel.walls.forEach((w: any) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(w.w, w.h, w.d), wallMaterial);
        wall.position.set(w.x, w.h / 2 + (w.y || 0), w.z);
        scene.add(wall);
        obstacles.push({ mesh: wall, type: w.type });
      });
    }

    const movingWallMeshes: THREE.Mesh[] = [];
    if (currentLevel.movingWalls) {
      currentLevel.movingWalls.forEach((w: any) => {
        const geo = new THREE.BoxGeometry(w.w, w.h, w.d);
        if (w.type === 'plank') { geo.translate(0, -w.h / 2, 0); }
        const mesh = new THREE.Mesh(geo, wallMaterial);
        if (w.pivot) { mesh.position.set(w.pivot.x, w.pivot.y, w.pivot.z); }
        else { mesh.position.set(w.x, w.h / 2 + (w.y || 0), w.z); }
        scene.add(mesh);
        obstacles.push({ mesh: mesh, type: w.type, data: w });
        movingWallMeshes.push(mesh);
      });
    }

    if (currentLevel.rocks) {
      const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
      currentLevel.rocks.forEach((r: any) => {
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
    const ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_RADIUS, 32, 32), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    ball.position.copy(currentLevel.ballStart);
    scene.add(ball);

    const previewDots: THREE.Mesh[] = [];
    const dotGeom = new THREE.SphereGeometry(0.1, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    for (let i = 0; i < 10; i++) { const dot = new THREE.Mesh(dotGeom, dotMat); dot.visible = false; scene.add(dot); previewDots.push(dot); }
    let isDragging = false;
    let dragStart = new THREE.Vector2();

    const INTERACTION_RADIUS = 100;

    function onMouseDown(e: MouseEvent) {
      if (velocityRef.current.lengthSq() > 0.001) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const ballScreenPos = ball.position.clone().project(camera);
      const ballX = rect.left + ((ballScreenPos.x + 1) / 2) * rect.width;
      const ballY = rect.top + ((-ballScreenPos.y + 1) / 2) * rect.height;
      const distance = Math.sqrt(Math.pow(e.clientX - ballX, 2) + Math.pow(e.clientY - ballY, 2));
      if (distance < INTERACTION_RADIUS) {
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
      hitSound?.play();
      setStrokes((s) => s + 1);
    }

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    let animationFrameId: number;
    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      const ballIsMoving = velocityRef.current.lengthSq() > 0.0001;
      if (ballIsMoving) {
        controls.enabled = false;
        const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
        const newTarget = new THREE.Vector3(ball.position.x, 0, ball.position.z);
        const newCameraPosition = newTarget.clone().add(offset);
        controls.target.lerp(newTarget, 0.08);
        camera.position.lerp(newCameraPosition, 0.08);
      } else {
        if (!isDragging) {
          controls.enabled = true;
        }
      }
      if (currentLevel.useGravity) {
        velocityRef.current.y -= GRAVITY;
        ball.position.add(velocityRef.current);
        let onSurface = false;
        if (currentLevel.ramps) {
          currentLevel.ramps.forEach((ramp: any) => {
            if (ball.position.x > ramp.xMin && ball.position.x < ramp.xMax && ball.position.z < ramp.zStart && ball.position.z > ramp.zEnd) {
              const t = (ramp.zStart - ball.position.z) / (ramp.zStart - ramp.zEnd);
              const height = ramp.yEnd - ramp.yStart;
              const baseY = ramp.yStart + height * t;
              const curveFactor = 1;
              const rampYCurved = baseY - height * curveFactor * (t - t * t);
              const surfaceY = rampYCurved + BALL_RADIUS;
              if (ball.position.y <= surfaceY) {
                ball.position.y = surfaceY;
                velocityRef.current.y = 0;
                onSurface = true;
                const length = Math.abs(ramp.zStart - ramp.zEnd);
                const baseAngle = Math.atan2(height, length);
                const slopeGravity = GRAVITY * Math.sin(baseAngle);
                velocityRef.current.z += slopeGravity;
              }
            }
          });
        }
        if (!onSurface && currentLevel.grounds) {
          currentLevel.grounds.forEach((ground: any) => {
            const groundTop = ground.y + BALL_RADIUS;
            if (ball.position.x > ground.x - ground.w / 2 && ball.position.x < ground.x + ground.w / 2 && ball.position.z > ground.z - ground.d / 2 && ball.position.z < ground.z + ground.d / 2 && ball.position.y <= groundTop) {
              ball.position.y = groundTop;
              velocityRef.current.y = 0;
              onSurface = true;
            }
          });
        }
        if (onSurface) {
          velocityRef.current.x *= currentLevel.friction;
          velocityRef.current.z *= currentLevel.friction;
        }
        if (ball.position.y < -20) {
          ball.position.copy(currentLevel.ballStart);
          velocityRef.current.set(0, 0, 0);
          setStrokes(s => s + 1);
        }
      } else {
        ball.position.add(velocityRef.current);
        let friction = currentLevel.friction;
        if (currentLevel.sandTrap) {
          const trap = currentLevel.sandTrap;
          if (ball.position.x > trap.xMin && ball.position.x < trap.xMax && ball.position.z > trap.zMin && ball.position.z < trap.zMax) {
            friction = trap.friction;
          }
        }
        velocityRef.current.multiplyScalar(friction);
        if (currentLevel.slope) {
          if (ball.position.z > currentLevel.slope.zStart && ball.position.z < 10) {
            velocityRef.current.add(currentLevel.slope.force);
          }
        }
      }

      if (currentLevel.movingWalls) {
        const time = Date.now();
        currentLevel.movingWalls.forEach((wallData: any, index: number) => {
          const wallMesh = movingWallMeshes[index];
          if (wallData.type === 'plank' && wallData.axis === 'z') {
            const offset = wallData.offset || 0;
            wallMesh.rotation.z = Math.sin(time * wallData.speed + offset) * wallData.range;
          } else if (wallData.axis === 'x') {
            const direction = wallData.direction || 1;
            wallMesh.position.x = wallData.x + direction * Math.sin(time * wallData.speed) * wallData.range;
          }
          wallMesh.updateMatrixWorld();
        });
      }

      let collidingObstacle: THREE.Object3D | null = null;
      let collisionDetectedThisFrame = false;
      obstacles.forEach(obstacle => {
        const obstacleMesh = obstacle.mesh;
        if (obstacle.type === 'plank') {
          const plankData = obstacle.data;
          const inverseMatrix = obstacleMesh.matrixWorld.clone().invert();
          const localBallPos = ball.position.clone().applyMatrix4(inverseMatrix);
          const localPlankBox = new THREE.Box3(
            new THREE.Vector3(-plankData.w / 2, -plankData.h, -plankData.d / 2),
            new THREE.Vector3(plankData.w / 2, 0, plankData.d / 2)
          );
          const localBallSphere = new THREE.Sphere(localBallPos, BALL_RADIUS);
          if (localPlankBox.intersectsSphere(localBallSphere)) {
            const closestPoint = localPlankBox.clampPoint(localBallPos, new THREE.Vector3());
            const localNormal = localBallPos.sub(closestPoint).normalize();
            const worldNormal = localNormal.clone().transformDirection(obstacleMesh.matrixWorld);

            worldNormal.y = 0;
            worldNormal.normalize();

            velocityRef.current.reflect(worldNormal);
            velocityRef.current.multiplyScalar(0.7);
            velocityRef.current.y = 0;

            ball.position.add(worldNormal.multiplyScalar(0.05));
            collisionDetectedThisFrame = true;
            if (collidingObstacle !== obstacleMesh) {
              collisionSound?.play();
              collidingObstacle = obstacleMesh;
            }
          }
        } else {
          const obstacleBox = new THREE.Box3().setFromObject(obstacleMesh);
          const ballBox = new THREE.Box3().setFromObject(ball);
          if (obstacleBox.intersectsBox(ballBox)) {
            collisionDetectedThisFrame = true;
            if (collidingObstacle !== obstacleMesh) {
              if (obstacle.type === 'wall') hitSound?.play();
              else if (obstacle.type === 'rock') collisionSound?.play();
              collidingObstacle = obstacleMesh;
            }
            const overlap = ballBox.clone().intersect(obstacleBox);
            const overlapSize = overlap.getSize(new THREE.Vector3());
            if (overlapSize.x < overlapSize.z) {
              velocityRef.current.x *= -0.7;
              ball.position.x += (ball.position.x > obstacleMesh.position.x ? 1 : -1) * overlapSize.x;
            } else {
              velocityRef.current.z *= -0.7;
              ball.position.z += (ball.position.z > obstacleMesh.position.z ? 1 : -1) * overlapSize.z;
            }
          }
        }
      });
      if (!collisionDetectedThisFrame) { collidingObstacle = null; }

      if (currentLevel.water) {
        const water = currentLevel.water;
        if (ball.position.x > water.xMin && ball.position.x < water.xMax && ball.position.z > water.zMin && ball.position.z < water.zMax) {
          waterSound?.play();
          ball.position.copy(currentLevel.ballStart);
          velocityRef.current.set(0, 0, 0);
          setStrokes(s => s + 1);
        }
      }

      if (!levelComplete && ball.position.distanceTo(hole.position) < 0.6 && velocityRef.current.length() < 0.05) {
        successSound?.play();
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
          <div style={{
            position: 'absolute', top: '1rem', left: '1rem',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '0.75rem 1.25rem',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
          }}>
            <p style={{ fontWeight: 'bold', margin: 0, fontSize: '1.1rem' }}>{levelData[currentLevelIndex].name}</p>
            <p style={{ margin: '0.25rem 0' }}>Strokes: {strokes} | Par: {levelData[currentLevelIndex].par}</p>
            {currentLevelIndex === 0 && (
              <p style={{ margin: 0, marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.8, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.5rem' }}>
                Left Click: Rotate | Right Click: Pan | Scroll: Zoom
              </p>
            )}
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

  if (view === 'auth') {
    return <Auth onLoginSuccess={() => setView('leaderboard')} />;
  }

  if (view === 'leaderboard') {
    return <Leaderboard onPlay={() => setView('game')} onLogout={handleLogout} />;
  }

  if (view === 'game') {
    return <Game username={session?.user.email || 'Guest'} onExitToLeaderboard={() => setView('leaderboard')} />;
  }

  return <Auth onLoginSuccess={() => setView('leaderboard')} />;
}