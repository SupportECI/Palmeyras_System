import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "./Sidebar";
import { User, Calendar, Eye, X, ChevronLeft, ChevronRight, ShieldCheck, Search } from 'lucide-react';

export default function AuditoriaLimpiezas() {
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Filtros
    const [filtroHabitacion, setFiltroHabitacion] = useState('');

    // Estados para el Modal / Slider de fotos
    const [sliderOpen, setSliderOpen] = useState(false);
    const [fotosSlider, setFotosSlider] = useState([]);
    const [fotoIndex, setFotoIndex] = useState(0);

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            setNombreUsuario(JSON.parse(usuarioGuardado).nombre || JSON.parse(usuarioGuardado).correo);
        }
        cargarHistorial();
    }, []);

    const cargarHistorial = async () => {
        setLoading(true);
        try {
            const res = await api.get('/limpiezas/historial'); 
            const data = res.data.limpiezas || res.data;
            setHistorial(data);
        } catch (error) {
            console.error("Error al cargar historial:", error);
        } finally {
            setLoading(false);
        }
    };

    // Función inteligente que convierte la base de datos (JSON o Base64) en un arreglo de fotos para el Slider
    const obtenerFotosArreglo = (fotoData) => {
        if (!fotoData) return [];
        try {
            const parsed = JSON.parse(fotoData);
            if (parsed.cama || parsed.bano || parsed.general) {
                const arr = [];
                if (parsed.general) arr.push({ url: parsed.general, etiqueta: 'Habitación General' });
                if (parsed.cama) arr.push({ url: parsed.cama, etiqueta: 'Área de Cama' });
                if (parsed.bano) arr.push({ url: parsed.bano, etiqueta: 'Área de Baño' });
                return arr;
            }
            return [{ url: fotoData, etiqueta: 'Evidencia General' }];
        } catch (e) {
            return [{ url: fotoData, etiqueta: 'Evidencia General' }];
        }
    };

    const historialFiltrado = historial.filter(item => {
        return item.num_habitacion?.toString().includes(filtroHabitacion) || filtroHabitacion === '';
    });

    // Controles del Slider
    const abrirSlider = (arregloFotos) => {
        if (arregloFotos.length === 0) return;
        setFotosSlider(arregloFotos);
        setFotoIndex(0);
        setSliderOpen(true);
    };

    const cerrarSlider = () => {
        setSliderOpen(false);
        setFotosSlider([]);
        setFotoIndex(0);
    };

    const fotoAnterior = (e) => {
        e.stopPropagation();
        setFotoIndex((prev) => (prev === 0 ? fotosSlider.length - 1 : prev - 1));
    };

    const fotoSiguiente = (e) => {
        e.stopPropagation();
        setFotoIndex((prev) => (prev === fotosSlider.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} rol="admin" />

            <div className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} flex flex-col min-w-0 transition-all duration-300`}>
                <header className="bg-white text-black flex items-center justify-between h-16 px-6 border-b border-gray-200 shadow-sm sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                        <h1 className="text-lg font-semibold text-gray-800">Panel de Auditoría</h1>
                    </div>
                    <span className="text-sm text-gray-600 font-medium">{nombreUsuario || "Administrador"}</span>
                </header>

                <div className="p-6 sm:p-8 max-w-5xl mx-auto w-full">
                    
                    {/* Encabezado Principal adaptado a tu diseño */}
                    <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Historial de Aseos {filtroHabitacion && `- Habitación #${filtroHabitacion}`}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Registro fotográfico y bitácora de limpiezas realizadas en el día.
                            </p>
                        </div>
                        
                        {/* Buscador de habitación */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input 
                                type="text"
                                placeholder="Buscar Hab. (Ej. 102)"
                                value={filtroHabitacion}
                                onChange={(e) => setFiltroHabitacion(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition"
                            />
                        </div>
                    </div>

                    {/* Contenedor de Tarjetas */}
                    <div className="flex flex-col gap-4">
                        {loading ? (
                            <div className="text-center py-12 text-gray-500 font-medium">Cargando bitácora...</div>
                        ) : historialFiltrado.length > 0 ? (
                            historialFiltrado.map((item, index) => {
                                const fotosArreglo = obtenerFotosArreglo(item.ruta_foto);
                                const miniatura = fotosArreglo.length > 0 ? fotosArreglo[0].url : null;
                                const tieneMultiples = fotosArreglo.length > 1;

                                return (
                                    <div key={item.id || index} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-5 items-center sm:items-start transition hover:shadow-md">
                                        
                                        {/* Thumbnail / Miniatura (Negro con ícono de ojo) */}
                                        <div 
                                            className={`relative w-full sm:w-36 h-36 rounded-xl bg-black overflow-hidden shrink-0 group flex flex-col items-center justify-center ${miniatura ? 'cursor-pointer' : ''}`}
                                            onClick={() => miniatura && abrirSlider(fotosArreglo)}
                                        >
                                            {miniatura ? (
                                                <>
                                                    <img src={miniatura} alt="Evidencia" className="w-full h-full object-cover opacity-80 group-hover:opacity-40 transition duration-300" />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                                                        <Eye className="w-8 h-8 text-white/80" />
                                                    </div>
                                                    {tieneMultiples && (
                                                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded shadow">
                                                            1 / {fotosArreglo.length}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-xs text-gray-500 font-medium">Sin foto</span>
                                            )}
                                        </div>

                                        {/* Detalles a la derecha */}
                                        <div className="flex flex-col justify-center w-full py-1">
                                            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg w-fit mb-3 ${
                                                item.tipo_limpieza === 'POST_USO' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {item.tipo_limpieza === 'POST_USO' ? 'Limpieza Post-Uso' : 'Limpieza Semanal'}
                                            </span>
                                            
                                            <div className="flex flex-col gap-2">
                                                <div className="text-sm text-gray-800 flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-500 shrink-0" />
                                                    <span><strong className="font-bold">Recamarista:</strong> {item.recamarista_nombre || 'No registrado'}</span>
                                                </div>
                                                <div className="text-sm text-gray-800 flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                                                    <span>
                                                        <strong className="font-bold">Fecha y Hora:</strong> {item.fecha_hora ? new Date(item.fecha_hora).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'medium' }) : 'No registrada'}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-800 flex items-center gap-2 mt-1">
                                                    <span className="font-medium bg-gray-100 px-2 py-1 rounded text-xs">Habitación #{item.num_habitacion}</span>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                                <p className="text-gray-500 text-sm mt-1">No se encontraron limpiezas registradas.</p>
                            </div>
                        )}
                    </div>

                </div>

                {/* MODAL / SLIDER DE IMÁGENES */}
                {sliderOpen && fotosSlider.length > 0 && (
                    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                        
                        <div className="absolute top-0 w-full p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
                            <span className="text-white font-bold text-sm bg-black/50 px-3 py-1.5 rounded-lg border border-white/10">
                                {fotosSlider[fotoIndex].etiqueta} ({fotoIndex + 1} de {fotosSlider.length})
                            </span>
                            <button onClick={cerrarSlider} className="text-white hover:text-red-400 p-2 bg-black/50 rounded-full transition cursor-pointer">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {fotosSlider.length > 1 && (
                            <button onClick={fotoAnterior} className="absolute left-2 sm:left-6 p-2 sm:p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer z-50">
                                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                            </button>
                        )}

                        <div className="relative w-full max-w-4xl max-h-[80vh] flex items-center justify-center px-12">
                            <img 
                                src={fotosSlider[fotoIndex].url} 
                                alt={fotosSlider[fotoIndex].etiqueta} 
                                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300"
                            />
                        </div>

                        {fotosSlider.length > 1 && (
                            <button onClick={fotoSiguiente} className="absolute right-2 sm:right-6 p-2 sm:p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer z-50">
                                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                            </button>
                        )}
                        
                        {fotosSlider.length > 1 && (
                            <div className="absolute bottom-6 flex gap-2">
                                {fotosSlider.map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`w-2.5 h-2.5 rounded-full transition-all ${i === fotoIndex ? 'bg-white scale-125' : 'bg-white/40'}`} 
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}