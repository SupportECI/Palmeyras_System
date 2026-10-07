import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "./Sidebar";
import { DollarSign, FileText, Filter, BedDouble, ShieldCheck } from 'lucide-react';

export default function AdminReportes() {
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [periodo, setPeriodo] = useState('dia');
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
            alert("No se pudo obtener la información financiera");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex font-sans">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            <div className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} flex flex-col min-w-0 transition-all duration-300`}>
                <header className="bg-white text-black flex items-center justify-between h-16 px-6 border-b border-gray-200 shadow-sm">
                    <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-600" /> Reportes Financieros y Administrativos
                    </h1>
                    <span className="text-sm text-gray-600">Administrador: {nombreUsuario || "Admin"}</span>
                </header>

                <div className="p-8 flex flex-col gap-6">
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-indigo-600" />
                            <h3 className="font-bold text-gray-800">Corte Financiero por:</h3>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => cargarReporte('dia')}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${periodo === 'dia' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Hoy
                            </button>
                            <button
                                onClick={() => cargarReporte('semana')}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${periodo === 'semana' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Semana
                            </button>
                            <button
                                onClick={() => cargarReporte('mes')}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${periodo === 'mes' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Mes
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Total Estancias del Periodo</p>
                                <p className="text-3xl font-black text-gray-900 mt-1">{resumen.total_estancias}</p>
                            </div>
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                <BedDouble className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Ingresos Totales Acumulados</p>
                                <p className="text-3xl font-black text-emerald-600 mt-1">${Number(resumen.ingresos_totales).toFixed(2)}</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-200">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" /> Registro General de Ingresos por Estancia
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-200">
                                        <th className="py-3 px-6">ID Renta</th>
                                        <th className="py-3 px-6">Habitación</th>
                                        <th className="py-3 px-6">Fecha de Transacción</th>
                                        <th className="py-3 px-6">Estado</th>
                                        <th className="py-3 px-6 text-right">Monto Recaudado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-sm">
                                    {loading ? (
                                        <tr><td colSpan="5" className="py-6 text-center text-gray-500">Cargando datos...</td></tr>
                                    ) : detalle.length > 0 ? (
                                        detalle.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="py-3 px-6 font-mono text-xs text-gray-500">#{item.id}</td>
                                                <td className="py-3 px-6 font-bold text-gray-800">Hab. {item.num_habitacion}</td>
                                                <td className="py-3 px-6 text-xs text-gray-600">{new Date(item.created_at).toLocaleString('es-MX')}</td>
                                                <td className="py-3 px-6"><span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">{item.estado}</span></td>
                                                <td className="py-3 px-6 text-right font-bold text-emerald-600">${Number(item.precio_cobrado).toFixed(2)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="py-8 text-center text-gray-400">No existen movimientos en este periodo.</td></tr>
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