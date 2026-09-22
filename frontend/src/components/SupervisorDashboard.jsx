import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "./Sidebar";
import {
    Plus,
    Wrench,
    CalendarCheck,
    DoorOpen
} from 'lucide-react';

export default function SupervisorDashboard() {
    const [nombreUsuario] = useState(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            const datos = JSON.parse(usuarioGuardado);
            return datos.nombre || datos.correo;
        }
        return '';
    });

    const [totalHabitaciones, setTotalHabitaciones] = useState("");
    const [libreLimpia, setLibreLimpia] = useState('');
    const [libreSucia, setLibreSucia] = useState('');
    const [ocupada, setOcupada] = useState('');
    const [reservada, setReservada] = useState('');
    const [mantenimientoCount, setMantenimientoCount] = useState('');
    const [limpiezaSemanalCount, setLimpiezaSemanalCount] = useState('');
    const [habitaciones, setHabitaciones] = useState([]);

    /* Estados para el formulario de nueva habitación */
    const [numHabitacion, setNumHabitacion] = useState('');
    const [tipo, setTipo] = useState('');
    const [precioBase, setPrecioBase] = useState('');
    const [estadoHabitacion, setEstadoHabitacion] = useState('LIBRE_LIMPIA');

    /* estado para modal de agregar habitacion */
    const [isOpen, setIsOpen] = useState(false);

    /* estados para filtrar busquedas */
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');

    const [isCollapsed, setIsCollapsed] = useState(false);

    // Función principal para obtener habitaciones
    const obtenerHabitaciones = async () => {
        try {
            const respuesta = await api.get('/habitaciones');
            let lista = respuesta.data.habitaciones;

            const ahora = new Date();
            const fechaHoy = ahora.toISOString().split('T')[0];
            const horaActual = ahora.toTimeString().substring(0, 5);

            let huboCambios = false;

            for (let h of lista) {
                if (
                    (h.estado === 'LIBRE_LIMPIA' || h.estado === 'LIBRE_SUCIA') &&
                    h.hora_reservacion &&
                    h.fecha_reservacion
                ) {
                    const fechaReservaStr = h.fecha_reservacion.split('T')[0];
                    const horaReservaStr = h.hora_reservacion.substring(0, 5);

                    if (fechaReservaStr === fechaHoy && horaActual >= horaReservaStr) {
                        await api.put(`/habitaciones/${h.id}/estado`, {
                            estado: 'RESERVADA',
                            rol_usuario: 'SUPERVISOR'
                        });
                        huboCambios = true;
                    }
                }
            }

            if (huboCambios) {
                const resActualizada = await api.get('/habitaciones');
                lista = resActualizada.data.habitaciones;
            }

            setTotalHabitaciones(lista.length);
            setHabitaciones(lista);
            setLibreLimpia(lista.filter(h => h.estado === 'LIBRE_LIMPIA').length);
            setLibreSucia(lista.filter(h => h.estado === 'LIBRE_SUCIA').length);
            setOcupada(lista.filter(h => h.estado === 'OCUPADA').length);
            setReservada(lista.filter(h => h.estado === 'RESERVADA').length);
            setMantenimientoCount(lista.filter(h => h.estado === 'MANTENIMIENTO').length);
            setLimpiezaSemanalCount(lista.filter(h => h.estado === 'LIMPIEZA_SEMANAL').length);
        } catch (error) {
            console.error('Error al obtener las habitaciones', error);
        }
    };

    useEffect(() => {
        obtenerHabitaciones();
        const intervalo = setInterval(() => {
            obtenerHabitaciones();
        }, 30000);
        return () => clearInterval(intervalo);
    }, []);

    // Función para que el supervisor ordene Limpieza Semanal o Mantenimiento
    const cambiarEstadoOperativo = async (idHabitacion, nuevoEstado) => {
        const mensaje = nuevoEstado === 'MANTENIMIENTO' 
            ? '¿Desea bloquear esta habitación por Mantenimiento?'
            : '¿Desea programar la Limpieza Semanal para esta habitación?';
            
        if (!window.confirm(mensaje)) return;

        try {
            await api.put(`/habitaciones/${idHabitacion}/estado-operativo`, { estado: nuevoEstado });
            obtenerHabitaciones();
        } catch (error) {
            console.error('Error al cambiar estado operativo:', error);
            alert('No se pudo actualizar el estado');
        }
    };

    const handleAgregarHabitacion = async (e) => {
        e.preventDefault();
        try {
            await api.post('/habitaciones', {
                num_habitacion: numHabitacion,
                tipo: tipo,
                precio_base: precioBase,
                estado: estadoHabitacion
            });

            setIsOpen(false);
            setNumHabitacion('');
            setTipo('');
            setPrecioBase('');
            setEstadoHabitacion('LIBRE_LIMPIA');
            obtenerHabitaciones();
        } catch (error) {
            console.error('Error al registrar la habitación', error);
            alert('No se pudo registrar la habitación');
        }
    };

    const habitacionesFiltradas = habitaciones.filter((h) => {
        const coincideBusqueda = h.num_habitacion.toString().toLowerCase().includes(busqueda.toLowerCase());

        if (filtroEstado === 'TODOS') return coincideBusqueda;
        if (filtroEstado === 'DISPONIBLES') return coincideBusqueda && (h.estado === 'LIBRE_LIMPIA');
        if (filtroEstado === 'SUCIAS') return coincideBusqueda && (h.estado === 'LIBRE_SUCIA');
        if (filtroEstado === 'OCUPADAS') return coincideBusqueda && (h.estado === 'OCUPADA');
        if (filtroEstado === 'RESERVADAS') return coincideBusqueda && (h.estado === 'RESERVADA');
        if (filtroEstado === 'MANTENIMIENTO') return coincideBusqueda && (h.estado === 'MANTENIMIENTO');
        if (filtroEstado === 'LIMPIEZA_SEMANAL') return coincideBusqueda && (h.estado === 'LIMPIEZA_SEMANAL');

        return coincideBusqueda;
    });

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            <div className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} flex flex-col min-w-0 transition-all duration-300`}>
                <header className="bg-white text-black flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-800">Panel de Supervisor</h1>
                    </div>
                    <div className="flex items-center gap-4 ml-auto">
                        <span className="text-md text-gray-800">
                            {nombreUsuario ? `Bienvenido, ${nombreUsuario}` : "Cargando..."}
                        </span>
                    </div>
                </header>

                {/* TARJETAS RESUMEN */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 py-8 px-5">
                    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 shadow-sm bg-white p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Totales</p>
                                <p className="text-2xl font-semibold text-gray-900 mt-1">{totalHabitaciones}</p>
                            </div>
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 shadow-sm bg-white p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Disponibles</p>
                                <p className="text-2xl font-semibold text-gray-900 mt-1">{libreLimpia}</p>
                            </div>
                            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 shadow-sm bg-white p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Por Limpiar</p>
                                <p className="text-2xl font-semibold text-gray-900 mt-1">{libreSucia}</p>
                            </div>
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 shadow-sm bg-white p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Ocupadas</p>
                                <p className="text-2xl font-semibold text-gray-900 mt-1">{ocupada}</p>
                            </div>
                            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 shadow-sm bg-white p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Mantenimiento</p>
                                <p className="text-2xl font-semibold text-gray-900 mt-1">{mantenimientoCount}</p>
                            </div>
                            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 shadow-sm bg-white p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Limp. Semanal</p>
                                <p className="text-2xl font-semibold text-gray-900 mt-1">{limpiezaSemanalCount}</p>
                            </div>
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-5 mb-10">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-xl font-bold text-gray-800">Listado de Habitaciones y Control Operativo</h3>
                        <button onClick={() => setIsOpen(true)} className='flex gap-2 px-4 py-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-300 font-medium text-sm transition cursor-pointer'>
                            <Plus className="w-5 h-5" />
                            <span>Agregar Habitación</span>
                        </button>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="w-full md:w-72">
                            <input
                                type="text"
                                placeholder="Buscar por número de hab..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            <button onClick={() => setFiltroEstado('TODOS')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${filtroEstado === 'TODOS' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todas</button>
                            <button onClick={() => setFiltroEstado('DISPONIBLES')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${filtroEstado === 'DISPONIBLES' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>Disponibles</button>
                            <button onClick={() => setFiltroEstado('SUCIAS')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${filtroEstado === 'SUCIAS' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}>Por Limpiar</button>
                            <button onClick={() => setFiltroEstado('MANTENIMIENTO')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${filtroEstado === 'MANTENIMIENTO' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>Mantenimiento</button>
                            <button onClick={() => setFiltroEstado('LIMPIEZA_SEMANAL')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${filtroEstado === 'LIMPIEZA_SEMANAL' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>Limpieza Semanal</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                        {habitacionesFiltradas.length > 0 ? (
                            habitacionesFiltradas.map((h) => (
                                <div
                                    key={h.id}
                                    className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-lg text-gray-800">Hab. {h.num_habitacion}</span>

                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                                                h.estado === 'LIBRE_LIMPIA' ? 'bg-green-100 text-green-700 border-green-300' :
                                                h.estado === 'LIBRE_SUCIA' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                                h.estado === 'OCUPADA' ? 'bg-red-100 text-red-700 border-red-300' :
                                                h.estado === 'RESERVADA' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                                h.estado === 'MANTENIMIENTO' ? 'bg-red-200 text-red-800 border-red-400 font-bold' :
                                                'bg-blue-200 text-blue-800 border-blue-400 font-bold'
                                            }`}>
                                                {h.estado === 'LIBRE_LIMPIA' ? 'Limpia' : 
                                                 h.estado === 'LIBRE_SUCIA' ? 'Sucia' : 
                                                 h.estado === 'OCUPADA' ? 'Ocupada' : 
                                                 h.estado === 'RESERVADA' ? 'Reservada' :
                                                 h.estado === 'MANTENIMIENTO' ? 'Mantenimiento' : 'Limpieza Semanal'}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-600">Tipo: <span className="font-medium text-gray-800">{h.tipo}</span></p>
                                        <p className="text-sm text-gray-600 mb-3">Precio: <span className="font-medium text-gray-800">${h.precio_base}</span></p>

                                        {/* ACCIONES RÁPIDAS DEL SUPERVISOR */}
                                        <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100">
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Acciones del Supervisor:</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {h.estado !== 'MANTENIMIENTO' ? (
                                                    <button
                                                        onClick={() => cambiarEstadoOperativo(h.id, 'MANTENIMIENTO')}
                                                        className="py-1.5 px-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer border border-red-200"
                                                    >
                                                        <Wrench className="w-3.5 h-3.5" /> Mantenimiento
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => cambiarEstadoOperativo(h.id, 'LIBRE_LIMPIA')}
                                                        className="py-1.5 px-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer border border-green-200 col-span-2"
                                                    >
                                                        <DoorOpen className="w-3.5 h-3.5" /> Liberar de Mantenimiento
                                                    </button>
                                                )}

                                                {h.estado !== 'LIMPIEZA_SEMANAL' && h.estado !== 'MANTENIMIENTO' && (
                                                    <button
                                                        onClick={() => cambiarEstadoOperativo(h.id, 'LIMPIEZA_SEMANAL')}
                                                        className="py-1.5 px-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer border border-blue-200"
                                                    >
                                                        <CalendarCheck className="w-3.5 h-3.5" /> Limp. Semanal
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-10 text-center bg-white rounded-2xl border border-gray-200">
                                <p className="text-gray-500 text-sm">No se encontraron habitaciones con los filtros seleccionados.</p>
                            </div>
                        )}
                    </div>
                </div>

                {isOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Agregar Habitación</h2>
                                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 font-bold text-lg cursor-pointer">✕</button>
                            </div>

                            <form onSubmit={handleAgregarHabitacion} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Número de Habitación</label>
                                    <input
                                        type="text"
                                        value={numHabitacion}
                                        onChange={(e) => setNumHabitacion(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Habitación</label>
                                    <input
                                        type="text"
                                        value={tipo}
                                        onChange={(e) => setTipo(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Base</label>
                                    <input
                                        type="number"
                                        value={precioBase}
                                        onChange={(e) => setPrecioBase(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado Inicial</label>
                                    <select
                                        value={estadoHabitacion}
                                        onChange={(e) => setEstadoHabitacion(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 bg-white cursor-pointer"
                                    >
                                        <option value="LIBRE_LIMPIA">Limpia (Disponible)</option>
                                        <option value="LIBRE_SUCIA">Sucia</option>
                                        <option value="OCUPADA">Ocupada</option>
                                        <option value="RESERVADA">Reservada</option>
                                        <option value="MANTENIMIENTO">Mantenimiento</option>
                                        <option value="LIMPIEZA_SEMANAL">Limpieza Semanal</option>
                                    </select>
                                </div>

                                <div className="flex justify-end gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm cursor-pointer"
                                    >
                                        Guardar Habitación
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}