import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import './App.css'
import SupervisorDashboard from './components/SupervisorDashboard';
import SupervisorReportes from './components/SupervisorReportes';
import NuevaReservacion from './components/NuevaReservacion';
import ListaReservaciones from './components/ListaReservaciones';
import RecepcionDashboard from './components/RecepcionDashborad';
import RecamaristaDashboard from './components/RecamaristaDashboard';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import GestionUsuarios from './components/GestionUsuarios';
import CancelarRenta from './components/CancelarRenta';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path='/dashboard/supervisor'
          element={<ProtectedRoute rolPermitido='SUPERVISOR'>
            <SupervisorDashboard />
          </ProtectedRoute>} />

        <Route path='/dashboard/supervisor/reportes' element={
          <ProtectedRoute rolPermitido='SUPERVISOR'>
            <SupervisorReportes />
          </ProtectedRoute>} />

        <Route path='/dashboard/reservaciones/nueva' element={
          <ProtectedRoute>
            <NuevaReservacion />
          </ProtectedRoute>}
        />

        <Route path='/dashboard/reservaciones/lista' element={
          <ProtectedRoute>
            <ListaReservaciones />
          </ProtectedRoute>} />

        <Route path='/dashboard/recepcionista' element={
          <ProtectedRoute rolPermitido='RECEPCIONISTA'>
            <RecepcionDashboard />
          </ProtectedRoute>} />

        <Route path='/dashboard/recamarista' element={
          <ProtectedRoute rolPermitido='RECAMARISTA'>
            <RecamaristaDashboard />
          </ProtectedRoute>} />

        <Route path='/dashboard/administrador' element={
          <ProtectedRoute rolPermitido='ADMINISTRADOR'>
            <AdminDashboard />
          </ProtectedRoute>} />
        
        <Route path='/dashboard/administrador/usuarios' element={
          <ProtectedRoute>
            <GestionUsuarios />
          </ProtectedRoute>
        }/>

        <Route path='/dashboard/cancelar-renta' element={<CancelarRenta />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
