import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "./Sidebar";
import { BarChart3, FileSpreadsheet, DoorOpen, BrushCleaning, Ban } from 'lucide-react';

export default function SupervisorReportes() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [habitaciones, setHabitaciones] = useState([]);
    const [estadisticas, setEstadisticas] = useState({
        total: 0,
        libresLimpias: 0,
        libresSucias: 0,
        ocupadas: 0,
        reservadas: 0
    });

    useEffect(() => {
        const obtenerDatosReporte = async () => {
            try {
                const respuesta = await api.get('/habitaciones');
                const lista = respuesta.data.habitaciones;
                setHabitaciones(lista);

                setEstadisticas({
                    total: lista.length,
                    libresLimpias: lista.filter(h => h.estado === 'LIBRE_LIMPIA').length,
                    libresSucias: lista.filter(h => h.estado === 'LIBRE_SUCIA').length,
                    ocupadas: lista.filter(h => h.estado === 'OCUPADA').length,
                    reservadas: lista.filter(h => h.estado === 'RESERVADA').length
                });
            } catch (error) {
                console.error('Error al obtener datos para el reporte', error);
            }
        };

        obtenerDatosReporte();
    }, []);

    const exportarReporteCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,Numero,Tipo,Precio,Estado\n";
        habitaciones.forEach(h => {
            csvContent += `${h.num_habitacion},${h.tipo},${h.precio_base},${h.estado}\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "reporte_habitaciones_palmeyras.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const porcentajeOcupacion = estadisticas.total > 0 
        ? Math.round((estadisticas.ocupadas / estadisticas.total) * 100) 
        : 0;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            <div className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} flex flex-col min-w-0 transition-all duration-300`}>
                <header className="bg-white text-black flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <h1 className="text-lg font-semibold text-gray-800">Reportes del Hotel</h1>
                </header>

                <div className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Métricas de Ocupación</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Análisis del rendimiento y estado del inventario actual</p>
                        </div>
                        <button 
                            onClick={exportarReporteCSV}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium text-sm flex items-center gap-2 cursor-pointer shadow-sm"
                        >
                            <FileSpreadsheet className="w-4 h-4" /> Exportar Reporte CSV
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500">Ocupación General</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{porcentajeOcupacion}%</p>
                            </div>
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500">Disponibles</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{estadisticas.libresLimpias}</p>
                            </div>
                            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                                <DoorOpen className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500">Por Limpiar (Sucias)</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{estadisticas.libresSucias}</p>
                            </div>
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                <BrushCleaning className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500">Ocupadas</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{estadisticas.ocupadas}</p>
                            </div>
                            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                                <Ban className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100">
                            <h4 className="font-bold text-gray-800 text-base">Detalle de Habitaciones</h4>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                                        <th className="py-3 px-6 font-semibold">Habitación</th>
                                        <th className="py-3 px-6 font-semibold">Tipo</th>
                                        <th className="py-3 px-6 font-semibold">Precio Base</th>
                                        <th className="py-3 px-6 font-semibold">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {habitaciones.map((h) => (
                                        <tr key={h.id} className="hover:bg-gray-50/50 transition">
                                            <td className="py-3.5 px-6 font-medium text-gray-800">Hab. {h.num_habitacion}</td>
                                            <td className="py-3.5 px-6 text-gray-600">{h.tipo}</td>
                                            <td className="py-3.5 px-6 text-gray-600">${h.precio_base}</td>
                                            <td className="py-3.5 px-6">
                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                                                    h.estado === 'LIBRE_LIMPIA' ? 'bg-green-100 text-green-700' : 
                                                    h.estado === 'LIBRE_SUCIA' ? 'bg-yellow-100 text-yellow-700' : 
                                                    h.estado === 'OCUPADA' ? 'bg-red-100 text-red-700' : 
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {h.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}