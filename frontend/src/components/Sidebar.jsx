import {
    LogOut
} from 'lucide-react'
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <aside className={`bg-white text-gray-800 flex flex-col h-screen fixed left-0 top-0 border-r border-gray-300 transition-all duration-300 z-10 ${isCollapsed ? 'w-20' : 'w-64'}`}>

            <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
                {!isCollapsed && (
                    <span className="text-lg font-bold tracking-wide text-red-500">Hotel Palmeyras</span>
                )}

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                        <line x1="4" x2="20" y1="12" y2="12" />
                        <line x1="4" x2="20" y1="6" y2="6" />
                        <line x1="4" x2="20" y1="18" y2="18" />
                    </svg>
                </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-100 text-gray-800 font-medium text-sm transition">
                    <span>🏨</span>
                    {!isCollapsed && <span>Tablero de Habitaciones</span>}
                </a>

                <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-100 text-gray-800 font-medium text-sm transition">
                    <span>👥</span>
                    {!isCollapsed && <span>Gestión de Usuarios</span>}
                </a>
            </nav>

            <button 
            onClick={handleLogout}
            className='w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium text-sm transition cursor-pointer'
            title='Cerrar Sesion'>
                <LogOut /> 
                {!isCollapsed && <span>Cerrar Sesion</span>}
            </button>
        </aside>
    );
}