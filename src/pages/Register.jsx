import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import axios from 'axios';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import Breadcrumbs from './Breadcrumbs';

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const googleUserData = location.state?.userData || {};
  const idToken = location.state?.idToken || '';
  console.log("ID Token recibido de Google:", idToken);
  console.log("Datos recibidos de Google:", googleUserData);

  const [formData, setFormData] = useState({
    firstName: googleUserData.firstName || '',
    lastName: googleUserData.lastName || '',
    email: googleUserData.email || '',
    password: '',
    confirmPassword: '',
    photo: googleUserData.photo || '',
    address: '',
    phone: '',
    idToken: idToken || ''
  });

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [preview, setPreview] = useState(formData.photo || "");

  useEffect(() => {
    const isDirty = Object.values(formData).some((field) => field !== '');
    setIsFormDirty(isDirty);
  }, [formData]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty]);

  const handleNavigation = (e) => {
    if (isFormDirty && !window.confirm('¿Estás seguro que deseas salir? Los datos ingresados se perderán.')) {
      e.preventDefault();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      alert("Solo se permiten imágenes JPG o PNG");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, photo: reader.result }));
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones básicas
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }

    try {
      if (!idToken) {
        // 🔹 Usuario manual
        if (!formData.password || !formData.confirmPassword) {
          setError('Debe ingresar y confirmar la contraseña');
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Las contraseñas no coinciden');
          return;
        }
        if (formData.password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          return;
        }

        // Registrar usuario manual en backend
        await axios.post(import.meta.env.VITE_API_URL + 'users', {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          photo: formData.photo || null,
          address: formData.address || "",
          phone: formData.phone || "",
        });

        // Login automático con Firebase
        const auth = getAuth();
        const userCredential = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const user = userCredential.user;
        const token = await user.getIdToken();

        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: `${formData.firstName} ${formData.lastName}`,
          photoURL: formData.photo || user.photoURL,
        };

        localStorage.setItem("token", token);
        sessionStorage.setItem("token", token);
        localStorage.setItem("usuario", JSON.stringify(userData));
        sessionStorage.setItem("usuario", JSON.stringify(userData));
      } else {
        // 🔹 Usuario de Google → solo guardar en la base de datos
        await axios.post(import.meta.env.VITE_API_URL + 'users', {
          idToken: formData.idToken,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          photo: formData.photo || null,
          address: formData.address || "",
          phone: formData.phone || "",
        });
      }

      // Redirigir al home
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error al registrar usuario");
    }
  };



  return (
    <div className="auth-page">
      <div className="auth-container">
        <Breadcrumbs items={[
          { label: 'Inicio', to: '/' },
          { label: 'Login', to: '/login' },
          { label: 'Registro' }
        ]} />
        <div className="text-center mb-4">
          <h2>Registro</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="mb-4">
            <label htmlFor="photoUpload" style={{ cursor: 'pointer' }}>
              <img
                src={preview || "https://static.vecteezy.com/system/resources/previews/007/407/996/non_2x/user-icon-person-icon-client-symbol-login-head-sign-icon-design-vector.jpg"}
                alt="avatar"
                className="rounded-circle"
                width="120"
                height="120"
                style={{ objectFit: 'cover', border: '3px solid #ccc' }}
              />
            </label>
            <input
              type="file"
              id="photoUpload"
              style={{ display: 'none' }}
              accept="image/jpeg,image/png"
              onChange={handleImageUpload}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Nombre */}
          <div className="mb-4">
            <label className="form-label"><i className="fas fa-user me-2"></i>Nombre</label>
            <input
              type="text"
              className="form-control bg-dark text-white border-secondary"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Ingrese su nombre"
            />
          </div>

          {/* Apellido */}
          <div className="mb-4">
            <label className="form-label"><i className="fas fa-user me-2"></i>Apellido</label>
            <input
              type="text"
              className="form-control bg-dark text-white border-secondary"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Ingrese su apellido"
            />
          </div>

          {/* Correo */}
          <div className="mb-4">
            <label className="form-label"><i className="fas fa-envelope me-2"></i>Correo Electrónico</label>
            <input
              type="email"
              className="form-control bg-dark text-white border-secondary"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ingrese su correo electrónico"
              readOnly={!!formData.idToken}
            />
          </div>

          {/* Contraseñas (solo si no viene de Google) */}
          {!formData.idToken && (
            <>
              <div className="mb-4 position-relative">
                <label className="form-label"><i className="fas fa-lock me-2"></i>Contraseña</label>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control bg-dark text-white border-secondary"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Ingrese su contraseña"
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ color: '#ccc', textDecoration: 'none' }}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>

              <div className="mb-4 position-relative">
                <label className="form-label"><i className="fas fa-lock me-2"></i>Confirmar Contraseña</label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control bg-dark text-white border-secondary"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirme su contraseña"
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ color: '#ccc', textDecoration: 'none' }}
                >
                  <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </>
          )}

          {/* Dirección */}
          <div className="mb-4">
            <label className="form-label"><i className="fas fa-home me-2"></i>Dirección</label>
            <input
              type="text"
              className="form-control bg-dark text-white border-secondary"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Ingrese su dirección"
            />
          </div>

          {/* Teléfono */}
          <div className="mb-4">
            <label className="form-label"><i className="fas fa-phone me-2"></i>Teléfono</label>
            <input
              type="text"
              className="form-control bg-dark text-white border-secondary"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Ingrese su número de teléfono"
            />
          </div>

          <div className="d-grid gap-2">
            <button type="submit" className="btn btn-primary">
              <i className="fas fa-user-plus me-2"></i>Registrarse
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="mb-2">¿Ya tienes una cuenta?</p>
          <Link to="/login" className="btn btn-outline-light" onClick={handleNavigation}>
            <i className="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
