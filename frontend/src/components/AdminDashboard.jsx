import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "./Sidebar";
import { Users, DollarSign, BedDouble, ShieldCheck, DoorOpen, Ban, BrushCleaning, DoorClosedLocked } from 'lucide-react';

export default function AdminDashboard() {
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    const [habitaciones, setHabitaciones] = useState([]);
    const [rentasGlobales, setRentasGlobales] = useState([]);
    const [usuarios, setUsuarios] = useState([]);

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            const datos = JSON.parse(usuarioGuardado);
            setNombreUsuario(datos.nombre || datos.correo);
        }
        cargarDatosAdmin();
    }, []);

    const cargarDatosAdmin = async () => {
        try {
            const resHab = await api.get('/habitaciones');
            setHabitaciones(resHab.data.habitaciones);

            const resRes = await api.get('/reservas/todas');
            setRentasGlobales(resRes.data.reservaciones);

            const resUser = await api.get('/usuarios');
            setUsuarios(resUser.data.usuarios || []);
        } catch (error) {
            console.error('Error al cargar datos del administrador', error);
        }
    };

    // Estadísticas globales
    const totalHabitaciones = habitaciones.length;
    const ocupadas = habitaciones.filter(h => h.estado === 'OCUPADA').length;
    const disponibles = habitaciones.filter(h => h.estado === 'LIBRE_LIMPIA').length;
    const sucias = habitaciones.filter(h => h.estado === 'LIBRE_SUCIA').length;
    const reservadas = habitaciones.filter(h => h.estado === 'RESERVADA').length;
    
    const ingresosTotales = rentasGlobales.reduce((acc, r) => acc + (Number(r.precio_cobrado) || 0), 0);

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} rol="admin" />

            <div className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} flex flex-col min-w-0 transition-all duration-300`}>
                <header className="bg-white text-black flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <h1 className="text-lg font-semibold text-gray-800">Panel de Administración General</h1>
                    <span className="text-sm text-gray-600">Bienvenido: {nombreUsuario || "Master"}</span>
                </header>

                <div className="p-6 flex flex-col gap-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500">Ingresos Totales (Histórico)</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">${ingresosTotales.toLocaleString()}</p>
                            </div>
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500">Ocupadas Actualmente</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{ocupadas} / {totalHabitaciones}</p>
                            </div>
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                <BedDouble className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500">Disponibles (Limpias)</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{disponibles}</p>
                            </div>
                            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500">Personal Activo</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{usuarios.length}</p>
                            </div>
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* VISTA GENERAL DE TODAS LAS HABITACIONES Y SUS ESTADOS */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Estado Actual de las Habitaciones</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                            {habitaciones.map((h) => (
                                <div key={h.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-lg text-gray-800">Hab. {h.num_habitacion}</span>
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                                                h.estado === 'LIBRE_LIMPIA' ? 'bg-green-100 text-green-700 border-green-300' :
                                                h.estado === 'LIBRE_SUCIA' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                                h.estado === 'OCUPADA' ? 'bg-red-100 text-red-700 border-red-300' :
                                                'bg-blue-100 text-blue-700 border-blue-300'
                                            }`}>
                                                {h.estado === 'LIBRE_LIMPIA' ? 'Limpia' : h.estado === 'LIBRE_SUCIA' ? 'Sucia' : h.estado === 'OCUPADA' ? 'Ocupada' : 'Reservada'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">Tipo: <span className="font-medium text-gray-800">{h.tipo}</span></p>
                                        <p className="text-sm text-gray-600 mb-3">Precio: <span className="font-medium text-gray-800">${h.precio_base}</span></p>

                                        {h.cliente_nombre && (
                                            <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                                                <p className="font-semibold text-gray-800">Cliente: {h.cliente_nombre}</p>
                                                {h.hora_reservacion && <p>Horario: {h.hora_reservacion}</p>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}