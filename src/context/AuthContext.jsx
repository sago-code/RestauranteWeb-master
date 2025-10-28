import React, { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext({
  usuario: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);

useEffect(() => {
  const storedUser = localStorage.getItem('usuario');
  console.log("Usuario cargado desde localStorage:", storedUser); // ✅ Depuración
  if (storedUser) {
    setUsuario(JSON.parse(storedUser));
    console.log("Usuario después de setUsuario:", usuario); // ✅ Confirma si se actualiza correctamente
  }
}, []);

const login = (userData) => {
  console.log("Usuario antes de actualizar el contexto:", userData); // ✅ Depuración
  setUsuario(userData); // ✅ Guarda el usuario en el estado global
  localStorage.setItem('usuario', JSON.stringify(userData));
};

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario');
    console.log("Usuario después de cerrar sesión:", usuario); // ✅ Verifica que se borra correctamente
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Hook para acceder fácilmente al contexto en otros componentes
export const useAuth = () => useContext(AuthContext);