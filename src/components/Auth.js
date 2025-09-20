const Auth: FC<AuthProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(''); // Changed from 'email' to 'username'
  const [password, setPassword] = useState('');

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    // Automatically add the fake domain before sending to Supabase
    const email = username + '@email.com'; 

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
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
              type="text" // Changed from "email" to "text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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