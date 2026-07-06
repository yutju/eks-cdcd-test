// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Appointment from './pages/appointment/Appointment';
import Medical from './pages/medical/Medical';
import Health from './pages/health/Health';
import Board from './pages/board/Board';
import Message from './pages/communication/Message';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/"              element={<Home />} />
            <Route path="/login"         element={<Login />} />
            <Route path="/signup"        element={<Signup />} />
            <Route path="/dashboard"     element={<Dashboard />} />
            <Route path="/appointment"   element={<Appointment />} />
            <Route path="/medical/*"     element={<Medical />} />
            <Route path="/health"        element={<Health />} />
            <Route path="/board"         element={<Board />} />
            <Route path="/board/:boardType" element={<Board />} />
            <Route path="/message"       element={<Message />} />
            <Route path="/staff/login"   element={<AdminLogin />} />
            <Route path="/staff"         element={<AdminDashboard />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
