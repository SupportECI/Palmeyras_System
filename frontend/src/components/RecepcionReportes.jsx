import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "./Sidebar";
import { Calendar, DollarSign, FileText, Filter, BedDouble, Clock } from 'lucide-react';

export default function RecepcionReportes() {
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Estados del reporte
    const [periodo, setPeriodo] = useState('dia'); // 'dia', 'semana', 'mes'
    const [resumen, setResumen] = useState({ total_estancias: 0, ingresos_totales: 0 });
    const [detalle, setDetalle] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            const datos = JSON.parse(usuarioGuardado);
            setNombreUsuario(datos.nombre || datos.correo);
        }
        cargarReporte('dia');
    }, []);

    const cargarReporte = async (tipoPeriodo) => {
        setPeriodo(tipoPeriodo);
        setLoading(true);
        try {
            const res = await api.get(`/reportes/recepcion?periodo=${tipoPeriodo}`);
            setResumen(res.data.resumen);
            setDetalle(res.data.detalle);
        } catch (error) {
            console.error("Error al cargar reportes:", error);
            alert("No se pudo obtener la información del reporte");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex font-sans">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} rol="recepcion" />

            <div className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} flex flex-col min-w-0 transition-all duration-300`}>
                <header className="bg-white text-black flex items-center justify-between h-16 px-6 border-b border-gray-200 shadow-sm">
                    <h1 className="text-lg font-semibold text-gray-800">Reportes de Recepción - Control de Estancias</h1>
                    <span className="text-sm text-gray-600">Bienvenido, {nombreUsuario || "Recepcionista"}</span>
                </header>

                <div className="p-8 flex flex-col gap-6">
                    {/* Barra de Filtros por Periodo */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-blue-600" />
                            <h3 className="font-bold text-gray-800">Filtrar Reporte por:</h3>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => cargarReporte('dia')}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${periodo === 'dia' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Hoy
                            </button>
                            <button
                                onClick={() => cargarReporte('semana')}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${periodo === 'semana' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Esta Semana
                            </button>
                            <button
                                onClick={() => cargarReporte('mes')}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${periodo === 'mes' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Este Mes
                            </button>
                        </div>
                    </div>

                    {/* Tarjetas de Resumen Rápido */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total de Estancias</p>
                                <p className="text-3xl font-black text-gray-900 mt-1">{resumen.total_estancias}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                                <BedDouble className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ingresos Totales</p>
                                <p className="text-3xl font-black text-emerald-600 mt-1">${Number(resumen.ingresos_totales).toFixed(2)}</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Desglose de Estancias */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-red-600" /> Desglose de Estancias Registradas
                            </h3>
                            <span className="text-xs text-gray-500 font-medium">Mostrando registros para el periodo seleccionado</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                                        <th className="py-3 px-6 font-semibold">Habitación</th>
                                        <th className="py-3 px-6 font-semibold">Fecha y Hora de Ingreso</th>
                                        <th className="py-3 px-6 font-semibold">Estado</th>
                                        <th className="py-3 px-6 font-semibold">Fecha y Hora de Salida</th>
                                        <th className="py-3 px-6 font-semibold text-right">Monto Cobrado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-sm">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="py-8 text-center text-gray-500">Cargando reporte...</td>
                                        </tr>
                                    ) : detalle.length > 0 ? (
                                        detalle.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition">
                                                <td className="py-3 px-6 font-bold text-gray-800 flex items-center gap-1.5">
                                                    <BedDouble className="w-4 h-4 text-red-600" /> Hab. {item.num_habitacion}
                                                </td>
                                                <td className="py-3 px-6 text-gray-600 text-xs">
                                                    {new Date(item.created_at).toLocaleString('es-MX', {
                                                        dateStyle: 'medium',
                                                        timeStyle: 'short'
                                                    })}
                                                </td>
                                                <td className="py-3 px-6">
                                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${item.estado === 'ACTIVA' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                                                        }`}>
                                                        {item.estado}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-6 text-gray-600 text-xs">
                                                    {item.fecha_checkout ? (
                                                        new Date(item.fecha_checkout).toLocaleString('es-MX', {
                                                            dateStyle: 'medium',
                                                            timeStyle: 'short'
                                                        })
                                                    ) : (
                                                        <span className="text-gray-400 italic">
                                                            {item.estado === 'ACTIVA' ? 'En curso...' : 'No registrada'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-6 text-right font-bold text-emerald-600">
                                                    ${Number(item.precio_cobrado).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="py-12 text-center text-gray-400 text-sm">
                                                No se encontraron estancias registradas en este periodo.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}