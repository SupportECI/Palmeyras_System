import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "./Sidebar";
import {
    DoorOpen,
    BedSingle,
    Ban,
    BrushCleaning,
    DoorClosedLocked,
    Trash,
    Plus
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
    const [habitaciones, setHabitaciones] = useState([]);

    /* Estados para el formulario de nueva habitación */
    const [numHabitacion, setNumHabitacion] = useState('');
    const [tipo, setTipo] = useState('');
    const [precioBase, setPrecioBase] = useState('');
    const [estadoHabitacion, setEstadoHabitacion] = useState('LIBRE_LIMPIA');

    /* estado para modal de agregar habitacion */
    const [isOpen, setIsOpen] = useState(false);

    /* estado para confirmar borrar habitacion */
    const [isCofirmar, setIsConfirmar] = useState(null);
    const [idBorrando, setIdBorrando] = useState(null);

    /* estados para filtrar busquedas */
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');

    const [isCollapsed, setIsCollapsed] = useState(false);

    // Función principal para obtener habitaciones y evaluar cambios automáticos de horario
    const obtenerHabitaciones = async () => {
        try {
            const respuesta = await api.get('/habitaciones');
            let lista = respuesta.data.habitaciones;

            // Obtenemos fecha y hora exacta del equipo
            const ahora = new Date();
            const fechaHoy = ahora.toISOString().split('T')[0];
            const horaActual = ahora.toTimeString().substring(0, 5); // formato HH:MM

            let huboCambios = false;

            for (let h of lista) {
                // Si la habitación está libre y tiene una reserva asignada para hoy a esta hora o antes
                if (
                    (h.estado === 'LIBRE_LIMPIA' || h.estado === 'LIBRE_SUCIA') &&
                    h.hora_reservacion &&
                    h.fecha_reservacion
                ) {
                    const fechaReservaStr = h.fecha_reservacion.split('T')[0];
                    const horaReservaStr = h.hora_reservacion.substring(0, 5);

                    if (fechaReservaStr === fechaHoy && horaActual >= horaReservaStr) {
                        // Cambiamos automáticamente a 'RESERVADA' en el backend
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

    const cambiarEstadoHabitacion = async (idHabitacion, nuevoEstado) => {
        try {
            await api.put(`/habitaciones/${idHabitacion}/estado`, { estado: nuevoEstado });
            obtenerHabitaciones();
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
            alert('No se pudo actualizar el estado de la habitación');
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

    const eliminarHabitacion = async (idHabitacion) => {
        setIdBorrando(idHabitacion);

        setTimeout(async () => {
            try {
                const response = await fetch(`http://localhost:4000/api/habitaciones/${idHabitacion}`, {
                    method: 'DELETE'
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Error al eliminar');

                setIsConfirmar(null);
                setIdBorrando(null);
                obtenerHabitaciones();

            } catch (error) {
                console.error('Error detallado:', error);
                setIdBorrando(null);
                alert('No se pudo eliminar la habitación');
            }
        }, 300);
    };

    // Filtramos las habitaciones según búsqueda y estado
    const habitacionesFiltradas = habitaciones.filter((h) => {
        const coincideBusqueda = h.num_habitacion.toString().toLowerCase().includes(busqueda.toLowerCase());

        if (filtroEstado === 'TODOS') return coincideBusqueda;
        if (filtroEstado === 'DISPONIBLES') return coincideBusqueda && (h.estado === 'LIBRE_LIMPIA');
        if (filtroEstado === 'SUCIAS') return coincideBusqueda && (h.estado === 'LIBRE_SUCIA');
        if (filtroEstado === 'OCUPADAS') return coincideBusqueda && (h.estado === 'OCUPADA');
        if (filtroEstado === 'RESERVADAS') return coincideBusqueda && (h.estado === 'RESERVADA');

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

                <div className="grid grid-cols-5 gap-6 py-10 px-5">
                    <div className="flex flex-col gap-6 rounded-xl border border-gray-200 shadow-sm bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Habitaciones Totales</p>
                                <p className="text-2xl text-center font-semibold text-gray-900 mt-1">{totalHabitaciones}</p>
                            </div>
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><BedSingle /></div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-6 rounded-xl border border-gray-200 shadow-sm bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Disponibles</p>
                                <p className="text-2xl text-center font-semibold text-gray-900 mt-1">{libreLimpia}</p>
                            </div>
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><DoorOpen /></div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-6 rounded-xl border border-gray-200 shadow-sm bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Por Limpiar</p>
                                <p className="text-2xl text-center font-semibold text-gray-900 mt-1">{libreSucia}</p>
                            </div>
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><BrushCleaning /></div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-6 rounded-xl border border-gray-200 shadow-sm bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Ocupadas</p>
                                <p className="text-2xl text-center font-semibold text-gray-900 mt-1">{ocupada}</p>
                            </div>
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center"><Ban /></div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-6 rounded-xl border border-gray-200 shadow-sm bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Reservadas</p>
                                <p className="text-2xl text-center font-semibold text-gray-900 mt-1">{reservada}</p>
                            </div>
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"><DoorClosedLocked /></div>
                        </div>
                    </div>
                </div>

                <div className="px-5 mb-10">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-xl font-bold text-gray-800">Listado de Habitaciones</h3>
                        <button onClick={() => setIsOpen(true)} className='flex gap-2 px-4 py-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-300 font-medium text-sm transition cursor-pointer'>
                            <Plus className="w-5 h-5" />
                            <span>Agregar Habitacion</span>
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
                            <button onClick={() => setFiltroEstado('TODOS')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${filtroEstado === 'TODOS' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todas ({habitaciones.length})</button>
                            <button onClick={() => setFiltroEstado('DISPONIBLES')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${filtroEstado === 'DISPONIBLES' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>Disponibles ({libreLimpia})</button>
                            <button onClick={() => setFiltroEstado('SUCIAS')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${filtroEstado === 'SUCIAS' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}>Por Limpiar ({libreSucia})</button>
                            <button onClick={() => setFiltroEstado('OCUPADAS')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${filtroEstado === 'OCUPADAS' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}>Ocupadas ({ocupada})</button>
                            <button onClick={() => setFiltroEstado('RESERVADAS')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${filtroEstado === 'RESERVADAS' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>Reservadas ({reservada})</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                        {habitacionesFiltradas.length > 0 ? (
                            habitacionesFiltradas.map((h) => (
                                <div
                                    key={h.id}
                                    className={`bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between transition-all duration-300 transform ${idBorrando === h.id ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
                                >
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-lg text-gray-800">Hab. {h.num_habitacion}</span>

                                            <select
                                                value={h.estado}
                                                onChange={(e) => cambiarEstadoHabitacion(h.id, e.target.value)}
                                                className={`px-3 py-1 text-xs font-semibold rounded-lg border outline-none cursor-pointer transition ${h.estado === 'LIBRE_LIMPIA' ? 'bg-green-100 text-green-700 border-green-300' :
                                                        h.estado === 'LIBRE_SUCIA' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                                            h.estado === 'OCUPADA' ? 'bg-red-100 text-red-700 border-red-300' :
                                                                'bg-blue-100 text-blue-700 border-blue-300'
                                                    }`}
                                            >
                                                <option value="LIBRE_LIMPIA">Limpia</option>
                                                <option value="LIBRE_SUCIA">Sucia</option>
                                                <option value="OCUPADA">Ocupada</option>
                                                <option value="RESERVADA">Reservada</option>
                                            </select>
                                        </div>

                                        <p className="text-sm text-gray-600">Tipo: <span className="font-medium text-gray-800">{h.tipo}</span></p>
                                        <p className="text-sm text-gray-600">Precio: <span className="font-medium text-gray-800">${h.precio_base}</span></p>

                                        {h.estado === 'LIBRE_LIMPIA' && h.hora_reservacion && (
                                            <div className="mt-2.5 pt-2.5 border-t border-gray-100 bg-amber-50/50 p-2 rounded-xl border border-amber-200">
                                                <p className="text-xs text-amber-800 font-bold flex items-center gap-1">
                                                    📅 Reservada para el <span className="text-amber-900">{h.fecha_reservacion?.split('T')[0]}</span> a las <span className="text-amber-900">{h.hora_reservacion}</span>
                                                </p>
                                                <p className="text-xs text-gray-600 mt-0.5">
                                                    Cliente: <span className="font-semibold">{h.cliente_nombre}</span>
                                                </p>
                                            </div>
                                        )}

                                        {(h.estado === 'OCUPADA' || h.estado === 'RESERVADA') && h.cliente_nombre && (
                                            <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                                                <p className="text-xs text-blue-600 font-semibold">
                                                    Cliente: <span className="font-normal text-gray-700">{h.cliente_nombre}</span>
                                                </p>
                                                {h.hora_reservacion && (
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        Hora de reserva: <span className="font-medium text-gray-700">{h.hora_reservacion}</span>
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-2 border-t border-gray-100">
                                        {isCofirmar === h.id ? (
                                            <div className="bg-red-50 p-2.5 rounded-xl border border-red-200 flex flex-col gap-2">
                                                <p className="text-xs text-red-700 font-medium text-center">¿Eliminar esta habitación?</p>
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => setIsConfirmar(null)} className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 cursor-pointer transition">No</button>
                                                    <button onClick={() => eliminarHabitacion(h.id)} className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 cursor-pointer transition">Sí, eliminar</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end">
                                                <button onClick={() => setIsConfirmar(h.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer" title="Eliminar habitación">
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
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