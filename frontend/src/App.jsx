import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Login from './components/Login';
import './App.css'
import SupervisorDashboard from './components/SupervisorDashboard';
import SupervisorReportes from './components/SupervisorReportes';
import NuevaReservacion from './components/NuevaReservacion';
import ListaReservaciones from './components/ListaReservaciones';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />}/>
        <Route path='/dashboard/supervisor' element={<SupervisorDashboard />}/>
        <Route path='/dashboard/supervisor/reportes' element={<SupervisorReportes />}/>
        <Route path='/dashboard/reservaciones/nueva' element={<NuevaReservacion />}/>
        <Route path='/dashboard/reservaciones/lista' element={<ListaReservaciones />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
