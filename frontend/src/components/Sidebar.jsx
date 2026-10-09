import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Users, LogOut, Menu, ShieldCheck } from 'lucide-react';

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
    const [rolUsuario, setRolUsuario] = useState('');
    const location = useLocation();

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            const parsedUser = JSON.parse(usuarioGuardado);
            // Normalizamos el rol a minúsculas por seguridad
            setRolUsuario(parsedUser.rol ? parsedUser.rol.toLowerCase() : '');
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('usuario');
        window.location.href = '/';
    };

    const obtenerRutaDashboard = () => {
        switch (rolUsuario) {
            case 'recepcion': return '/dashboard/recepcionista';
            case 'recamarista': return '/dashboard/recamarista';
            case 'supervisor': return '/dashboard/supervisor';
            case 'admin': return '/dashboard/administrador';
            default: return '/dashboard';
        }
    };

    const obtenerRutaReportes = () => {
        switch (rolUsuario) {
            case 'recepcion': return '/dashboard/recepcionista/reportes';
            case 'supervisor': return '/dashboard/supervisor/reportes';
            case 'admin': return '/dashboard/administrador/reportes';
            default: return '/dashboard/reportes';
        }
    };

    return (
        <aside className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50 flex flex-col justify-between ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div>
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
                    {!isCollapsed && <span className="font-bold text-gray-800 text-lg">Hotel Palmeyras</span>}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition cursor-pointer mx-auto"
                    >
                        <Menu className='w-5 h-5' />
                    </button>
                </div>

                <nav className="p-4 space-y-2">
                    <Link
                        to={obtenerRutaDashboard()}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition font-medium text-sm ${location.pathname === obtenerRutaDashboard() ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <LayoutDashboard className="w-5 h-5 shrink-0" />
                        {!isCollapsed && <span>Dashboard</span>}
                    </Link>

                    {rolUsuario !== 'recamarista' && (
                        <Link
                            to={obtenerRutaReportes()}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition font-medium text-sm ${location.pathname === obtenerRutaReportes() ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <BarChart3 className="w-5 h-5 shrink-0" />
                            {!isCollapsed && <span>Reportes</span>}
                        </Link>
                    )}

                    {rolUsuario === 'admin' && (
                        <Link
                            to="/dashboard/administrador/usuarios"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition font-medium text-sm ${location.pathname === '/dashboard/administrador/usuarios' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <Users className="w-5 h-5 shrink-0" />
                            {!isCollapsed && <span>Gestión de Usuarios</span>}
                        </Link>
                    )}

                    {(rolUsuario === 'admin' || rolUsuario === 'supervisor') && (
                        <Link
                            to="/dashboard/auditoria-limpiezas"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition font-medium text-sm ${location.pathname === '/dashboard/auditoria-limpiezas' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <ShieldCheck className="w-5 h-5 shrink-0" />
                            {!isCollapsed && <span>Auditoría y Fotos</span>}
                        </Link>
                    )}

                </nav>
            </div>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition font-medium text-sm cursor-pointer"
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    {!isCollapsed && <span>Cerrar Sesión</span>}
                </button>
            </div>
        </aside>
    );
}