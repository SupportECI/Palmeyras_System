import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "./Sidebar";
import { UserCheck, LogOut, Clock, XCircle } from 'lucide-react';

// Componente secundario para calcular y mostrar el cronómetro de las 4 horas de renta
function CronometroRenta({ horaInicioReal }) {
    const [tiempoRestante, setTiempoRestante] = useState("");
    const [expirado, setExpirado] = useState(false);

    useEffect(() => {
        if (!horaInicioReal) return;

        const calcularTiempo = () => {
            const [h, m, s] = horaInicioReal.split(':').map(Number);
            const inicio = new Date();
            inicio.setHours(h, m, s || 0);

            // 4 horas exactas de duración
            const fin = new Date(inicio.getTime() + 4 * 60 * 60 * 1000);
            const ahora = new Date();

            const diferencia = fin - ahora;

            if (diferencia <= 0) {
                setExpirado(true);
                setTiempoRestante("¡TIEMPO TERMINADO!");
            } else {
                const horas = Math.floor((diferencia / (1000 * 60 * 60)) % 24);
                const minutos = Math.floor((diferencia / 1000 / 60) % 60);
                const segundos = Math.floor((diferencia / 1000) % 60);
                setTiempoRestante(`${horas}h ${minutos}m ${segundos}s`);
            }
        };

        calcularTiempo();
        const intervalo = setInterval(calcularTiempo, 1000);
        return () => clearInterval(intervalo);
    }, [horaInicioReal]);

    return (
        <div className={`mt-2 p-2 rounded-xl text-xs font-bold flex items-center justify-between ${expirado ? 'bg-red-100 text-red-700 border border-red-300 animate-pulse' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Tiempo:</span>
            <span>{tiempoRestante}</span>
        </div>
    );
}

export default function RecepcionDashboard() {
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [habitaciones, setHabitaciones] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Estado para el modal de Check-in
    const [modalCheckinOpen, setModalCheckinOpen] = useState(false);
    const [habitacionSeleccionada, setHabitacionSeleccionada] = useState(null);
    const [nombreCliente, setNombreCliente] = useState('');
    const [direccion, setDireccion] = useState('');
    const [celular, setCelular] = useState('');
    const [precioCobrado, setPrecioCobrado] = useState('');

    // Estados adicionales para manejar si es check-in normal o de reserva existente
    const [esReservacion, setEsReservacion] = useState(false);
    const [rentaIdActual, setRentaIdActual] = useState(null);

    // Estados para el modal local de cancelación rápida desde la tarjeta
    const [modalCancelarOpen, setModalCancelarOpen] = useState(false);
    const [rentaACancelarId, setRentaACancelarId] = useState(null);
    const [motivoCancelacion, setMotivoCancelacion] = useState('');

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            const datos = JSON.parse(usuarioGuardado);
            setNombreUsuario(datos.nombre || datos.correo);
        }
        cargarDatosRecepcion();

        // Actualizar datos cada minuto para reflejar el bloqueo de las 2 horas automáticamente
        const interval = setInterval(cargarDatosRecepcion, 60000);
        return () => clearInterval(interval);
    }, []);

    const cargarDatosRecepcion = async () => {
        try {
            const resHab = await api.get('/habitaciones');
            setHabitaciones(resHab.data.habitaciones);
        } catch (error) {
            console.error('Error al cargar habitaciones', error);
        }
    };

    // Realizar Check-in (Distingue entre Walk-in nuevo o Activación de Reservación existente)
    const handleCheckinSubmit = async (e) => {
        e.preventDefault();
        try {
            const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
            const usuarioId = usuarioGuardado ? usuarioGuardado.id : null;

            if (esReservacion) {
                // CASO A: Activar reservación existente utilizando su renta_id
                await api.put(`/reservaciones/${rentaIdActual}/activar`, {
                    usuario_recepcion_id: usuarioId,
                    precio_cobrado: precioCobrado
                });
            } else {
                // CASO B: Cliente nuevo de paso (Walk-in)
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
            }

            // Cambiar estado formalmente a OCUPADA
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

    // Realizar Check-out (Pasa de OCUPADA a LIBRE_SUCIA)
    const handleCheckout = async (idHabitacion) => {
        if (!window.confirm('¿Desea realizar el Check-out de esta habitación? El tiempo ha concluido y pasará a estado Sucia.')) return;
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

    // Cancelación rápida desde la tarjeta de la habitación reservada
    const abrirModalCancelar = (habitacion) => {
        if (!habitacion.renta_id) {
            alert('No se encontró una renta asociada a esta habitación para cancelar.');
            return;
        }
        setRentaACancelarId(habitacion.renta_id);
        setMotivoCancelacion('');
        setModalCancelarOpen(true);
    };

    const handleCancelarRentaSubmit = async (e) => {
        e.preventDefault();
        if (!motivoCancelacion.trim()) {
            alert('Debe especificar un motivo de cancelación.');
            return;
        }

        try {
            const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
            const usuarioId = usuarioGuardado ? usuarioGuardado.id : null;

            await api.put(`/reservas/cancelar/${rentaACancelarId}`, {
                motivo_cancelacion: motivoCancelacion,
                usuario_cancela_id: usuarioId
            });

            setModalCancelarOpen(false);
            setRentaACancelarId(null);
            setMotivoCancelacion('');
            alert('Reservación cancelada correctamente.');
            cargarDatosRecepcion();
        } catch (error) {
            console.error('Error al cancelar reservación', error);
            alert(error.response?.data?.message || 'No se pudo cancelar la reservación');
        }
    };

    const limpiarFormularioCheckin = () => {
        setHabitacionSeleccionada(null);
        setNombreCliente('');
        setDireccion('');
        setCelular('');
        setPrecioCobrado('');
        setEsReservacion(false);
        setRentaIdActual(null);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} rol="recepcion" />

            <div className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} flex flex-col min-w-0 transition-all duration-300`}>
                <header className="bg-white text-black flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <h1 className="text-lg font-semibold text-gray-800">Panel de Recepción</h1>
                    <span className="text-sm text-gray-600">Bienvenido, {nombreUsuario || "Recepcionista"}</span>
                </header>

                <div className="p-6 flex flex-col gap-8">
                    <div>
                        <div className="mb-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">Control y Estado de Habitaciones</h3>
                            <p className="text-xs text-gray-500">* Las habitaciones se bloquean a reservadas 2 horas antes de su hora programada.</p>
                        </div>

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
                                        <p className="text-sm text-gray-600 mb-2">Precio: <span className="font-medium text-gray-800">${h.precio_base}</span></p>

                                        {/* Información del cliente y horario programado */}
                                        {h.cliente_nombre && (
                                            <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
                                                <p className="text-gray-700 font-semibold">Cliente: {h.cliente_nombre}</p>
                                                {h.hora_reservacion && <p className="text-gray-500">Reserva a las: {h.hora_reservacion}</p>}
                                            </div>
                                        )}

                                        {/* Cronómetro si está ocupada */}
                                        {h.estado === 'OCUPADA' && h.hora_inicio_real && (
                                            <CronometroRenta horaInicioReal={h.hora_inicio_real} />
                                        )}
                                    </div>

                                    {/* Botones de Acción / Interacción según el estado */}
                                    <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2">
                                        {h.estado === 'LIBRE_LIMPIA' && (
                                            <button
                                                onClick={() => { 
                                                    setHabitacionSeleccionada(h); 
                                                    setPrecioCobrado(h.precio_base); 
                                                    setEsReservacion(false);
                                                    setModalCheckinOpen(true); 
                                                }}
                                                className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                                            >
                                                <UserCheck className="w-4 h-4" /> Check-in
                                            </button>
                                        )}

                                        {/* Check-in y Cancelación para habitación bloqueada por reservación */}
                                        {h.estado === 'RESERVADA' && (
                                            <>
                                                <button
                                                    onClick={() => { 
                                                        setHabitacionSeleccionada(h); 
                                                        setPrecioCobrado(h.precio_base); 
                                                        setNombreCliente(h.cliente_nombre || '');
                                                        setCelular(h.celular || '');
                                                        setRentaIdActual(h.renta_id);
                                                        setEsReservacion(true);
                                                        setModalCheckinOpen(true); 
                                                    }}
                                                    className="w-full py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                                                    title="El cliente de la reservación ha llegado"
                                                >
                                                    <UserCheck className="w-4 h-4" /> Check-in (Reservación)
                                                </button>
                                                <button
                                                    onClick={() => abrirModalCancelar(h)}
                                                    className="w-full py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-semibold hover:bg-red-100 transition flex items-center justify-center gap-1 cursor-pointer"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" /> Cancelar Reservación
                                                </button>
                                            </>
                                        )}

                                        {h.estado === 'OCUPADA' && (
                                            <button
                                                onClick={() => handleCheckout(h.id)}
                                                className="w-full py-2 bg-orange-600 text-white rounded-xl text-xs font-semibold hover:bg-orange-700 transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                                            >
                                                <LogOut className="w-4 h-4" /> Realizar Check-out
                                            </button>
                                        )}

                                        {h.estado === 'LIBRE_SUCIA' && (
                                            <span className="w-full text-center text-xs text-purple-600 font-semibold py-1">Pendiente de limpieza</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MODAL PARA REALIZAR CHECK-IN */}
                {modalCheckinOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <h2 className="text-lg font-bold text-gray-900 mb-1">Check-in - Habitación #{habitacionSeleccionada?.num_habitacion}</h2>
                            <p className="text-xs text-gray-500 mb-4">
                                {esReservacion ? 'Confirme la entrada del cliente registrado en la agenda.' : 'Inicia la renta por 4 horas ingresando los datos del cliente.'}
                            </p>

                            <form onSubmit={handleCheckinSubmit} className="flex flex-col gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Completo</label>
                                    <input 
                                        type="text" 
                                        value={nombreCliente} 
                                        onChange={(e) => setNombreCliente(e.target.value)} 
                                        disabled={esReservacion}
                                        className={`w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none ${esReservacion ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'focus:border-blue-500'}`} 
                                        required 
                                    />
                                </div>

                                {!esReservacion && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Dirección</label>
                                            <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Celular</label>
                                            <input type="text" value={celular} onChange={(e) => setCelular(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" required />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Precio Cobrado ($)</label>
                                    <input type="number" value={precioCobrado} onChange={(e) => setPrecioCobrado(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" required />
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                    <button type="button" onClick={() => setModalCheckinOpen(false)} className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 cursor-pointer">
                                        {esReservacion ? 'Confirmar y Activar Renta' : 'Iniciar Renta (4 hrs)'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL PARA CANCELAR RESERVACIÓN */}
                {modalCancelarOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <h2 className="text-lg font-bold text-gray-900 mb-1">Cancelar Reservación</h2>
                            <p className="text-xs text-gray-500 mb-4">Por motivos de auditoría, es obligatorio registrar la razón por la cual se cancela esta reservación.</p>

                            <form onSubmit={handleCancelarRentaSubmit} className="flex flex-col gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Motivo de Cancelación *</label>
                                    <textarea 
                                        value={motivoCancelacion} 
                                        onChange={(e) => setMotivoCancelacion(e.target.value)} 
                                        rows="3"
                                        placeholder="Ej. El cliente no se presentó a la hora acordada..."
                                        className="w-full border border-gray-300 rounded-xl p-3 text-xs outline-none focus:border-red-500 resize-none" 
                                        required 
                                    />
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setModalCancelarOpen(false)} 
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