import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../environments/environment';
import Breadcrumbs from './Breadcrumbs';

function Login() {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const navigate = useNavigate();

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
      // Llamada al backend
      const response = await axios.post(import.meta.env.VITE_API_URL + 'auth/login', {
        email: correo,
        password: clave,
      });

      const data = response.data;
      if (data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify({ uid: data.uid, email: data.email }));
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('usuario', JSON.stringify({ uid: data.uid, email: data.email }));

        navigate('/');
      } else {
        setError(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor');
    }
  };


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      // 1️⃣ Iniciar sesión con Google (Frontend)
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken(); // Obtener el token

      // 2️⃣ Enviar token al backend para validación
      const response = await axios.post(import.meta.env.VITE_API_URL + 'auth/login-google', {
        idToken, // Enviamos solo el token
      });

      const data = response.data;

      if (data.exists) {
        // 3️⃣ Si el usuario EXISTE → Guardamos sesión y redirigimos
        sessionStorage.setItem('token', data.token);
        localStorage.setItem('token', data.token);
        sessionStorage.setItem('usuario', JSON.stringify(data.session));
        localStorage.setItem('usuario', JSON.stringify(data.session));
        navigate('/');
      } else {
        sessionStorage.setItem('token', data.token);
        localStorage.setItem('token', data.token);
        sessionStorage.setItem('usuario', JSON.stringify(data.session));
        localStorage.setItem('usuario', JSON.stringify(data.session));
        navigate('/register', { state: { userData: data.session, idToken: data.token } });
      }

    } catch (err) {
      console.error(err);
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