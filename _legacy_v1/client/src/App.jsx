import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Library from './pages/Library';
import AdminUpload from './pages/AdminUpload';
import './App.css';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  
  return children;
};

// Navbar Component
const Navbar = () => {
   const { user, logout } = useAuth();
   return (
      <nav className="glass-panel" style={{
        position: 'fixed', 
        top: '20px', 
        left: '50%', 
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '1200px',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100
      }}>
        <div className="logo" style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(to right, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Sangtamizh Music
        </div>
        <div className="nav-links" style={{ display: 'flex', gap: '2rem' }}>
          <a href="/">Home</a>
          <a href="/library">Library</a>
          {user && user.role === 'admin' && <a href="/admin">Upload</a>}
          {user ? (
            <button onClick={logout} style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer'}}>Logout</button>
          ) : (
            <a href="/login">Login</a>
          )}
        </div>
      </nav>
   )
}

function App() {
  return (
    <div className="app-container">
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/library" element={<Library />} />
            <Route path="/admin" element={
              <PrivateRoute adminOnly={true}>
                <AdminUpload />
              </PrivateRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  )
}

export default App
