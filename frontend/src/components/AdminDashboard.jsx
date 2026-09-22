import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "./Sidebar";
import { Trash, Plus, BedSingle, DoorOpen, BrushCleaning, Ban, DoorClosedLocked } from 'lucide-react';

export default function AdminDashboard() {
    const [nombreUsuario] = useState(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            const datos = JSON.parse(usuarioGuardado);
            return datos.nombre || datos.correo;
        }
        return '';
    });

    const [habitaciones, setHabitaciones] = useState([]);
    const [totalHabitaciones, setTotalHabitaciones] = useState(0);
    const [libreLimpia, setLibreLimpia] = useState(0);
    const [libreSucia, setLibreSucia] = useState(0);
    const [ocupada, setOcupada] = useState(0);
    const [reservada, setReservada] = useState(0);

    /* Estados para agregar habitación */
    const [isOpen, setIsOpen] = useState(false);
    const [numHabitacion, setNumHabitacion] = useState('');
    const [tipo, setTipo] = useState('');
    const [precioBase, setPrecioBase] = useState('');
    const [estadoHabitacion, setEstadoHabitacion] = useState('LIBRE_LIMPIA');

    /* Estado para confirmación de borrado exclusivo de Admin */
    const [isConfirmar, setIsConfirmar] = useState(null);
    const [idBorrando, setIdBorrando] = useState(null);

    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    const [isCollapsed, setIsCollapsed] = useState(false);

    const obtenerHabitaciones = async () => {
        try {
            const respuesta = await api.get('/habitaciones');
            const lista = respuesta.data.habitaciones;

            setTotalHabitaciones(lista.length);
            setHabitaciones(lista);
            setLibreLimpia(lista.filter(h => h.estado === 'LIBRE_LIMPIA').length);
            setLibreSucia(lista.filter(h => h.estado === 'LIBRE_SUCIA').length);
            setOcupada(lista.filter(h => h.estado === 'OCUPADA').length);
            setReservada(lista.filter(h => h.estado === 'RESERVADA').length);
        } catch (error) {
            console.error('Error al obtener habitaciones', error);
        }
    };

    useEffect(() => {
        obtenerHabitaciones();
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
            console.error('Error al registrar habitación', error);
            alert('No se pudo registrar la habitación');
        }
    };

    const eliminarHabitacion = async (idHabitacion) => {
        setIdBorrando(idHabitacion);

        setTimeout(async () => {
            try {
                const response = await api.delete(`/habitaciones/${idHabitacion}`);
                if (!response.data.success) throw new Error('Error al eliminar');

                setIsConfirmar(null);
                setIdBorrando(null);
                obtenerHabitaciones();
            } catch (error) {
                console.error('Error detallado:', error);
                setIdBorrando(null);
                alert('No se pudo eliminar la habitación (es posible que tenga rentas asociadas)');
            }
        }, 300);
    };

    const habitacionesFiltradas = habitaciones.filter((h) => {
        const coincideBusqueda = h.num_habitacion.toString().toLowerCase().includes(busqueda.toLowerCase());
        if (filtroEstado === 'TODOS') return coincideBusqueda;
        if (filtroEstado === 'DISPONIBLES') return coincideBusqueda && h.estado === 'LIBRE_LIMPIA';
        if (filtroEstado === 'SUCIAS') return coincideBusqueda && h.estado === 'LIBRE_SUCIA';
        if (filtroEstado === 'OCUPADAS') return coincideBusqueda && h.estado === 'OCUPADA';
        if (filtroEstado === 'RESERVADAS') return coincideBusqueda && h.estado === 'RESERVADA';
        return coincideBusqueda;
    });

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            <div className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} flex flex-col min-w-0 transition-all duration-300`}>
                <header className="bg-white text-black flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <h1 className="text-lg font-semibold text-gray-800">Panel de Administrador (Control Total)</h1>
                    <span className="text-sm text-gray-600">Bienvenido, {nombreUsuario || "Administrador"}</span>
                </header>

                <div className="grid grid-cols-5 gap-6 py-10 px-5">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-600">Totales</p>
                            <p className="text-2xl font-semibold text-gray-900 mt-1">{totalHabitaciones}</p>
                        </div>
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><BedSingle /></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-600">Disponibles</p>
                            <p className="text-2xl font-semibold text-gray-900 mt-1">{libreLimpia}</p>
                        </div>
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><DoorOpen /></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-600">Por Limpiar</p>
                            <p className="text-2xl font-semibold text-gray-900 mt-1">{libreSucia}</p>
                        </div>
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><BrushCleaning /></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-600">Ocupadas</p>
                            <p className="text-2xl font-semibold text-gray-900 mt-1">{ocupada}</p>
                        </div>
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center"><Ban /></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-600">Reservadas</p>
                            <p className="text-2xl font-semibold text-gray-900 mt-1">{reservada}</p>
                        </div>
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"><DoorClosedLocked /></div>
                    </div>
                </div>

                <div className="px-5 mb-10">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-xl font-bold text-gray-800">Administración de Habitaciones</h3>
                        <button onClick={() => setIsOpen(true)} className='flex gap-2 px-4 py-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-300 font-medium text-sm transition cursor-pointer'>
                            <Plus className="w-5 h-5" />
                            <span>Agregar Habitación</span>
                        </button>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex justify-between items-center">
                        <input
                            type="text"
                            placeholder="Buscar habitación..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {habitacionesFiltradas.map((h) => (
                            <div key={h.id} className={`bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between transition-all ${idBorrando === h.id ? 'opacity-0 scale-90' : 'opacity-100'}`}>
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-bold text-lg text-gray-800">Hab. {h.num_habitacion}</span>

                                        {/* SELECTOR DE ESTADO CON LOS MISMOS COLORES QUE EL SUPERVISOR */}
                                        <select
                                            value={h.estado}
                                            onChange={(e) => cambiarEstadoHabitacion(h.id, e.target.value)}
                                            className={`px-3 py-1 text-xs font-semibold rounded-lg border outline-none cursor-pointer transition ${
                                                h.estado === 'LIBRE_LIMPIA' ? 'bg-green-100 text-green-700 border-green-300' :
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
                                </div>

                                {/* BOTÓN DE BORRAR EXCLUSIVO DE ADMINISTRADOR */}
                                <div className="mt-4 pt-2 border-t border-gray-100">
                                    {isConfirmar === h.id ? (
                                        <div className="bg-red-50 p-2.5 rounded-xl border border-red-200 flex flex-col gap-2">
                                            <p className="text-xs text-red-700 font-medium text-center">¿Eliminar permanentemente?</p>
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => setIsConfirmar(null)} className="px-3 py-1 bg-white border border-gray-300 text-xs rounded-lg cursor-pointer">No</button>
                                                <button onClick={() => eliminarHabitacion(h.id)} className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg cursor-pointer">Sí, eliminar</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end">
                                            <button onClick={() => setIsConfirmar(h.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer" title="Eliminar habitación">
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {isOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Agregar Habitación</h2>
                            <form onSubmit={handleAgregarHabitacion} className="flex flex-col gap-4">
                                <input type="text" placeholder="Número de Habitación" value={numHabitacion} onChange={(e) => setNumHabitacion(e.target.value)} className="border p-2 rounded-lg" required />
                                <input type="text" placeholder="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className="border p-2 rounded-lg" required />
                                <input type="number" placeholder="Precio Base" value={precioBase} onChange={(e) => setPrecioBase(e.target.value)} className="border p-2 rounded-lg" required />
                                <div className="flex justify-end gap-2 mt-4">
                                    <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Guardar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}