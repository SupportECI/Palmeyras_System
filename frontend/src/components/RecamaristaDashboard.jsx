import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import Sidebar from "./Sidebar";
import { Sparkles, CheckCircle2, BedSingle, AlertCircle, Wrench, CalendarCheck, Camera, X, RefreshCw, Bath, DoorOpen, Bed } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Configuración de secciones para mapear fácilmente
const seccionesPostUsoConfig = [
    {
        id: 'cama', titulo: 'Área de Cama', icono: <Bed className="w-4 h-4" />,
        items: [
            { key: 'sabanas', label: 'Cambio de sábanas' },
            { key: 'fundas', label: 'Cambio de fundas de almohada' },
            { key: 'cubrecolchon', label: 'Cambio de cubrecolchón' }
        ]
    },
    {
        id: 'bano', titulo: 'Área de Baño', icono: <Bath className="w-4 h-4" />,
        items: [
            { key: 'limpiezaBano', label: 'Limpieza profunda de baño' },
            { key: 'papelBano', label: 'Cambio de papel higiénico' },
            { key: 'toallas', label: 'Cambio de toallas (doblaje)' },
            { key: 'jabon', label: 'Cambio de jabón de tocador' }
        ]
    },
    {
        id: 'general', titulo: 'Habitación en General', icono: <DoorOpen className="w-4 h-4" />,
        items: [
            { key: 'limpiezaPisos', label: 'Limpieza de habitación (barrido y trapeado)' },
            { key: 'aromatizante', label: 'Aplicación de aromatizante' }
        ]
    }
];

const seccionesSemanalConfig = [
    {
        id: 'cama', titulo: 'Área de Cama', icono: <Bed className="w-4 h-4" />,
        items: [
            { key: 'sabanasYBlancos', label: 'Cambio de blancos y sábanas' }
        ]
    },
    {
        id: 'bano', titulo: 'Área de Baño', icono: <Bath className="w-4 h-4" />,
        items: [
            { key: 'hongos', label: 'Limpieza de hongo y sarro' }
        ]
    },
    {
        id: 'general', titulo: 'Habitación en General', icono: <DoorOpen className="w-4 h-4" />,
        items: [
            { key: 'limpiezaGeneral', label: 'Limpieza general (barrido y trapeado)' },
            { key: 'ventanas', label: 'Limpieza de ventanas' },
            { key: 'ventiladores', label: 'Limpieza de ventiladores' },
            { key: 'vidrios', label: 'Limpieza de vidrios' },
            { key: 'televisores', label: 'Limpieza de televisores' },
            { key: 'focos', label: 'Limpieza de focos' },
            { key: 'cortinas', label: 'Limpieza de cortinas' },
            { key: 'internet', label: 'Revisión de internet' },
            { key: 'tvRevision', label: 'Revisión de televisión' },
            { key: 'pilasControles', label: 'Revision/cambio de pilas de controles (tv/ac)' }
        ]
    }
];

export default function RecamaristaDashboard() {
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [habitacionesAtencion, setHabitacionesAtencion] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Modales y selección
    const [modalPostUsoOpen, setModalPostUsoOpen] = useState(false);
    const [modalSemanalOpen, setModalSemanalOpen] = useState(false);
    const [habitacionSeleccionada, setHabitacionSeleccionada] = useState(null);

    // Estado para guardar las 3 fotos por separado
    const [fotos, setFotos] = useState({ cama: null, bano: null, general: null });
    
    // Controla qué sección tiene la cámara abierta ('cama' | 'bano' | 'general' | null)
    const [camaraActiva, setCamaraActiva] = useState(null); 
    
    const videoRef = useRef(null);
    const mediaStreamRef = useRef(null);

    const [checksPostUso, setChecksPostUso] = useState({ sabanas: false, fundas: false, cubrecolchon: false, limpiezaPisos: false, papelBano: false, toallas: false, aromatizante: false, jabon: false, limpiezaBano: false });
    const [checksSemanal, setChecksSemanal] = useState({ limpiezaGeneral: false, ventanas: false, ventiladores: false, vidrios: false, televisores: false, hongos: false, focos: false, cortinas: false, internet: false, tvRevision: false, pilasControles: false, sabanasYBlancos: false });

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) setNombreUsuario(JSON.parse(usuarioGuardado).nombre || JSON.parse(usuarioGuardado).correo);
        
        cargarHabitacionesPendientes();
        const intervalo = setInterval(cargarHabitacionesPendientes, 30000);
        return () => {
            clearInterval(intervalo);
            detenerCamara();
        };
    }, []);

    // Conectar el video al stream cada vez que se active una cámara nueva
    useEffect(() => {
        if (camaraActiva && videoRef.current && mediaStreamRef.current) {
            videoRef.current.srcObject = mediaStreamRef.current;
        }
    }, [camaraActiva]);

    const cargarHabitacionesPendientes = async () => {
        try {
            const respuesta = await api.get('/habitaciones');
            const filtradas = respuesta.data.habitaciones.filter(h => 
                h.estado === 'LIBRE_SUCIA' || h.estado === 'LIMPIEZA_SEMANAL' || h.estado === 'MANTENIMIENTO'
            );
            setHabitacionesAtencion(filtradas);
        } catch (error) {
            console.error('Error al cargar', error);
        }
    };

    // --- MANEJO DE CÁMARA POR SECCIÓN ---
    const iniciarCamara = async (seccionId) => {
        detenerCamara(); // Detener si había otra encendida
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }, 
                audio: false 
            });
            mediaStreamRef.current = stream;
            setCamaraActiva(seccionId);
        } catch (error) {
            console.error("Error cámara:", error);
            toast.error("No se detectó cámara disponible.");
        }
    };

    const detenerCamara = () => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        setCamaraActiva(null);
    };

    const tomarFoto = (seccionId) => {
        const video = videoRef.current;
        if (!video) return;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const maxWidth = 500; // Reducimos resolución para que 3 fotos pesen poco
        const scaleSize = maxWidth / video.videoWidth;
        canvas.width = maxWidth;
        canvas.height = (video.videoHeight || 480) * scaleSize;

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imagenBase64 = canvas.toDataURL('image/jpeg', 0.6); // Compresión 60%

        setFotos(prev => ({ ...prev, [seccionId]: imagenBase64 }));
        detenerCamara();
    };

    const reiniciarFoto = (seccionId) => {
        setFotos(prev => ({ ...prev, [seccionId]: null }));
        iniciarCamara(seccionId);
    };

    // --- MODALES ---
    const abrirModalPostUso = (habitacion) => {
        setHabitacionSeleccionada(habitacion);
        setChecksPostUso({ sabanas: false, fundas: false, cubrecolchon: false, limpiezaPisos: false, papelBano: false, toallas: false, aromatizante: false, jabon: false, limpiezaBano: false });
        setFotos({ cama: null, bano: null, general: null });
        setCamaraActiva(null);
        setModalPostUsoOpen(true);
    };

    const abrirModalSemanal = (habitacion) => {
        setHabitacionSeleccionada(habitacion);
        setChecksSemanal({ limpiezaGeneral: false, ventanas: false, ventiladores: false, vidrios: false, televisores: false, hongos: false, focos: false, cortinas: false, internet: false, tvRevision: false, pilasControles: false, sabanasYBlancos: false });
        setFotos({ cama: null, bano: null, general: null });
        setCamaraActiva(null);
        setModalSemanalOpen(true);
    };

    const cerrarModales = () => {
        detenerCamara();
        setModalPostUsoOpen(false);
        setModalSemanalOpen(false);
        setHabitacionSeleccionada(null);
    };

    // Validaciones
    const todasFotosTomadas = fotos.cama && fotos.bano && fotos.general;
    const todosPostUsoSeleccionados = Object.values(checksPostUso).every(Boolean) && todasFotosTomadas;
    const todosSemanalSeleccionados = Object.values(checksSemanal).every(Boolean) && todasFotosTomadas;

    const guardarLimpieza = async (tipo, checks) => {
        try {
            const usuario = JSON.parse(localStorage.getItem('usuario'));
            await api.post(`/habitaciones/${habitacionSeleccionada.id}/completar-limpieza`, {
                tipo_limpieza: tipo,
                recamarista_id: usuario?.id,
                checks: checks,
                // Agrupamos las 3 fotos en un solo JSON en formato texto para guardarlo en la columna
                foto_base64: JSON.stringify(fotos) 
            });

            toast.success(`Limpieza ${tipo.toLowerCase()} registrada y habitación liberada.`);
            cerrarModales();
            cargarHabitacionesPendientes();
        } catch (error) {
            console.error('Error al guardar', error);
            toast.error('No se pudo registrar la limpieza');
        }
    };

    // Componente reutilizable para renderizar cada sección del formulario
    const renderSeccion = (seccion, checksState, setChecksState) => (
        <div key={seccion.id} className="mb-6 p-4 rounded-xl border border-gray-200 bg-gray-50/50 shadow-sm">
            <div className="flex items-center gap-2 mb-3 border-b border-gray-200 pb-2">
                <div className="p-1.5 bg-white rounded-lg shadow-sm text-purple-600">{seccion.icono}</div>
                <h3 className="font-bold text-gray-800 text-sm">{seccion.titulo}</h3>
            </div>
            
            <div className="flex flex-col gap-2 mb-4">
                {seccion.items.map((item) => (
                    <label key={item.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                        <input
                            type="checkbox"
                            checked={checksState[item.key]}
                            onChange={(e) => setChecksState({ ...checksState, [item.key]: e.target.checked })}
                            className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-gray-700">{item.label}</span>
                    </label>
                ))}
            </div>

            <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Evidencia de {seccion.titulo}</span>
                {fotos[seccion.id] ? (
                    <div className="relative w-full h-32 sm:h-40 rounded-xl overflow-hidden border border-gray-200 bg-black">
                        <img src={fotos[seccion.id]} alt="Evidencia" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => reiniciarFoto(seccion.id)} className="absolute bottom-2 right-2 px-3 py-1.5 bg-gray-900/70 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 backdrop-blur-sm hover:bg-gray-900 transition">
                            <RefreshCw className="w-3.5 h-3.5"/> Rehacer
                        </button>
                    </div>
                ) : camaraActiva === seccion.id ? (
                    <div className="relative w-full h-40 sm:h-48 rounded-xl overflow-hidden border border-gray-200 bg-black">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <button type="button" onClick={() => tomarFoto(seccion.id)} className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-purple-600 text-white rounded-full text-xs font-bold flex items-center gap-2 shadow-lg hover:bg-purple-700 transition">
                            <Camera className="w-4 h-4"/> Capturar
                        </button>
                        <button type="button" onClick={detenerCamara} className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/80 transition text-white rounded-full">
                            <X className="w-4 h-4"/>
                        </button>
                    </div>
                ) : (
                    <button type="button" onClick={() => iniciarCamara(seccion.id)} className="w-full py-5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 transition flex flex-col items-center justify-center gap-1.5">
                        <Camera className="w-6 h-6" />
                        <span className="text-xs font-semibold">Activar cámara</span>
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <Toaster position="bottom-right" reverseOrder={false} />
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
                            <p className="text-xs text-gray-500 mt-0.5">Gestión de limpiezas dividida por secciones y evidencia fotográfica.</p>
                        </div>
                        <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 font-bold rounded-xl text-xs">
                            Pendientes: {habitacionesAtencion.length}
                        </span>
                    </div>

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
                                                {h.estado === 'LIBRE_SUCIA' ? 'Por Limpiar' : h.estado === 'LIMPIEZA_SEMANAL' ? 'Semanal' : 'Mantenimiento'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">Tipo: <span className="font-medium text-gray-800">{h.tipo}</span></p>
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-gray-100 flex justify-end">
                                        {h.estado === 'LIBRE_SUCIA' && (
                                            <button onClick={() => abrirModalPostUso(h)} className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm">
                                                <Sparkles className="w-4 h-4" /> Limpieza Post-Uso
                                            </button>
                                        )}
                                        {h.estado === 'LIMPIEZA_SEMANAL' && (
                                            <button onClick={() => abrirModalSemanal(h)} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm">
                                                <CalendarCheck className="w-4 h-4" /> Limpieza Semanal
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
                                <p className="text-gray-500 text-xs mt-1">No hay habitaciones pendientes de limpieza en este momento.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* MODAL 1: LIMPIEZA POST-USO */}
                {modalPostUsoOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[95vh] flex flex-col overflow-hidden">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center">
                                        <BedSingle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 leading-tight">Limpieza Post-Uso</h2>
                                        <p className="text-xs font-medium text-gray-500">Habitación #{habitacionSeleccionada?.num_habitacion}</p>
                                    </div>
                                </div>
                                <button onClick={cerrarModales} className="p-2 bg-gray-50 text-gray-400 hover:text-gray-700 rounded-full cursor-pointer transition">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto bg-white flex-1">
                                {seccionesPostUsoConfig.map(seccion => renderSeccion(seccion, checksPostUso, setChecksPostUso))}
                            </div>

                            <div className="p-5 border-t border-gray-100 bg-gray-50">
                                {!todosPostUsoSeleccionados && (
                                    <div className="flex items-center gap-1.5 text-amber-700 bg-amber-100/50 p-3 rounded-xl text-xs font-semibold mb-3 border border-amber-200/50">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>Debes marcar todos los puntos y tomar las 3 fotos para liberar la habitación.</span>
                                    </div>
                                )}
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={cerrarModales} className="px-5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer">Cancelar</button>
                                    <button 
                                        type="button" 
                                        onClick={(e) => { e.preventDefault(); guardarLimpieza('POST_USO', checksPostUso); }} 
                                        disabled={!todosPostUsoSeleccionados} 
                                        className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition ${todosPostUsoSeleccionados ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer shadow-md' : 'bg-gray-300 cursor-not-allowed'}`}
                                    >
                                        Liberar Habitación
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL 2: LIMPIEZA SEMANAL */}
                {modalSemanalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[95vh] flex flex-col overflow-hidden">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
                                        <CalendarCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 leading-tight">Mantenimiento Semanal</h2>
                                        <p className="text-xs font-medium text-gray-500">Habitación #{habitacionSeleccionada?.num_habitacion}</p>
                                    </div>
                                </div>
                                <button onClick={cerrarModales} className="p-2 bg-gray-50 text-gray-400 hover:text-gray-700 rounded-full cursor-pointer transition">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto bg-white flex-1">
                                {seccionesSemanalConfig.map(seccion => renderSeccion(seccion, checksSemanal, setChecksSemanal))}
                            </div>

                            <div className="p-5 border-t border-gray-100 bg-gray-50">
                                {!todosSemanalSeleccionados && (
                                    <div className="flex items-center gap-1.5 text-amber-700 bg-amber-100/50 p-3 rounded-xl text-xs font-semibold mb-3 border border-amber-200/50">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>Debes marcar todos los puntos y tomar las 3 fotos para liberar la habitación.</span>
                                    </div>
                                )}
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={cerrarModales} className="px-5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer">Cancelar</button>
                                    <button 
                                        type="button" 
                                        onClick={(e) => { e.preventDefault(); guardarLimpieza('SEMANAL', checksSemanal); }} 
                                        disabled={!todosSemanalSeleccionados} 
                                        className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition ${todosSemanalSeleccionados ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-md' : 'bg-gray-300 cursor-not-allowed'}`}
                                    >
                                        Liberar Habitación
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}