import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "./Sidebar";
import { DoorOpen, Ban, BrushCleaning, UserCheck, LogOut, Calendar, Clock } from 'lucide-react';

export default function RecepcionDashboard() {
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [habitaciones, setHabitaciones] = useState([]);
    const [reservaciones, setReservaciones] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Estado para el modal de Check-in
    const [modalCheckinOpen, setModalCheckinOpen] = useState(false);
    const [habitacionSeleccionada, setHabitacionSeleccionada] = useState(null);
    const [nombreCliente, setNombreCliente] = useState('');
    const [direccion, setDireccion] = useState('');
    const [celular, setCelular] = useState('');
    const [precioCobrado, setPrecioCobrado] = useState('');

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            const datos = JSON.parse(usuarioGuardado);
            setNombreUsuario(datos.nombre || datos.correo);
        }
        cargarDatosRecepcion();
    }, []);

    const cargarDatosRecepcion = async () => {
        try {
            // Cargar habitaciones y reservaciones activas
            const resHab = await api.get('/habitaciones');
            setHabitaciones(resHab.data.habitaciones);

            const resRes = await api.get('/reservas/todas');
            setReservaciones(resRes.data.reservaciones);
        } catch (error) {
            console.error('Error al cargar datos de recepción', error);
        }
    };

    // Función para realizar Check-in (Cambia a OCUPADA y registra renta/cliente)
    const handleCheckinSubmit = async (e) => {
        e.preventDefault();
        try {
            const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
            const usuarioId = usuarioGuardado ? usuarioGuardado.id : null;

            // Creamos una reservación inmediata o check-in directo con fecha y hora actual
            const ahora = new Date();
            const fechaHoy = ahora.toISOString().split('T')[0];
            const horaActual = ahora.toTimeString().substring(0, 5);

            await api.post('/reservaciones', {
                habitacion_id: habitacionSeleccionada.id,
                nombre_completo: nombreCliente,
                direccion: direccion,
                celular: celular,
                precio_cobrado: precioCobrado,
                fecha_reservacion: fechaHoy,
                hora_reservacion: horaActual,
                usuario_recepcion_id: usuarioId
            });

            // Inmediatamente la pasamos a OCUPADA formalmente
            await api.put(`/habitaciones/${habitacionSeleccionada.id}/estado`, {
                estado: 'OCUPADA',
                rol_usuario: 'RECEPCION'
            });

            setModalCheckinOpen(false);
            limpiarFormularioCheckin();
            cargarDatosRecepcion();
        } catch (error) {
            console.error('Error al hacer Check-in', error);
            alert(error.response?.data?.message || 'No se pudo completar el Check-in');
        }
    };

    // Función para realizar Check-out (Pasa de OCUPADA a LIBRE_SUCIA)
    const handleCheckout = async (idHabitacion) => {
        if (!window.confirm('¿Desea realizar el Check-out de esta habitación? Pasará a estado Sucia.')) return;
        try {
            await api.put(`/habitaciones/${idHabitacion}/estado`, {
                estado: 'LIBRE_SUCIA',
                rol_usuario: 'RECEPCION'
            });
            cargarDatosRecepcion();
        } catch (error) {
            console.error('Error al hacer Check-out', error);
            alert('No se pudo procesar el Check-out');
        }
    };

    const limpiarFormularioCheckin = () => {
        setHabitacionSeleccionada(null);
        setNombreCliente('');
        setDireccion('');
        setCelular('');
        setPrecioCobrado('');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            <div className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} flex flex-col min-w-0 transition-all duration-300`}>
                <header className="bg-white text-black flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <h1 className="text-lg font-semibold text-gray-800">Panel de Recepción</h1>
                    <span className="text-sm text-gray-600">Bienvenido, {nombreUsuario || "Recepcionista"}</span>
                </header>

                <div className="p-6 flex flex-col gap-8">
                    {/* SECCIÓN 1: ESTADO DE HABITACIONES */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Control de Habitaciones</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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

                                        {/* Información del cliente si está ocupada o reservada */}
                                        {h.cliente_nombre && (
                                            <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
                                                <p className="text-gray-700 font-semibold">Cliente: {h.cliente_nombre}</p>
                                                {h.hora_reservacion && <p className="text-gray-500">Horario: {h.hora_reservacion}</p>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Botones de Acción Rápida para Recepción */}
                                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-2">
                                        {h.estado === 'LIBRE_LIMPIA' && (
                                            <button
                                                onClick={() => { setHabitacionSeleccionada(h); setPrecioCobrado(h.precio_base); setModalCheckinOpen(true); }}
                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1 cursor-pointer"
                                            >
                                                <UserCheck className="w-3.5 h-3.5" /> Check-in
                                            </button>
                                        )}
                                        {h.estado === 'OCUPADA' && (
                                            <button
                                                onClick={() => handleCheckout(h.id)}
                                                className="px-3 py-1.5 bg-orange-600 text-white rounded-xl text-xs font-semibold hover:bg-orange-700 transition flex items-center gap-1 cursor-pointer"
                                            >
                                                <LogOut className="w-3.5 h-3.5" /> Check-out
                                            </button>
                                        )}
                                        {h.estado === 'LIBRE_SUCIA' && (
                                            <span className="text-xs text-purple-600 font-medium italic">Pendiente de limpieza</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECCIÓN 2: LISTA DE RESERVACIONES PRÓXIMAS 
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Próximas Reservaciones en Agenda</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                                        <th className="p-3">Habitación</th>
                                        <th className="p-3">Cliente</th>
                                        <th className="p-3">Celular</th>
                                        <th className="p-3">Fecha</th>
                                        <th className="p-3">Horario</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {reservaciones.length > 0 ? (
                                        reservaciones.map((r) => (
                                            <tr key={r.renta_id} className="hover:bg-gray-50">
                                                <td className="p-3 font-bold text-gray-900">Hab. #{r.num_habitacion}</td>
                                                <td className="p-3 font-medium">{r.nombre_completo}</td>
                                                <td className="p-3 text-gray-500">{r.celular}</td>
                                                <td className="p-3 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-blue-500" /> {r.fecha_reservacion?.split('T')[0]}</td>
                                                <td className="p-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-md flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> {r.hora_reservacion}</span></td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="p-6 text-center text-gray-500">No hay reservaciones activas pendientes.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    */}
                </div>

                {/* MODAL PARA REALIZAR CHECK-IN */}
                {modalCheckinOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <h2 className="text-lg font-bold text-gray-900 mb-1">Check-in - Habitación #{habitacionSeleccionada?.num_habitacion}</h2>
                            <p className="text-xs text-gray-500 mb-4">Ingrese los datos del cliente para registrar la entrada y ocupar la habitación.</p>

                            <form onSubmit={handleCheckinSubmit} className="flex flex-col gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Completo</label>
                                    <input type="text" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Dirección</label>
                                    <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Celular</label>
                                    <input type="text" value={celular} onChange={(e) => setCelular(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Precio Cobrado ($)</label>
                                    <input type="number" value={precioCobrado} onChange={(e) => setPrecioCobrado(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" required />
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                    <button type="button" onClick={() => setModalCheckinOpen(false)} className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 cursor-pointer">Confirmar Check-in</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}