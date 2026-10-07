import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from './Sidebar';
import { Calendar, Clock, User, Phone, MapPin, DollarSign, BedDouble, ArrowLeft } from 'lucide-react';

export default function NuevaReservacion() {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);

    const [habitacionId, setHabitacionId] = useState('');
    const [nombreCompleto, setNombreCompleto] = useState('');
    const [celular, setCelular] = useState('');
    const [direccion, setDireccion] = useState('');
    const [precioCobrado, setPrecioCobrado] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fechaReservacion, setFechaReservacion] = useState('');
    const [horaReservacion, setHoraReservacion] = useState('');

    useEffect(() => {
        const obtenerHabitaciones = async () => {
            try {
                const res = await api.get('/habitaciones');
                setHabitacionesDisponibles(res.data.habitaciones);
            } catch (err) {
                console.error('Error al cargar habitaciones', err);
            }
        };
        obtenerHabitaciones();
    }, []);

    const handleHabitacionChange = (e) => {
        const id = e.target.value;
        setHabitacionId(id);
        const habSeleccionada = habitacionesDisponibles.find(h => h.id.toString() === id);
        if (habSeleccionada) {
            setPrecioCobrado(habSeleccionada.precio_base);
        } else {
            setPrecioCobrado('');
        }
    };

    // Función para traducir los estados técnicos a lenguaje amigable para la interfaz
    const formatearEstadoAmigable = (estado) => {
        switch (estado) {
            case 'LIBRE_LIMPIA':
                return { texto: 'Disponible', clase: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
            case 'LIBRE_SUCIA':
                return { texto: 'Disponible (Pendiente de limpieza)', clase: 'bg-amber-50 text-amber-700 border-amber-200' };
            case 'OCUPADA':
                return { texto: 'Ocupada actualmente', clase: 'bg-rose-50 text-rose-700 border-rose-200' };
            case 'RESERVADA':
                return { texto: 'Reservada', class: 'bg-blue-50 text-blue-700 border-blue-200' };
            default:
                return { texto: estado, clase: 'bg-gray-50 text-gray-700 border-gray-200' };
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
        const usuarioId = usuarioGuardado ? usuarioGuardado.id : null;

        try {
            await api.post('/reservaciones', {
                habitacion_id: habitacionId,
                nombre_cliente: nombreCompleto,
                direccion_cliente: direccion,
                telefono_cliente: celular,
                precio_cobrado: precioCobrado,
                fecha_reservacion: fechaReservacion,
                hora_reservacion: horaReservacion,
                usuario_recepcion_id: usuarioId
            });

            navigate('/dashboard/reservaciones/lista');

        } catch (err) {
            setError(err.response?.data?.message || 'Error al registrar la reservación');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex font-sans">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} rol="recepcion" />
            <div className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} p-8 transition-all duration-300 flex flex-col justify-center items-center`}>
                
                <div className="w-full max-w-3xl bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
                    
                    {/* Encabezado del Formulario */}
                    <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6 text-white flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <BedDouble className="w-6 h-6" /> Nueva Reservación de Habitación
                            </h1>
                            <p className="text-xs text-blue-100 mt-1">
                                Programa citas futuras con bloqueo automático preventivo en el sistema.
                            </p>
                        </div>
                        <button 
                            onClick={() => navigate(-1)}
                            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" /> Volver
                        </button>
                    </div>

                    {/* Cuerpo del Formulario */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        
                        {/* Selección de Habitación */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 flex items-center gap-1.5">
                                <BedDouble className="w-4 h-4 text-blue-600" /> Seleccionar Habitación *
                            </label>
                            <select
                                value={habitacionId}
                                onChange={handleHabitacionChange}
                                className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm bg-gray-50 outline-none focus:border-blue-600 focus:bg-white transition"
                                required
                            >
                                <option value="">-- Selecciona una recámara disponible --</option>
                                {habitacionesDisponibles.map(h => {
                                    const estadoInfo = formatearEstadoAmigable(h.estado);
                                    return (
                                        <option key={h.id} value={h.id}>
                                            Habitación #{h.num_habitacion} - {h.tipo} (${h.precio_base}) | Estado: {estadoInfo.texto}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Datos del Cliente */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 flex items-center gap-1.5">
                                    <User className="w-4 h-4 text-blue-600" /> Nombre Completo del Cliente *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. Juan Pérez López"
                                    value={nombreCompleto}
                                    onChange={(e) => setNombreCompleto(e.target.value)}
                                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm bg-gray-50 outline-none focus:border-blue-600 focus:bg-white transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 flex items-center gap-1.5">
                                    <Phone className="w-4 h-4 text-blue-600" /> Número de Celular *
                                </label>
                                <input
                                    type="text"
                                    placeholder="9611234567"
                                    value={celular}
                                    onChange={(e) => setCelular(e.target.value)}
                                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm bg-gray-50 outline-none focus:border-blue-600 focus:bg-white transition"
                                    required
                                />
                            </div>
                        </div>

                        {/* Fecha y Hora */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-blue-600" /> Fecha de Cita *
                                </label>
                                <input
                                    type="date"
                                    value={fechaReservacion}
                                    onChange={(e) => setFechaReservacion(e.target.value)}
                                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm bg-gray-50 outline-none focus:border-blue-600 focus:bg-white transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-blue-600" /> Horario *
                                </label>
                                <input
                                    type="time"
                                    value={horaReservacion}
                                    onChange={(e) => setHoraReservacion(e.target.value)}
                                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm bg-gray-50 outline-none focus:border-blue-600 focus:bg-white transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 flex items-center gap-1.5">
                                    <DollarSign className="w-4 h-4 text-blue-600" /> Precio Acordado ($) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={precioCobrado}
                                    onChange={(e) => setPrecioCobrado(e.target.value)}
                                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm bg-gray-50 outline-none focus:border-blue-600 focus:bg-white transition font-semibold text-blue-700"
                                    required
                                />
                            </div>
                        </div>

                        {/* Dirección */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-blue-600" /> Dirección del Cliente *
                            </label>
                            <textarea
                                placeholder="Escribe la dirección completa..."
                                value={direccion}
                                onChange={(e) => setDireccion(e.target.value)}
                                className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm bg-gray-50 outline-none focus:border-blue-600 focus:bg-white transition resize-none"
                                rows="2"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-bold text-center">
                                {error}
                            </div>
                        )}

                        {/* Botón de envío */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/30 transition transform active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                            >
                                {loading ? 'Guardando en el sistema...' : 'Confirmar y Guardar Reservación'}
                            </button>
                        </div>

                    </form>

                </div>

            </div>
        </div>
    );
}