import { useEffect, useMemo, useState, useRef } from 'react';
import axios from 'axios';
import Breadcrumbs from './Breadcrumbs';
import { useAuth } from '../context/AuthContext.jsx';
import { auth, googleProvider } from '../environments/environment';
import { 
  EmailAuthProvider, 
  signInWithEmailAndPassword, 
  linkWithPopup, 
  linkWithCredential, 
  onAuthStateChanged
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function Perfil() {
  const { usuario } = useAuth();
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');

  // Perfil desde backend
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ 
    firstName: '', 
    lastName: '', 
    address: '', 
    phone: '',
    photo: '' 
  });

  // Vincular correo/clave (modal)
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [emailLink, setEmailLink] = useState(usuario?.email || '');
  const [passwordLink, setPasswordLink] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Reautenticación para vincular Google si no hay currentUser
  const [reauthEmail, setReauthEmail] = useState(usuario?.email || '');
  const [reauthPassword, setReauthPassword] = useState('');

  // Providers actuales con estado + reload para reflejar cambios tras vincular
  const [providers, setProviders] = useState([]);
  const hasGoogleProvider = providers.includes('google.com');
  const hasPasswordProvider = providers.includes('password');

  // Avatar
  const AVATAR_SIZE = 920;
  const FALLBACK_AVATAR = "https://static.vecteezy.com/system/resources/previews/007/407/996/non_2x/user-icon-person-icon-client-symbol-login-head-sign-icon-design-vector.jpg";

  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  const refreshProviders = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const ids = (auth.currentUser.providerData || []).map(p => p.providerId);
      setProviders(ids);
    } else {
      setProviders([]);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {
      refreshProviders();
      // No sobrescribir avatar con la foto de Google; mantenemos la del backend/estado.
      // Antes: setAvatarUrl(auth.currentUser?.photoURL || usuario?.photo || FALLBACK_AVATAR);
    });
    refreshProviders();
    return () => unsub();
  }, []);

  // Cargar perfil desde API (prioriza auth.currentUser para evitar datos viejos)
  useEffect(() => {
    const uid = auth.currentUser?.uid || usuario?.uid || null;
    if (!uid) return;
    
    const loadProfile = async () => {
      try {
        const base = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
        const { data } = await axios.get(`${base}/users/${uid}`);
        setProfile(data.user);
        setEditForm({
          firstName: data.user?.firstName || '',
          lastName: data.user?.lastName || '',
          address: data.user?.address || '',
          phone: data.user?.phone || '',
          photo: data.user?.photo || ''
        });

        const googlePhoto = auth.currentUser?.photoURL || null;
        const isGooglePhoto = !!googlePhoto && /googleusercontent|gstatic|lh3\.googleusercontent\.com/i.test(googlePhoto);

        // CAMBIO: primero BD, luego Google, luego fallback
        setAvatarUrl(data.user?.photo || (isGooglePhoto ? googlePhoto : FALLBACK_AVATAR));
      } catch (e) {
        console.warn('No se pudo cargar perfil:', e.response?.data || e.message);
      }
    };

    loadProfile();
  }, [usuario?.uid, auth.currentUser?.uid]);

  // Mantener emails y avatar del modal sincronizados con usuario
  useEffect(() => {
    const googlePhoto = auth.currentUser?.photoURL || null;
    const isGooglePhoto = !!googlePhoto && /googleusercontent|gstatic|lh3\.googleusercontent\.com/i.test(googlePhoto);

    setEmailLink(prev => prev || usuario?.email || '');
    setReauthEmail(prev => prev || usuario?.email || '');

    // CAMBIO: mantener prioridad BD del contexto; si no, usar Google; si no, fallback
    setAvatarUrl(prev => prev || (usuario?.photo || (isGooglePhoto ? googlePhoto : FALLBACK_AVATAR)));
  }, [usuario?.email, usuario?.photo]);

  const syncBackendUser = async () => {
    try {
      const idToken = auth.currentUser ? 
        await auth.currentUser.getIdToken() : 
        (localStorage.getItem('token') || sessionStorage.getItem('token') || '');
      
      const base = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
      const url = `${base}/users`;
      
      await axios.post(url, {
        idToken: idToken || undefined,
        email: auth.currentUser?.email || usuario?.email,
        firstName: usuario?.firstName || '',
        lastName: usuario?.lastName || '',
        photo: auth.currentUser?.photoURL || usuario?.photo || null,
      });
    } catch (e) {
      console.warn('Sync backend user failed (continuo igual):', e.response?.data || e.message);
    }
  };

  const ensureEmailSession = async () => {
    if (auth.currentUser) return;
    if (!reauthEmail || !reauthPassword) {
      throw new Error('Ingresa correo y contraseña para reautenticar.');
    }
    const credUser = await signInWithEmailAndPassword(auth, reauthEmail, reauthPassword);
    const token = await credUser.user.getIdToken();
    localStorage.setItem('token', token);
    sessionStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify({ 
      uid: credUser.user.uid, 
      email: credUser.user.email, 
      name: credUser.user.displayName, 
      photo: credUser.user.photoURL 
    }));
    sessionStorage.setItem('usuario', JSON.stringify({ 
      uid: credUser.user.uid, 
      email: credUser.user.email, 
      name: credUser.user.displayName, 
      photo: credUser.user.photoURL 
    }));
  };

  // Vincular Google
  const handleLinkGoogle = async () => {
    setError('');
    setStatusMsg('');
    try {
      // Asegurar sesión Firebase (email/clave) si no hay currentUser
      await ensureEmailSession();

      await linkWithPopup(auth.currentUser, googleProvider);

      // Actualizar storage y backend
      const token = await auth.currentUser.getIdToken();
      localStorage.setItem('token', token);
      sessionStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify({ 
        uid: auth.currentUser.uid, 
        email: auth.currentUser.email, 
        name: auth.currentUser.displayName, 
        photo: auth.currentUser.photoURL 
      }));
      sessionStorage.setItem('usuario', JSON.stringify({ 
        uid: auth.currentUser.uid, 
        email: auth.currentUser.email, 
        name: auth.currentUser.displayName, 
        photo: auth.currentUser.photoURL 
      }));

      await syncBackendUser();
      await refreshProviders();
      setStatusMsg('Cuenta vinculada: ahora también puedes iniciar sesión con Google.');
    } catch (err) {
      console.error('Link Google error:', err);
      // Si ya está vinculado, refrescar para reflejarlo
      if (err?.code === 'auth/provider-already-linked') {
        await refreshProviders();
      }
      setError(err.code === 'auth/provider-already-linked'
        ? 'Google ya está vinculado.'
        : (err.message || 'No se pudo vincular Google'));
    }
  };

  // Vincular correo/clave (modal)
  const handleLinkEmailPassword = async (e) => {
    e.preventDefault();
    setError('');
    setStatusMsg('');
    try {
      if (!auth.currentUser) {
        throw new Error('Primero inicia sesión con Google para vincular correo/clave.');
      }
      if (!emailLink || !passwordLink) {
        throw new Error('Ingresa correo y contraseña.');
      }
      const cred = EmailAuthProvider.credential(emailLink, passwordLink);
      await linkWithCredential(auth.currentUser, cred);
      
      const token = await auth.currentUser.getIdToken();
      localStorage.setItem('token', token);
      sessionStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify({
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        name: auth.currentUser.displayName,
        photo: auth.currentUser.photoURL
      }));
      sessionStorage.setItem('usuario', JSON.stringify({
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        name: auth.currentUser.displayName,
        photo: auth.currentUser.photoURL
      }));
      
      await syncBackendUser();
      await refreshProviders();
      setStatusMsg('Cuenta vinculada: ahora también puedes iniciar sesión con correo/clave.');
      setShowLinkModal(false);
    } catch (err) {
      console.error('Link email/clave error:', err);
      if (err?.code === 'auth/provider-already-linked') {
        await refreshProviders();
      }
      setError(err.message || 'No se pudo vincular correo/clave');
    }
  };

  // Editar perfil (inline)
  const handleSaveProfile = async () => {
    try {
      const uid = auth.currentUser?.uid || usuario?.uid;
      const base = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
      const { data } = await axios.put(`${base}/users/${uid}`, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        address: editForm.address,
        phone: editForm.phone,
        photo: editForm.photo ?? profile?.photo ?? null,
      });
      setProfile(data.user);
      setAvatarUrl(data.user?.photo || avatarUrl);

      // Refrescar usuario en contexto y storage para que NavBar vea la nueva foto
      const updatedUser = {
        uid: uid,
        email: data.user?.email || usuario?.email,
        displayName: `${data.user?.firstName || ''} ${data.user?.lastName || ''}`.trim(),
        photo: data.user?.photo || usuario?.photo || null,
      };
      login(updatedUser);
      localStorage.setItem('usuario', JSON.stringify(updatedUser));
      sessionStorage.setItem('usuario', JSON.stringify(updatedUser));

      setEditing(false);
      setStatusMsg('Perfil actualizado correctamente.');
    } catch (err) {
      console.error('Update perfil error:', err);
      setError(err.response?.data?.error || err.message || 'No se pudo actualizar el perfil');
    }
  };

  // Avatar handlers
  const handleAvatarClick = () => {
    if (!editing) return;
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e) => {
    try {
      setError('');
      const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
      if (!file) return;
      
      const validTypes = ['image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Solo se permiten imágenes JPG o PNG');
      }
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('La imagen supera 5MB.');
      }

      setAvatarUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setAvatarUrl(base64);
        setEditForm(prev => ({ ...prev, photo: base64 }));
        setAvatarUploading(false);
      };
      reader.readAsDataURL(file);

      setStatusMsg('Imagen preparada. Guarda el perfil para aplicar.');
    } catch (err) {
      console.error('Actualizar avatar error:', err);
      setError(err.message || 'No se pudo preparar la foto de perfil');
      setAvatarUploading(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="container py-4">
      <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Mi Perfil' }]} />
      <h2 className="mb-3"><i className="fas fa-user-cog me-2"></i> Mi Perfil</h2>

      {statusMsg && <div className="alert alert-success">{statusMsg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Perfil */}
      <div className="row g-3">
        <div className="col-12 col-md-6">
          <div className="card bg-dark text-light">
            <div className="card-body">
              <h5 className="card-title">Perfil</h5>

              <div className="text-center mb-3">
                <label style={{ cursor: editing ? 'pointer' : 'default' }} onClick={handleAvatarClick}>
                  <img
                    src={avatarUrl || FALLBACK_AVATAR}
                    alt="avatar"
                    className="rounded-circle"
                    width="120"
                    height="120"
                    style={{ objectFit: 'cover', border: '3px solid #ccc' }}
                  />
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="d-none"
                  accept="image/jpeg,image/png"
                  onChange={handleAvatarFileChange}
                />
                {avatarUploading && (
                  <div className="mt-2 small text-muted">
                    Subiendo imagen...
                  </div>
                )}
                {editing && (
                  <div className="mt-2 small text-muted">
                    Click en la imagen para cambiarla
                  </div>
                )}
              </div>

              {!editing ? (
                <>
                  <p className="mb-1">
                    <span className="text-muted">Nombre:</span>{' '}
                    {(profile?.firstName || '') + ' ' + (profile?.lastName || '')}
                  </p>
                  <p className="mb-1"><span className="text-muted">Correo:</span> {profile?.email || usuario?.email || '-'}</p>
                  <p className="mb-1"><span className="text-muted">Dirección:</span> {profile?.address || '-'}</p>
                  <p className="mb-3"><span className="text-muted">Teléfono:</span> {profile?.phone || '-'}</p>

                  <button className="btn btn-outline-light" onClick={() => setEditing(true)}>
                    <i className="fas fa-edit me-1"></i> Editar perfil
                  </button>
                </>
              ) : (
                <>
                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Nombre</label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Apellido</label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Dirección</label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Teléfono</label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mt-3 d-flex gap-2">
                    <button className="btn btn-primary" onClick={handleSaveProfile}>
                      <i className="fas fa-save me-1"></i> Guardar
                    </button>
                    <button className="btn btn-secondary" onClick={() => { 
                      setEditing(false); 
                      setEditForm({
                        firstName: profile?.firstName || '', 
                        lastName: profile?.lastName || '', 
                        address: profile?.address || '', 
                        phone: profile?.phone || '',
                        photo: profile?.photo || ''
                      }); 
                      setAvatarUrl(profile?.photo || FALLBACK_AVATAR);
                    }}>
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Vincular cuentas */}
        <div className="col-12 col-md-6">
          <div className="card bg-dark text-light">
            <div className="card-body">
              <h5 className="card-title">Vincular cuentas</h5>
              <p className="small text-muted">Añade métodos de acceso adicionales a tu cuenta.</p>
              <div className="d-flex flex-wrap gap-2">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowLinkModal(true)}
                  disabled={hasPasswordProvider}
                >
                  <i className="fas fa-envelope me-1"></i> Vincular correo/clave
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleLinkGoogle}
                  disabled={hasGoogleProvider}
                >
                  <i className="fab fa-google me-1"></i> Vincular Google
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal vincular correo/clave */}
        {showLinkModal && (
          <div 
            className="order-modal-overlay" 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}
            onClick={() => setShowLinkModal(false)}
          >
            <div 
              className="order-modal"
              style={{
                background: '#1a1a1a',
                borderRadius: '8px',
                width: 'min(400px, 90vw)',
                maxHeight: '80vh',
                overflow: 'auto',
                color: '#fff'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                className="order-modal-header"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '1px solid #333'
                }}
              >
                <h5 className="m-0">Vincular correo y contraseña</h5>
                <button 
                  className="btn btn-sm btn-outline-light" 
                  onClick={() => setShowLinkModal(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div 
                className="order-modal-content"
                style={{ padding: '16px' }}
              >
                <form onSubmit={handleLinkEmailPassword}>
                  <div className="mb-2">
                    <label className="form-label">Correo</label>
                    <input
                      type="email"
                      className="form-control bg-dark text-white border-secondary"
                      value={emailLink}
                      onChange={(e) => setEmailLink(e.target.value)}
                      placeholder="tu@correo.com"
                    />
                  </div>
                  <div className="mb-2 position-relative">
                    <label className="form-label">Contraseña</label>
                    <input
                      type={showPw ? 'text' : 'password'}
                      className="form-control bg-dark text-white border-secondary"
                      value={passwordLink}
                      onChange={(e) => setPasswordLink(e.target.value)}
                      placeholder="Tu contraseña"
                    />
                    <button
                      type="button"
                      className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                      onClick={() => setShowPw(!showPw)}
                      style={{ color: '#ccc', textDecoration: 'none' }}
                    >
                      <i className={`fas ${showPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  <div 
                    className="order-modal-footer"
                    style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid #333'
                    }}
                  >
                    <button type="submit" className="btn btn-primary w-100">
                      Vincular correo/clave
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Perfil;