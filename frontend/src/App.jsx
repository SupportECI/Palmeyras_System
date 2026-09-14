import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Login from './components/Login';
import './App.css'
import SupervisorDashboard from './components/SupervisorDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />}/>
        <Route path='/dashboard/supervisor' element={<SupervisorDashboard />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
