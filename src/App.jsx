import { Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Hamburguesas from './pages/Hamburguesas';
import Perros from './pages/Perros';
import Salchipapas from './pages/Salchipapas';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './pages/Estilos.css';
import Navbar from './pages/NavBar';
import Footer from './pages/Footer';
import MenuSection from './pages/MenuSection';
import { CartProvider } from './context/CartContext';
import WhatsAppButton from './components/WhatsAppButton';
import ChatBot from './components/ChatBot.jsx';

// Layout principal que incluye la barra de navegación, el pie de página y el botón de WhatsApp
const MainLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <WhatsAppButton />
      <ChatBot />
    </>
  );
};

// Layout para páginas de autenticación que no incluye el botón de WhatsApp
const AuthLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <ChatBot />
    </>
  );
};

function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={
          <MainLayout>
            <Index />
          </MainLayout>
        } />
        <Route path="/menu" element={
          <MainLayout>
            <MenuSection />
          </MainLayout>
        } />
        <Route path="/hamburguesas" element={
          <MainLayout>
            <Hamburguesas />
          </MainLayout>
        } />
        <Route path="/perros" element={
          <MainLayout>
            <Perros />
          </MainLayout>
        } />
        <Route path="/salchipapas" element={
          <MainLayout>
            <Salchipapas />
          </MainLayout>
        } />
        <Route path="/login" element={
          <AuthLayout>
            <Login />
          </AuthLayout>
        } />
        <Route path="/register" element={
          <AuthLayout>
            <Register />
          </AuthLayout>
        } />
      </Routes>
    </CartProvider>
  );
}

export default App;
