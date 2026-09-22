import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "./Sidebar";
import { XCircle, Calendar, Clock, AlertTriangle, Search } from 'lucide-react';

export default function CancelarRenta() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [reservasActivas, setReservasActivas] = useState([]);
    const [busqueda, setBusqueda] = useState('');

    // Estado para el modal de motivo de cancelación
    const [modalOpen, setModalOpen] = useState(false);
    const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
    const [motivoCancelacion, setMotivoCancelacion] = useState('');

    useEffect(() => {
        cargarReservasActivas();
    }, []);

    const cargarReservasActivas = async () => {
        try {
            // Utiliza el endpoint que ya tienes en tu backend para obtener las reservaciones/rentas activas
            const res = await api.get('/reservas/todas');
            setReservasActivas(res.data.reservaciones || []);
        } catch (error) {
            console.error('Error al cargar reservaciones activas', error);
        }
    };

    const abrirModalCancelar = (reserva) => {
        setReservaSeleccionada(reserva);
        setMotivoCancelacion('');
        setModalOpen(true);
    };

    const handleConfirmarCancelacion = async (e) => {
        e.preventDefault();
        if (!motivoCancelacion.trim()) {
            alert('Debe especificar un motivo de cancelación obligatorio.');
            return;
        }

        try {
            const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
            const usuarioId = usuarioGuardado ? usuarioGuardado.id : null;

            // Petición al endpoint PUT que creamos en el backend
            await api.put(`/reservas/cancelar/${reservaSeleccionada.renta_id}`, {
                motivo_cancelacion: motivoCancelacion,
                usuario_cancela_id: usuarioId
            });

            setModalOpen(false);
            setReservaSeleccionada(null);
            setMotivoCancelacion('');
            alert('Reservación cancelada con éxito y habitación liberada.');
            cargarReservasActivas();
        } catch (error) {
            console.error('Error al cancelar la renta', error);
            alert(error.response?.data?.message || 'No se pudo procesar la cancelación');
        }
    };

    // Filtrar reservaciones por nombre de cliente o número de habitación
    const reservasFiltradas = reservasActivas.filter(r => 
        r.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        String(r.num_habitacion).includes(busqueda)
    );

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} rol="recepcion" />

            <div className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} flex flex-col min-w-0 transition-all duration-300`}>
                <header className="bg-white text-black flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <h1 className="text-lg font-semibold text-gray-800">Módulo de Cancelación de Rentas y Reservaciones</h1>
                </header>

                <div className="p-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h3 className="text-base font-bold text-gray-800">Reservaciones Activas en el Sistema</h3>
                                <p className="text-xs text-gray-500">Seleccione una reservación para proceder con su cancelación justificada y liberar la habitación.</p>
                            </div>
                            
                            {/* Barra de búsqueda rápida */}
                            <div className="relative w-full sm:w-72">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                <input
                                    type="text"
                                    placeholder="Buscar por cliente o habitación..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:border-blue-500 bg-gray-50"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                                        <th className="p-3">Habitación</th>
                                        <th className="p-3">Cliente</th>
                                        <th className="p-3">Celular</th>
                                        <th className="p-3">Fecha</th>
                                        <th className="p-3">Horario</th>
                                        <th className="p-3 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {reservasFiltradas.length > 0 ? (
                                        reservasFiltradas.map((r) => (
                                            <tr key={r.renta_id} className="hover:bg-gray-50">
                                                <td className="p-3 font-bold text-gray-900">Hab. #{r.num_habitacion} ({r.tipo})</td>
                                                <td className="p-3 font-semibold text-gray-800">{r.nombre_completo}</td>
                                                <td className="p-3 text-gray-500">{r.celular || 'N/D'}</td>
                                                <td className="p-3 flex items-center gap-1 mt-1">
                                                    <Calendar className="w-3.5 h-3.5 text-blue-500" /> 
                                                    {r.fecha_reservacion?.split('T')[0]}
                                                </td>
                                                <td className="p-3">
                                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-lg flex items-center gap-1 w-fit">
                                                        <Clock className="w-3 h-3" /> {r.hora_reservacion}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button
                                                        onClick={() => abrirModalCancelar(r)}
                                                        className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-semibold hover:bg-red-100 transition cursor-pointer inline-flex items-center gap-1"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" /> Cancelar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center text-gray-500">No hay reservaciones activas registradas para cancelar.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* MODAL OBLIGATORIO DE MOTIVO DE CANCELACIÓN */}
                {modalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <h2 className="text-base font-bold text-gray-900">Cancelar Reservación - Hab. #{reservaSeleccionada?.num_habitacion}</h2>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">
                                Está cancelando la reserva de <strong className="text-gray-800">{reservaSeleccionada?.nombre_completo}</strong>. Es obligatorio registrar el motivo por auditoría.
                            </p>

                            <form onSubmit={handleConfirmarCancelacion} className="flex flex-col gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Motivo de Cancelación *</label>
                                    <textarea 
                                        value={motivoCancelacion} 
                                        onChange={(e) => setMotivoCancelacion(e.target.value)} 
                                        rows="3"
                                        placeholder="Ej. El cliente no se presentó, cancelación por cambio de planes..."
                                        className="w-full border border-gray-300 rounded-xl p-3 text-xs outline-none focus:border-red-500 resize-none" 
                                        required 
                                    />
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setModalOpen(false)} 
                                        className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                                    >
                                        Volver
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 cursor-pointer shadow-sm"
                                    >
                                        Confirmar Cancelación
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