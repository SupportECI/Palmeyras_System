import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "./Sidebar";
import { Sparkles, CheckCircle2, BedSingle, AlertCircle, Wrench, CalendarCheck } from 'lucide-react';

export default function RecamaristaDashboard() {
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [habitacionesAtencion, setHabitacionesAtencion] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Estados para los modales de checklist
    const [modalPostUsoOpen, setModalPostUsoOpen] = useState(false);
    const [modalSemanalOpen, setModalSemanalOpen] = useState(false);
    const [habitacionSeleccionada, setHabitacionSeleccionada] = useState(null);

    // 1. Checklist de Limpieza Post-Uso (9 puntos obligatorios)
    const [checksPostUso, setChecksPostUso] = useState({
        sabanas: false,
        fundas: false,
        cubrecolchon: false,
        limpiezaPisos: false,
        papelBano: false,
        toallas: false,
        aromatizante: false,
        jabon: false,
        limpiezaBano: false
    });

    // 2. Checklist de Limpieza Semanal (12 puntos obligatorios solicitados)
    const [checksSemanal, setChecksSemanal] = useState({
        limpiezaGeneral: false,
        ventanas: false,
        ventiladores: false,
        vidrios: false,
        televisores: false,
        hongos: false,
        focos: false,
        cortinas: false,
        internet: false,
        tvRevision: false,
        pilasControles: false,
        sabanasYBlancos: false
    });

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            const datos = JSON.parse(usuarioGuardado);
            setNombreUsuario(datos.nombre || datos.correo);
        }
        cargarHabitacionesPendientes();

        // Actualizar cada 30 segundos para reflejar si el supervisor marca una limpieza semanal nueva
        const intervalo = setInterval(cargarHabitacionesPendientes, 30000);
        return () => clearInterval(intervalo);
    }, []);

    const cargarHabitacionesPendientes = async () => {
        try {
            const respuesta = await api.get('/habitaciones');
            // La recamarista visualiza y atiende: LIBRE_SUCIA (post-uso), LIMPIEZA_SEMANAL y MANTENIMIENTO (informativo)
            const filtradas = respuesta.data.habitaciones.filter(h => 
                h.estado === 'LIBRE_SUCIA' || h.estado === 'LIMPIEZA_SEMANAL' || h.estado === 'MANTENIMIENTO'
            );
            setHabitacionesAtencion(filtradas);
        } catch (error) {
            console.error('Error al cargar habitaciones pendientes', error);
        }
    };

    // --- MANEJO DE LIMPIEZA POST-USO ---
    const abrirModalPostUso = (habitacion) => {
        setHabitacionSeleccionada(habitacion);
        setChecksPostUso({ sabanas: false, fundas: false, cubrecolchon: false, limpiezaPisos: false, papelBano: false, toallas: false, aromatizante: false, jabon: false, limpiezaBano: false });
        setModalPostUsoOpen(true);
    };

    const todosPostUsoSeleccionados = Object.values(checksPostUso).every(Boolean);

    const confirmarLimpiezaPostUso = async (e) => {
        e.preventDefault();
        if (!todosPostUsoSeleccionados) {
            alert('Debe completar todos los puntos del protocolo de limpieza post-uso.');
            return;
        }

        try {
            const usuario = JSON.parse(localStorage.getItem('usuario'));
            await api.post(`/habitaciones/${habitacionSeleccionada.id}/completar-limpieza`, {
                tipo_limpieza: 'POST_USO',
                recamarista_id: usuario?.id,
                checks: checksPostUso
            });

            setModalPostUsoOpen(false);
            setHabitacionSeleccionada(null);
            cargarHabitacionesPendientes();
        } catch (error) {
            console.error('Error al completar limpieza post-uso', error);
            alert('No se pudo registrar la limpieza');
        }
    };

    // --- MANEJO DE LIMPIEZA SEMANAL ---
    const abrirModalSemanal = (habitacion) => {
        setHabitacionSeleccionada(habitacion);
        setChecksSemanal({ limpiezaGeneral: false, ventanas: false, ventiladores: false, vidrios: false, televisores: false, hongos: false, focos: false, cortinas: false, internet: false, tvRevision: false, pilasControles: false, sabanasYBlancos: false });
        setModalSemanalOpen(true);
    };

    const todosSemanalSeleccionados = Object.values(checksSemanal).every(Boolean);

    const confirmarLimpiezaSemanal = async (e) => {
        e.preventDefault();
        if (!todosSemanalSeleccionados) {
            alert('Debe completar todos los puntos de la limpieza semanal.');
            return;
        }

        try {
            const usuario = JSON.parse(localStorage.getItem('usuario'));
            await api.post(`/habitaciones/${habitacionSeleccionada.id}/completar-limpieza`, {
                tipo_limpieza: 'SEMANAL',
                recamarista_id: usuario?.id,
                checks: checksSemanal
            });

            setModalSemanalOpen(false);
            setHabitacionSeleccionada(null);
            cargarHabitacionesPendientes();
        } catch (error) {
            console.error('Error al completar limpieza semanal', error);
            alert('No se pudo registrar la limpieza semanal');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} rol="recamarista" />

            <div className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} flex flex-col min-w-0 transition-all duration-300`}>
                <header className="bg-white text-black flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <h1 className="text-lg font-semibold text-gray-800">Panel de Recámara y Mantenimiento</h1>
                    <span className="text-sm text-gray-600">Bienvenida, {nombreUsuario || "Recamarista"}</span>
                </header>

                <div className="p-6">
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Habitaciones Requiriendo Atención</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Gestión de limpiezas post-uso, mantenimientos preventivos semanales ordenados por supervisión y reportes.</p>
                        </div>
                        <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 font-bold rounded-xl text-xs">
                            Pendientes: {habitacionesAtencion.length}
                        </span>
                    </div>

                    {/* CUADRÍCULA DE HABITACIONES PENDIENTES */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {habitacionesAtencion.length > 0 ? (
                            habitacionesAtencion.map((h) => (
                                <div key={h.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-lg text-gray-800">Hab. {h.num_habitacion}</span>
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                                                h.estado === 'LIBRE_SUCIA' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                                h.estado === 'LIMPIEZA_SEMANAL' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                                'bg-red-100 text-red-800 border-red-300'
                                            }`}>
                                                {h.estado === 'LIBRE_SUCIA' ? 'Por Limpiar (Post-Uso)' : h.estado === 'LIMPIEZA_SEMANAL' ? 'Limpieza Semanal' : 'En Mantenimiento'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">Tipo: <span className="font-medium text-gray-800">{h.tipo}</span></p>
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-gray-100 flex justify-end">
                                        {h.estado === 'LIBRE_SUCIA' && (
                                            <button
                                                onClick={() => abrirModalPostUso(h)}
                                                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                            >
                                                <Sparkles className="w-4 h-4" /> Limpieza Post-Uso (9 Checks)
                                            </button>
                                        )}
                                        {h.estado === 'LIMPIEZA_SEMANAL' && (
                                            <button
                                                onClick={() => abrirModalSemanal(h)}
                                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                            >
                                                <CalendarCheck className="w-4 h-4" /> Limpieza Semanal (12 Checks)
                                            </button>
                                        )}
                                        {h.estado === 'MANTENIMIENTO' && (
                                            <div className="w-full text-center py-2 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-red-200">
                                                <Wrench className="w-4 h-4" /> Bloqueada por Mantenimiento
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
                                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-base font-bold text-gray-800">¡Todo impecable!</h3>
                                <p className="text-gray-500 text-xs mt-1">No hay habitaciones pendientes de limpieza o mantenimiento en este momento.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* MODAL 1: LIMPIEZA POST-USO (9 PUNTOS) */}
                {modalPostUsoOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center">
                                    <BedSingle className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">Limpieza Post-Uso - Hab. #{habitacionSeleccionada?.num_habitacion}</h2>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">Confirme el cumplimiento de los 9 puntos obligatorios:</p>

                            <form onSubmit={confirmarLimpiezaPostUso} className="flex flex-col gap-2.5">
                                {[
                                    { key: 'sabanas', label: 'Cambio de sábanas' },
                                    { key: 'fundas', label: 'Cambio de fundas de almohada' },
                                    { key: 'cubrecolchon', label: 'Cambio de cubrecolchón' },
                                    { key: 'limpiezaPisos', label: 'Limpieza de habitación (barrido y trapeado)' },
                                    { key: 'papelBano', label: 'Cambio de papel de baño' },
                                    { key: 'toallas', label: 'Cambio de toallas (doblaje)' },
                                    { key: 'aromatizante', label: 'Aplicación de aromatizante' },
                                    { key: 'jabon', label: 'Cambio de jabón de tocador' },
                                    { key: 'limpiezaBano', label: 'Limpieza de baño' }
                                ].map((item) => (
                                    <label key={item.key} className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                                        <input
                                            type="checkbox"
                                            checked={checksPostUso[item.key]}
                                            onChange={(e) => setChecksPostUso({ ...checksPostUso, [item.key]: e.target.checked })}
                                            className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                                        />
                                        <span className="text-xs font-medium text-gray-700">{item.label}</span>
                                    </label>
                                ))}

                                {!todosPostUsoSeleccionados && (
                                    <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 p-2.5 rounded-xl text-xs mt-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>Debe marcar los 9 puntos para poder liberar la habitación.</span>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 mt-4">
                                    <button type="button" onClick={() => setModalPostUsoOpen(false)} className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">Cancelar</button>
                                    <button type="submit" disabled={!todosPostUsoSeleccionados} className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition ${todosPostUsoSeleccionados ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer shadow-sm' : 'bg-gray-300 cursor-not-allowed'}`}>
                                        Guardar y Liberar Habitación
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL 2: LIMPIEZA SEMANAL (12 PUNTOS) */}
                {modalSemanalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center">
                                    <CalendarCheck className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">Limpieza Semanal - Hab. #{habitacionSeleccionada?.num_habitacion}</h2>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">Protocolo de mantenimiento preventivo y sanitización (12 puntos obligatorios):</p>

                            <form onSubmit={confirmarLimpiezaSemanal} className="flex flex-col gap-2.5">
                                {[
                                    { key: 'limpiezaGeneral', label: 'Limpieza general (barrido y trapeado)' },
                                    { key: 'ventanas', label: 'Limpieza de ventanas' },
                                    { key: 'ventiladores', label: 'Limpieza de ventiladores' },
                                    { key: 'vidrios', label: 'Limpieza de vidrios' },
                                    { key: 'televisores', label: 'Limpieza de televisores' },
                                    { key: 'hongos', label: 'Limpieza de hongo' },
                                    { key: 'focos', label: 'Limpieza de focos' },
                                    { key: 'cortinas', label: 'Limpieza de cortinas' },
                                    { key: 'internet', label: 'Revisión de internet' },
                                    { key: 'tvRevision', label: 'Revisión de televisión' },
                                    { key: 'pilasControles', label: 'Revision/cambio de pilas de controles (tv/ac)' },
                                    { key: 'sabanasYBlancos', label: 'Cambio de blancos y sábanas' }
                                ].map((item) => (
                                    <label key={item.key} className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                                        <input
                                            type="checkbox"
                                            checked={checksSemanal[item.key]}
                                            onChange={(e) => setChecksSemanal({ ...checksSemanal, [item.key]: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="text-xs font-medium text-gray-700">{item.label}</span>
                                    </label>
                                ))}

                                {!todosSemanalSeleccionados && (
                                    <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 p-2.5 rounded-xl text-xs mt-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>Debe completar los 12 puntos de mantenimiento preventivo semanal.</span>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 mt-4">
                                    <button type="button" onClick={() => setModalSemanalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">Cancelar</button>
                                    <button type="submit" disabled={!todosSemanalSeleccionados} className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition ${todosSemanalSeleccionados ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-sm' : 'bg-gray-300 cursor-not-allowed'}`}>
                                        Completar y Liberar Habitación
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