import { useEffect, useState, useMemo, useRef } from "react";
import api from "../services/api";
import Sidebar from "./Sidebar";
import { UserCheck, LogOut, Clock, BedDouble, Sparkles, AlertCircle, Wrench, CalendarCheck, X, Car } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const DURACION_MS = 4 * 60 * 60 * 1000;
const ALERTA_10_MIN_MS = 10 * 60 * 1000;
const ALERTA_5_MIN_MS = 5 * 60 * 1000;
const ALERTA_1_MIN_MS = 1 * 60 * 1000;

const formatear = (ms) => {
    const total = Math.floor(Math.abs(ms) / 1000);
    const h = String(Math.floor(total / 3600)).padStart(2, '0');
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
};

const mostrarAlertaTiempo = (habitacion, minutos) => {
    toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex border-l-4 border-rose-600 overflow-hidden`}>
            <div className="flex-1 p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                        <Clock className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">Tiempo por agotarse</p>
                        <p className="text-xs font-medium text-gray-600 mt-0.5">
                            Hab. <span className="font-bold text-black">#{habitacion}</span>: {minutos === 1 ? '¡Último minuto de tolerancia!' : `Restan ${minutos} minutos.`}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex border-l border-gray-100">
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full px-4 flex items-center justify-center hover:bg-rose-50 transition cursor-pointer text-gray-400 hover:text-rose-600"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
    ), { 
        duration: Infinity, 
        id: `alerta-${habitacion}-${minutos}` 
    });
};

function CronometroRegresivo({ habitacionNum, inicioRentaMs, ahoraServidorMs }) {
    const inicio = Number(inicioRentaMs);
    const valido = Number.isFinite(inicio) && inicio > 0;
    const finMs = inicio + DURACION_MS;

    const offset = useMemo(
        () => (ahoraServidorMs ? Number(ahoraServidorMs) - Date.now() : 0),
        [ahoraServidorMs]
    );

    const [diferencia, setDiferencia] = useState(null);
    const toast10Disparado = useRef(false);
    const toast5Disparado = useRef(false);
    const toast1Disparado = useRef(false);

    useEffect(() => {
        if (!valido) return;

        const calcular = () => {
            const restante = finMs - (Date.now() + offset);
            setDiferencia(restante);

            if (restante > 0 && restante <= ALERTA_10_MIN_MS && restante > ALERTA_5_MIN_MS && !toast10Disparado.current) {
                toast10Disparado.current = true;
                mostrarAlertaTiempo(habitacionNum, 10);
            }

            if (restante > 0 && restante <= ALERTA_5_MIN_MS && restante > ALERTA_1_MIN_MS && !toast5Disparado.current) {
                toast5Disparado.current = true;
                mostrarAlertaTiempo(habitacionNum, 5);
            }

            if (restante > 0 && restante <= ALERTA_1_MIN_MS && !toast1Disparado.current) {
                toast1Disparado.current = true;
                mostrarAlertaTiempo(habitacionNum, 1);
            }
        };

        calcular(); 
        const intervalo = setInterval(calcular, 1000);

        return () => clearInterval(intervalo);
    }, [finMs, offset, valido, habitacionNum]);

    if (!valido || diferencia === null) {
        return (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-500">
                <Clock className="h-4 w-4 shrink-0" />
                <span className="truncate">--:--:-- (sin hora de inicio)</span>
            </div>
        );
    }

    const expirado = diferencia <= 0;
    const porAgotarse = !expirado && diferencia <= ALERTA_10_MIN_MS;

    const estilo = expirado
        ? 'border-red-300 bg-red-50 text-red-700 animate-pulse'
        : porAgotarse
            ? 'border-amber-300 bg-amber-50 text-amber-700'
            : 'border-blue-200 bg-blue-50 text-blue-700';

    const horaSalida = new Date(finMs).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className={`mt-3 rounded-xl border px-3 py-2 ${estilo}`}>
            <div className="flex items-center gap-1.5 text-sm font-bold tabular-nums">
                {expirado || porAgotarse
                    ? <AlertCircle className="h-4 w-4 shrink-0" />
                    : <Clock className="h-4 w-4 shrink-0" />}
                <span className="truncate">
                    {expirado
                        ? `Excedido +${formatear(diferencia)}`
                        : `Restan ${formatear(diferencia)}`}
                </span>
            </div>
            <p className="mt-0.5 text-[11px] font-medium opacity-80">
                Sale a las {horaSalida} hrs
            </p>
        </div>
    );
}

export default function RecepcionDashboard() {
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [habitaciones, setHabitaciones] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [ahoraLocal, setAhoraLocal] = useState(Date.now());

    // Estados para Check-in y Renovación
    const [modalCheckinOpen, setModalCheckinOpen] = useState(false);
    const [modalRenovarOpen, setModalRenovarOpen] = useState(false);
    const [habitacionSeleccionada, setHabitacionSeleccionada] = useState(null);
    const [precioCobrado, setPrecioCobrado] = useState('');
    const [descripcionVehiculo, setDescripcionVehiculo] = useState(''); // NUEVO ESTADO

    const [modalCheckoutOpen, setModalCheckoutOpen] = useState(false);
    const [habitacionCheckoutId, setHabitacionCheckoutId] = useState(null);

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            const datos = JSON.parse(usuarioGuardado);
            setNombreUsuario(datos.nombre || datos.correo);
        }

        cargarHabitaciones();
        const interval = setInterval(cargarHabitaciones, 10000); 
        const reloj = setInterval(() => setAhoraLocal(Date.now()), 1000);

        return () => {
            clearInterval(interval);
            clearInterval(reloj);
        };
    }, []);

    const cargarHabitaciones = async () => {
        try {
            const res = await api.get('/habitaciones');
            setHabitaciones(res.data.habitaciones);
        } catch (error) {
            console.error('Error al cargar habitaciones', error);
        }
    };

    const imprimirTicket = (habitacion, precio, esRenovacion = false) => {
        const fechaActual = new Date().toLocaleString('es-MX', {
            dateStyle: 'short',
            timeStyle: 'medium'
        });

        const horaSalidaEstimada = new Date(Date.now() + 4 * 60 * 60 * 1000).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const titulo = esRenovacion ? "RENOVACIÓN DE ESTANCIA" : "COMPROBANTE DE ESTANCIA";

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        const documentoIframe = iframe.contentWindow.document;

        documentoIframe.write(`
            <html>
                <head>
                    <title>Ticket</title>
                    <style>
                        @page { size: 58mm auto; margin: 0; }
                        body { font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #000; width: 48mm; margin: 0 auto; padding: 2mm; text-align: center; }
                        h3 { margin: 2px 0; font-size: 13px; font-weight: bold; }
                        p { margin: 3px 0; }
                        .left { text-align: left; }
                        .divider { border-top: 1px dashed #000; margin: 5px 0; }
                        .bold { font-weight: bold; }
                        .big { font-size: 12px; }
                        .footer { font-size: 8px; margin-top: 8px; }
                    </style>
                </head>
                <body>
                    <h3>HOTEL / MOTEL</h3>
                    <p>${titulo}</p>
                    <div class="divider"></div>
                    <p class="bold big">HABITACIÓN #${habitacion.num_habitacion}</p>
                    <p>Tipo: ${habitacion.tipo}</p>
                    <div class="divider"></div>
                    <div class="left">
                        <p>Tarifa: <span class="bold">4 Horas Fijas</span></p>
                        <p>Hora Inicio: ${fechaActual}</p>
                        <p>Vence a las: <span class="bold">${horaSalidaEstimada} hrs</span></p>
                    </div>
                    <div class="divider"></div>
                    <p class="bold big">TOTAL: $${Number(precio).toFixed(2)}</p>
                    <div class="divider"></div>
                    <p class="footer">¡GRACIAS POR SU PREFERENCIA!<br>Conserve este ticket.</p>
                </body>
            </html>
        `);

        documentoIframe.close();
        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 300);
    };

    const handleCheckinSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/rentas/check-in', {
                habitacion_id: habitacionSeleccionada.id,
                precio_cobrado: precioCobrado,
                vehiculo: descripcionVehiculo // ENVIAMOS LA DESCRIPCIÓN AL BACKEND
            });

            imprimirTicket(habitacionSeleccionada, precioCobrado, false);
            toast.success("Check-in registrado con éxito");

            setModalCheckinOpen(false);
            setHabitacionSeleccionada(null);
            setPrecioCobrado('');
            setDescripcionVehiculo('');
            cargarHabitaciones();
        } catch (error) {
            console.error('Error al hacer Check-in', error);
            toast.error(error.response?.data?.message || 'No se pudo completar el Check-in');
        }
    };

    const handleRenovarSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/rentas/renovar', {
                habitacion_id: habitacionSeleccionada.id,
                precio_cobrado: precioCobrado
            });

            imprimirTicket(habitacionSeleccionada, precioCobrado, true);
            toast.success("Tiempo renovado con éxito. Cronómetro reiniciado.");

            setModalRenovarOpen(false);
            setHabitacionSeleccionada(null);
            setPrecioCobrado('');
            cargarHabitaciones();
        } catch (error) {
            console.error('Error al renovar', error);
            toast.error('No se pudo renovar la estancia');
        }
    };

    const abrirModalCheckout = (idHabitacion) => {
        setHabitacionCheckoutId(idHabitacion);
        setModalCheckoutOpen(true);
    };

    const confirmarCheckout = async () => {
        if (!habitacionCheckoutId) return;
        try {
            await api.put(`/habitaciones/${habitacionCheckoutId}/checkout`);
            toast.success("Check-out realizado correctamente");
            setModalCheckoutOpen(false);
            setHabitacionCheckoutId(null);
            cargarHabitaciones();
        } catch (error) {
            console.error('Error al hacer Check-out', error);
            setModalCheckoutOpen(false);
            toast.error('No se pudo procesar el Check-out de la habitación');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex font-sans overflow-x-hidden">
            <Toaster position="bottom-right" reverseOrder={false} toastOptions={{ duration: 5000 }} />

            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} rol="recepcion" />

            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>

                <header className="bg-white text-black flex items-center justify-between h-16 px-6 border-b border-gray-200 shadow-sm sticky top-0 z-20">
                    <h1 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                        Panel de Recepción <span className="text-sm font-normal text-gray-500 hidden sm:inline"> - Control de Estancias (4 Horas)</span>
                    </h1>
                    <span className="text-sm font-medium text-gray-600 truncate ml-2">
                        {nombreUsuario || "Recepcionista"}
                    </span>
                </header>

                <div className="p-6 sm:p-8 flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800">Listado de Habitaciones</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {habitaciones.map((h) => (
                            <div key={h.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-bold text-lg text-gray-800 flex items-center gap-1.5">
                                            <BedDouble className="w-5 h-5 text-blue-600 shrink-0" /> Hab. {h.num_habitacion}
                                        </span>
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                                            h.estado === 'LIBRE_LIMPIA' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            h.estado === 'LIBRE_SUCIA' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            h.estado === 'MANTENIMIENTO' ? 'bg-red-50 text-red-700 border-red-200' :
                                            h.estado === 'LIMPIEZA_SEMANAL' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            'bg-rose-50 text-rose-700 border-rose-200'
                                        }`}>
                                            {h.estado === 'LIBRE_LIMPIA' ? 'Vacia Limpia' : 
                                             h.estado === 'LIBRE_SUCIA' ? 'Vacia Sucia' : 
                                             h.estado === 'MANTENIMIENTO' ? 'Mantenimiento' : 
                                             h.estado === 'LIMPIEZA_SEMANAL' ? 'Limpieza Semanal' : 
                                             'Ocupada'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">Tipo: <span className="font-medium text-gray-800">{h.tipo}</span></p>
                                    <p className="text-sm text-gray-600 mb-2">Precio Base: <span className="font-medium text-gray-800">${h.precio_base}</span></p>

                                    {h.estado === 'OCUPADA' && (
                                        <CronometroRegresivo
                                            habitacionNum={h.num_habitacion}
                                            inicioRentaMs={
                                                h.inicio_renta_ms ||
                                                (h.created_at ? new Date(h.created_at).getTime() : null)
                                            }
                                            ahoraServidorMs={h.ahora_servidor_ms}
                                        />
                                    )}
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
                                    {h.estado === 'LIBRE_LIMPIA' && (
                                        <button
                                            onClick={() => {
                                                setHabitacionSeleccionada(h);
                                                setPrecioCobrado(h.precio_base);
                                                setDescripcionVehiculo(''); // Reiniciamos el campo
                                                setModalCheckinOpen(true);
                                            }}
                                            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                        >
                                            <UserCheck className="w-4 h-4 shrink-0" /> Registrar Check-in (4 hrs)
                                        </button>
                                    )}

                                    {h.estado === 'LIBRE_SUCIA' && (
                                        <div className="w-full py-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
                                            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" /> Vacia Sucia
                                        </div>
                                    )}

                                    {h.estado === 'MANTENIMIENTO' && (
                                        <div className="w-full py-2.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
                                            <Wrench className="w-4 h-4 text-red-600 shrink-0" /> En Mantenimiento
                                        </div>
                                    )}

                                    {h.estado === 'LIMPIEZA_SEMANAL' && (
                                        <div className="w-full py-2.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
                                            <CalendarCheck className="w-4 h-4 text-blue-600 shrink-0" /> Limpieza Semanal
                                        </div>
                                    )}

                                    {h.estado === 'OCUPADA' && (
                                        <div className="flex gap-2 w-full">
                                            {(() => {
                                                const inicioRenta = Number(h.inicio_renta_ms || (h.created_at ? new Date(h.created_at).getTime() : 0));
                                                const finMs = inicioRenta + DURACION_MS;
                                                const offset = h.ahora_servidor_ms ? Number(h.ahora_servidor_ms) - Date.now() : 0;
                                                const restante = finMs - (ahoraLocal + offset);
                                                const estaExpirado = restante <= 0;

                                                return (
                                                    <button
                                                        disabled={!estaExpirado}
                                                        onClick={() => {
                                                            setHabitacionSeleccionada(h);
                                                            setPrecioCobrado(h.precio_base);
                                                            setModalRenovarOpen(true);
                                                        }}
                                                        className={`flex-1 py-2.5 border rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 shadow-sm ${
                                                            estaExpirado 
                                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 cursor-pointer' 
                                                                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-75'
                                                        }`}
                                                        title={!estaExpirado ? "Disponible cuando finalice el tiempo" : "Renovar renta extra"}
                                                    >
                                                        <Clock className="w-4 h-4 shrink-0" /> Renovar
                                                    </button>
                                                );
                                            })()}

                                            <button
                                                onClick={() => abrirModalCheckout(h.id)}
                                                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                                            >
                                                <LogOut className="w-4 h-4 shrink-0" /> Check-out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* MODAL EXPRESS DE CHECK-IN */}
                {modalCheckinOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
                            <h2 className="text-lg font-bold text-gray-900 mb-1">Check-in</h2>
                            <p className="text-xs text-gray-500 mb-4">
                                Habitación #{habitacionSeleccionada?.num_habitacion} ({habitacionSeleccionada?.tipo}).
                            </p>

                            <form onSubmit={handleCheckinSubmit} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Precio a Cobrar ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={precioCobrado}
                                        readOnly
                                        className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-500 outline-none cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                                        <Car className="w-3.5 h-3.5 text-gray-500" /> Vehículo / Referencia
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Jetta Blanco"
                                        value={descripcionVehiculo}
                                        onChange={(e) => setDescripcionVehiculo(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setModalCheckinOpen(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 cursor-pointer shadow-sm"
                                    >
                                        Iniciar Renta
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL EXPRESS DE RENOVACIÓN */}
                {modalRenovarOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
                            <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-lg font-bold text-gray-900">Renovar Tiempo</h2>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">
                                Agregar otras 4 horas a la Habitación #{habitacionSeleccionada?.num_habitacion}.
                            </p>

                            <form onSubmit={handleRenovarSubmit} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Precio de Renovación ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={precioCobrado}
                                        onChange={(e) => setPrecioCobrado(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-bold text-indigo-700 outline-none focus:border-indigo-600"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setModalRenovarOpen(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 cursor-pointer shadow-sm"
                                    >
                                        Cobrar y Renovar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL DE CHECK-OUT */}
                {modalCheckoutOpen && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                                <LogOut className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 mb-1">Confirmar Check-out</h3>
                            <p className="text-xs text-gray-500 mb-6">
                                ¿Desea realizar el Check-out? La habitación pasará automáticamente a estado <span className="font-semibold text-gray-800">Sucia</span>.
                            </p>
                            <div className="flex gap-2.5 w-full">
                                <button
                                    type="button"
                                    onClick={() => setModalCheckoutOpen(false)}
                                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmarCheckout}
                                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
                                >
                                    Sí, Check-out
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}