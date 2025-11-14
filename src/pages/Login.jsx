import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../environments/environment';
import Breadcrumbs from './Breadcrumbs';
import { useAuth } from '../context/AuthContext.jsx';

function Login() {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // Verificar si el formulario ha sido modificado
    if (correo || clave) {
      setIsFormDirty(true);
    } else {
      setIsFormDirty(false);
    }
  }, [correo, clave]);

  // Función para manejar la navegación
  const handleNavigation = (e) => {
    if (isFormDirty) {
      const confirmacion = window.confirm('¿Estás seguro que deseas salir? Los datos ingresados se perderán.');
      if (!confirmacion) {
        e.preventDefault();
      }
    }
  };

  // Agregar el evento beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isFormDirty]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!correo || !clave) {
      setError('Por favor complete todos los campos');
      return;
    }

    try {
      const base = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
      const url = `${base}/auth/login`;
      const { data, status } = await axios.post(url, { email: correo, password: clave });

      if (data?.user) {
        localStorage.setItem('token', data.user.idToken);
        sessionStorage.setItem('token', data.user.idToken);
        const sessionUser = { uid: data.user.uid, email: data.user.email, photo: data.user.photo || null };
        localStorage.setItem('usuario', JSON.stringify(sessionUser));
        sessionStorage.setItem('usuario', JSON.stringify(sessionUser));
        login?.(sessionUser);
        console.log('[Login email] OK status:', status, 'uid:', data.user.uid);
        navigate('/');
      } else {
        setError(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      console.error('[Login email] error: status=', err.response?.status, 'data=', err.response?.data, 'msg=', err.message);
      setError('Error de conexión con el servidor');
    }
  };


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Eliminado: useEffect con getRedirectResult (flujo de redirect)
  const handleGoogleLogin = async () => {
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const base = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
      const url = `${base}/auth/login-google`;
      const { data, status } = await axios.post(url, { idToken });

      const sessionUser = data?.session;
      if (!sessionUser) throw new Error('Respuesta inválida del servidor');

      console.log('[Login Google - popup] OK status:', status, 'uid:', sessionUser?.uid);

      if (data.exists) {
        // Usuario ya existe -> activar sesión
        localStorage.setItem('token', data.token);
        sessionStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(sessionUser));
        sessionStorage.setItem('usuario', JSON.stringify(sessionUser));
        login?.(sessionUser);
        navigate('/');
      } else {
        // Usuario NO existe -> NO activar sesión aún; ir a registro
        // Limpia cualquier sesión previa por seguridad
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('usuario');
        sessionStorage.removeItem('usuario');
        navigate('/register', { state: { userData: sessionUser, idToken } });
      }
    } catch (err) {
      if (err?.code === 'auth/popup-closed-by-user') {
        console.warn('[Login Google] popup cerrado por el usuario');
        return;
      }
      console.error('[Login Google] error:', err);
      setError('No se pudo iniciar sesión con Google');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Breadcrumbs items={[

          { label: 'Inicio', to: '/' },
          { label: 'Iniciar Sesión' }
        ]} />
        <div className="text-center mb-4">
          <h2>Iniciar Sesión</h2>
          {error && <div className="alert alert-danger">{error}</div>}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="correo" className="form-label">
              <i className="fas fa-envelope me-2"></i>
              Correo Electrónico
            </label>
            <input
              type="email"
              className="form-control bg-dark text-white border-secondary"
              id="correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Ingrese su correo electrónico"
            />
          </div>

          <div className="mb-4 position-relative">
            <label htmlFor="clave" className="form-label">
              <i className="fas fa-lock me-2"></i>
              Contraseña
            </label>
            <input
              type={showPassword ? "text" : "password"}
              className="form-control bg-dark text-white border-secondary"
              id="clave"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="Ingrese su contraseña"
            />
            <button
              type="button"
              className="btn btn-link position-absolute end-0 translate-middle-y"
              onClick={togglePasswordVisibility}
              style={{ color: '#ccc', textDecoration: 'none', top: '58px' }}
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>

          <div className="d-grid gap-2">
            <button type="submit" className="btn btn-primary">
              <i className="fas fa-sign-in-alt me-2"></i>
              Iniciar Sesión
            </button>
          </div>
        </form>
          <div className="d-grid gap-2" style={{ paddingTop: '8px' }}>
            <button type="button" className="btn btn-primary" onClick={handleGoogleLogin}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-google" viewBox="0 0 16 16">
                    <path d="M15.545 6.558a9.4 9.4 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.7 7.7 0 0 1 5.352 2.082l-2.284 2.284A4.35 4.35 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.8 4.8 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.7 3.7 0 0 0 1.599-2.431H8v-3.08z"/>
                </svg>
                Iniciar sesión con Google
            </button>
          </div>

        <div className="text-center mt-4">
          <p className="mb-2">¿No tienes una cuenta?</p>
          <Link to="/register" className="btn btn-outline-light" onClick={handleNavigation}>
            <i className="fas fa-user-plus me-2"></i>
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
