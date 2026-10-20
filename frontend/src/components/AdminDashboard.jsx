import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "./Sidebar";
import { Trash, Edit, Plus, BedSingle, DoorOpen, BrushCleaning, Ban, Wrench, Sparkles, AlertTriangle } from 'lucide-react';

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
    const [mantenimiento, setMantenimiento] = useState(0);
    const [limpiezaSemanal, setLimpiezaSemanal] = useState(0);

    /* Estados para agregar habitación */
    const [isOpen, setIsOpen] = useState(false);
    const [numHabitacion, setNumHabitacion] = useState('');
    const [tipo, setTipo] = useState('');
    const [precioBase, setPrecioBase] = useState('');
    const [estadoHabitacion, setEstadoHabitacion] = useState('LIBRE_LIMPIA');

    /* Estados para editar habitación */
    const [modalEditarOpen, setModalEditarOpen] = useState(false);
    const [habitacionAEditar, setHabitacionAEditar] = useState(null);
    const [editNumHabitacion, setEditNumHabitacion] = useState('');
    const [editTipo, setEditTipo] = useState('');
    const [editPrecioBase, setEditPrecioBase] = useState('');

    /* Estados para el modal de motivo de mantenimiento */
    const [modalMantenimientoOpen, setModalMantenimientoOpen] = useState(false);
    const [habitacionSeleccionadaId, setHabitacionSeleccionadaId] = useState(null);
    const [motivoMantenimiento, setMotivoMantenimiento] = useState('');

    /* Estados para el Modal de Confirmación de Borrado */
    const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
    const [habitacionAEliminar, setHabitacionAEliminar] = useState(null);
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
            setMantenimiento(lista.filter(h => h.estado === 'MANTENIMIENTO').length);
            setLimpiezaSemanal(lista.filter(h => h.estado === 'LIMPIEZA_SEMANAL').length);
        } catch (error) {
            console.error('Error al obtener habitaciones', error);
        }
    };

    useEffect(() => {
        obtenerHabitaciones();
    }, []);

    const cambiarEstadoHabitacion = async (idHabitacion, nuevoEstado) => {
        if (nuevoEstado === 'MANTENIMIENTO') {
            setHabitacionSeleccionadaId(idHabitacion);
            setMotivoMantenimiento('');
            setModalMantenimientoOpen(true);
            return;
        }

        try {
            await api.put(`/habitaciones/${idHabitacion}/estado`, { estado: nuevoEstado });
            obtenerHabitaciones();
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
            alert('No se pudo actualizar el estado de la habitación');
        }
    };

    const confirmarMantenimiento = async (e) => {
        e.preventDefault();
        if (!motivoMantenimiento.trim()) {
            alert('Por favor ingrese el motivo del mantenimiento');
            return;
        }

        try {
            await api.put(`/habitaciones/${habitacionSeleccionadaId}/estado`, {
                estado: 'MANTENIMIENTO',
                motivo: motivoMantenimiento
            });
            setModalMantenimientoOpen(false);
            setHabitacionSeleccionadaId(null);
            setMotivoMantenimiento('');
            obtenerHabitaciones();
        } catch (error) {
            console.error('Error al registrar mantenimiento:', error);
            alert('No se pudo actualizar el estado a mantenimiento');
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

    // Funciones para manejar el Modal de Edición
    const abrirModalEditar = (h) => {
        setHabitacionAEditar(h);
        setEditNumHabitacion(h.num_habitacion);
        setEditTipo(h.tipo);
        setEditPrecioBase(h.precio_base);
        setModalEditarOpen(true);
    };

    const handleEditarHabitacion = async (e) => {
        e.preventDefault();
        if (!habitacionAEditar) return;

        try {
            await api.put(`/habitaciones/${habitacionAEditar.id}`, {
                num_habitacion: editNumHabitacion,
                tipo: editTipo,
                precio_base: editPrecioBase
            });
            setModalEditarOpen(false);
            setHabitacionAEditar(null);
            obtenerHabitaciones();
        } catch (error) {
            console.error('Error al actualizar la habitación', error);
            alert('No se pudo actualizar la información de la habitación');
        }
    };

    // Funciones para manejar el Modal de Eliminación
    const abrirModalEliminar = (habitacion) => {
        setHabitacionAEliminar(habitacion);
        setModalEliminarOpen(true);
    };

    const eliminarHabitacion = async () => {
        if (!habitacionAEliminar) return;

        const idHabitacion = habitacionAEliminar.id;
        setIdBorrando(idHabitacion);
        setModalEliminarOpen(false);

        setTimeout(async () => {
            try {
                const response = await api.delete(`/habitaciones/${idHabitacion}`);
                if (!response.data.success) throw new Error('Error al eliminar');

                setHabitacionAEliminar(null);
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

            <div className={`flex-1 ${isCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-64'} flex flex-col min-w-0 transition-all duration-300 pb-24 md:pb-0`}>                <header className="bg-white text-black flex items-center justify-between h-16 px-6 border-b border-gray-200">
                <h1 className="text-lg font-semibold text-gray-800">Panel de Administrador (Control Total)</h1>
                <span className="text-sm text-gray-600">Bienvenido, {nombreUsuario || "Administrador"}</span>
            </header>

                {/* TARJETAS DE RESUMEN */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 py-8 px-5">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-600">Totales</p>
                            <p className="text-xl font-semibold text-gray-900 mt-1">{totalHabitaciones}</p>
                        </div>
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600"><BedSingle className="w-4 h-4" /></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-600">Vacia Limpia</p>
                            <p className="text-xl font-semibold text-gray-900 mt-1">{libreLimpia}</p>
                        </div>
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600"><DoorOpen className="w-4 h-4" /></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-600">Vacia Sucia</p>
                            <p className="text-xl font-semibold text-gray-900 mt-1">{libreSucia}</p>
                        </div>
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600"><BrushCleaning className="w-4 h-4" /></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-600">Ocupadas</p>
                            <p className="text-xl font-semibold text-gray-900 mt-1">{ocupada}</p>
                        </div>
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600"><Ban className="w-4 h-4" /></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-600">Mantenimiento</p>
                            <p className="text-xl font-semibold text-gray-900 mt-1">{mantenimiento}</p>
                        </div>
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600"><Wrench className="w-4 h-4" /></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-600">Limp. Semanal</p>
                            <p className="text-xl font-semibold text-gray-900 mt-1">{limpiezaSemanal}</p>
                        </div>
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"><Sparkles className="w-4 h-4" /></div>
                    </div>
                </div>

                <div className="px-5 mb-10">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-xl font-bold text-gray-800">Administración de Habitaciones</h3>
                        <button onClick={() => setIsOpen(true)} className='flex gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium text-sm transition shadow-sm cursor-pointer'>
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
                            <button onClick={() => setFiltroEstado('DISPONIBLES')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${filtroEstado === 'DISPONIBLES' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>Vacia Limpia</button>
                            <button onClick={() => setFiltroEstado('SUCIAS')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${filtroEstado === 'SUCIAS' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}>Vacia Sucia</button>
                            <button onClick={() => setFiltroEstado('OCUPADAS')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${filtroEstado === 'OCUPADAS' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}>Ocupadas</button>
                            <button onClick={() => setFiltroEstado('MANTENIMIENTO')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${filtroEstado === 'MANTENIMIENTO' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>Mantenimiento</button>
                            <button onClick={() => setFiltroEstado('LIMPIEZA_SEMANAL')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${filtroEstado === 'LIMPIEZA_SEMANAL' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>Limpieza Semanal</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {habitacionesFiltradas.map((h) => (
                            <div key={h.id} className={`bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between transition-all ${idBorrando === h.id ? 'opacity-0 scale-90' : 'opacity-100'}`}>
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-bold text-lg text-gray-800">Hab. {h.num_habitacion}</span>

                                        {/* SELECTOR DE ESTADO */}
                                        <select
                                            value={h.estado}
                                            onChange={(e) => cambiarEstadoHabitacion(h.id, e.target.value)}
                                            className={`px-2 py-1 text-xs font-semibold rounded-lg border outline-none cursor-pointer transition ${h.estado === 'LIBRE_LIMPIA' ? 'bg-green-100 text-green-700 border-green-300' :
                                                    h.estado === 'LIBRE_SUCIA' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                                        h.estado === 'OCUPADA' ? 'bg-red-100 text-red-700 border-red-300' :
                                                            h.estado === 'MANTENIMIENTO' ? 'bg-purple-100 text-purple-700 border-purple-300' :
                                                                'bg-amber-100 text-amber-700 border-amber-300'
                                                }`}
                                        >
                                            <option value="LIBRE_LIMPIA">Vacia Limpia</option>
                                            <option value="LIBRE_SUCIA">Vacia Sucia</option>
                                            <option value="OCUPADA">Ocupada</option>
                                            <option value="MANTENIMIENTO">Mantenimiento</option>
                                            <option value="LIMPIEZA_SEMANAL">Limpieza Semanal</option>
                                        </select>
                                    </div>

                                    <p className="text-sm text-gray-600">Tipo: <span className="font-medium text-gray-800">{h.tipo}</span></p>
                                    <p className="text-sm text-gray-600">Precio: <span className="font-medium text-gray-800">${h.precio_base}</span></p>
                                </div>

                                {/* BOTONES DE EDITAR Y ELIMINAR */}
                                <div className="mt-4 pt-2 border-t border-gray-100 flex justify-end gap-1">
                                    <button
                                        onClick={() => abrirModalEditar(h)}
                                        className="p-1.5 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition cursor-pointer"
                                        title="Editar habitación"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => abrirModalEliminar(h)}
                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                        title="Eliminar habitación"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* MODAL DE EDITAR HABITACIÓN */}
                {modalEditarOpen && habitacionAEditar && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Editar Habitación {habitacionAEditar.num_habitacion}</h2>
                            <form onSubmit={handleEditarHabitacion} className="flex flex-col gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1">Número de Habitación</label>
                                    <input
                                        type="text"
                                        value={editNumHabitacion}
                                        onChange={(e) => setEditNumHabitacion(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-sm outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1">Tipo</label>
                                    <input
                                        type="text"
                                        value={editTipo}
                                        onChange={(e) => setEditTipo(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-sm outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1">Precio Base ($)</label>
                                    <input
                                        type="number"
                                        value={editPrecioBase}
                                        onChange={(e) => setEditPrecioBase(e.target.value)}
                                        className="w-full border border-gray-300 p-2.5 rounded-xl text-sm outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setModalEditarOpen(false);
                                            setHabitacionAEditar(null);
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 cursor-pointer shadow-sm"
                                    >
                                        Guardar Cambios
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
                {modalEliminarOpen && habitacionAEliminar && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 mb-1">¿Eliminar Habitación?</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                ¿Está seguro que desea eliminar la <span className="font-bold text-gray-800">Habitación {habitacionAEliminar.num_habitacion}</span>? <br /> Esta acción no se puede deshacer.
                            </p>

                            <div className="flex justify-center gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModalEliminarOpen(false);
                                        setHabitacionAEliminar(null);
                                    }}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-xs font-semibold text-gray-700 rounded-xl hover:bg-gray-50 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={eliminarHabitacion}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 cursor-pointer shadow-sm"
                                >
                                    Sí, eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL PARA SOLICITAR MOTIVO DE MANTENIMIENTO */}
                {modalMantenimientoOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-3">
                                <Wrench className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 mb-1">Motivo de Mantenimiento</h2>
                            <p className="text-xs text-gray-500 mb-4">Indique la razón por la cual la habitación pasa a mantenimiento.</p>

                            <form onSubmit={confirmarMantenimiento} className="flex flex-col gap-4">
                                <textarea
                                    placeholder="Ej. Reparación de aire acondicionado, fuga en baño..."
                                    value={motivoMantenimiento}
                                    onChange={(e) => setMotivoMantenimiento(e.target.value)}
                                    className="border border-gray-300 p-3 rounded-xl text-sm outline-none focus:border-purple-500 h-28 resize-none"
                                    required
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setModalMantenimientoOpen(false);
                                            setHabitacionSeleccionadaId(null);
                                        }}
                                        className="px-4 py-2 border border-gray-300 text-xs font-semibold text-gray-700 rounded-xl hover:bg-gray-50 cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-xl hover:bg-purple-700 cursor-pointer shadow-sm"
                                    >
                                        Confirmar Mantenimiento
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL PARA AGREGAR HABITACIÓN */}
                {isOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Agregar Habitación</h2>
                            <form onSubmit={handleAgregarHabitacion} className="flex flex-col gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1">Número de Habitación</label>
                                    <input type="text" placeholder="Número" value={numHabitacion} onChange={(e) => setNumHabitacion(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm" required />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1">Tipo</label>
                                    <input type="text" placeholder="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm" required />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1">Precio Base ($)</label>
                                    <input type="number" placeholder="Precio" value={precioBase} onChange={(e) => setPrecioBase(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm" required />
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer">Guardar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}