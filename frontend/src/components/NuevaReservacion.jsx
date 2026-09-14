import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from './Sidebar';
import { BedDouble, User, Phone, MapPin, DollarSign } from 'lucide-react';

export default function NuevaReservacion() {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [habitacionesLibres, setHabitacionesLibres] = useState([]);

    const [habitacionId, setHabitacionId] = useState('');
    const [nombreCompleto, setNombreCompleto] = useState('');
    const [celular, setCelular] = useState('');
    const [direccion, setDireccion] = useState('');
    const [precioCobrado, setPrecioCobrado] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [toast, setToast] = useState({ show: false, message: '' });

    useEffect(() => {
        const obtenerHabitacionesLibres = async () => {
            try {
                const res = await api.get('/habitaciones');
                const libres = res.data.habitaciones.filter(h => h.estado === 'LIBRE_LIMPIA');
                setHabitacionesLibres(libres);
            } catch (err) {
                console.error('Error al cargar habitaciones', err);
            }
        };
        obtenerHabitacionesLibres();
    }, []);

    const handleHabitacionChange = (e) => {
        const id = e.target.value;
        setHabitacionId(id);
        const habSeleccionada = habitacionesLibres.find(h => h.id.toString() === id);
        if (habSeleccionada) {
            setPrecioCobrado(habSeleccionada.precio_base);
        } else {
            setPrecioCobrado('');
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
                nombre_completo: nombreCompleto,
                direccion: direccion,
                celular: celular,
                precio_cobrado: precioCobrado,
                usuario_recepcion_id: usuarioId
            });

            setToast({ show: true, message: 'Reservacion hecha con exito' });

            navigate('/dashboard/supervisor');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al registrar la reservación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <div className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} p-6 transition-all duration-300`}>
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Crear Nueva Reservación</h1>
                    <p className="text-xs text-gray-500 mb-6">Ingresa los datos del cliente y selecciona una habitación disponible.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Seleccionar Habitación</label>
                            <select
                                value={habitacionId}
                                onChange={handleHabitacionChange}
                                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                                required
                            >
                                <option value="">-- Seleccione una habitación --</option>
                                {habitacionesLibres.map(h => (
                                    <option key={h.id} value={h.id}>
                                        Habitación #{h.num_habitacion} ({h.tipo}) - ${h.precio_base}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Completo del Cliente</label>
                            <input
                                type="text"
                                placeholder="Ej. Juan Pérez López"
                                value={nombreCompleto}
                                onChange={(e) => setNombreCompleto(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Número de Celular</label>
                                <input
                                    type="text"
                                    placeholder="9611234567"
                                    value={celular}
                                    onChange={(e) => setCelular(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Precio Cobrado ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={precioCobrado}
                                    onChange={(e) => setPrecioCobrado(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Dirección</label>
                            <textarea
                                placeholder="Dirección completa del cliente..."
                                value={direccion}
                                onChange={(e) => setDireccion(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 resize-none"
                                rows="2"
                                required
                            />
                        </div>

                        {error && <p className="text-red-600 text-xs text-center">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition cursor-pointer shadow-sm"
                        >
                            {loading ? 'Guardando...' : 'Confirmar Reservación'}
                        </button>
                    </form>

                    {toast.show && (
                        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 transition-all transform animate-bounce">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                            <p className="text-xs font-medium">{toast.message}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}