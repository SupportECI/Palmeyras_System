import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "./Sidebar";
import { DollarSign, FileText, Filter, BedDouble, Calendar, Download, AlertTriangle } from 'lucide-react';

export default function SupervisorReportes() {
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Estados del reporte y rango de fechas
    const [periodo, setPeriodo] = useState('dia');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [resumen, setResumen] = useState({ total_estancias: 0, ingresos_totales: 0 });
    const [detalle, setDetalle] = useState([]);
    const [loading, setLoading] = useState(false);

    // Estado para el modal de alertas personalizado
    const [alertaModal, setAlertaModal] = useState({ isOpen: false, mensaje: '' });

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            const datos = JSON.parse(usuarioGuardado);
            setNombreUsuario(datos.nombre || datos.correo);
        }
        cargarReporte('dia');
    }, []);

    const cargarReporte = async (tipoPeriodo, inicio = '', fin = '') => {
        setPeriodo(tipoPeriodo);
        if (tipoPeriodo !== 'personalizado') {
            setFechaInicio('');
            setFechaFin('');
        }
        setLoading(true);
        try {
            let url = `/reportes/recepcion?periodo=${tipoPeriodo}`;
            if (tipoPeriodo === 'personalizado' && inicio && fin) {
                url = `/reportes/recepcion?periodo=personalizado&fecha_inicio=${inicio}&fecha_fin=${fin}`;
            }
            const res = await api.get(url);
            setResumen(res.data.resumen);
            setDetalle(res.data.detalle);
        } catch (error) {
            console.error("Error al cargar reportes:", error);
            setAlertaModal({ isOpen: true, mensaje: "No se pudo obtener la información de la auditoría en este momento." });
        } finally {
            setLoading(false);
        }
    };

    const handleBuscarRango = () => {
        if (!fechaInicio || !fechaFin) {
            setAlertaModal({ isOpen: true, mensaje: "Por favor seleccione ambas fechas (De y A) para poder filtrar la auditoría." });
            return;
        }
        if (fechaInicio > fechaFin) {
            setAlertaModal({ isOpen: true, mensaje: "La fecha de inicio no puede ser posterior a la fecha de fin." });
            return;
        }
        cargarReporte('personalizado', fechaInicio, fechaFin);
    };

    const exportarAExcel = () => {
        if (detalle.length === 0) {
            setAlertaModal({ isOpen: true, mensaje: "No hay datos registrados en este periodo para exportar a Excel." });
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += "ID Renta,Habitacion,Fecha Ingreso,Estado,Fecha Salida,Monto Cobrado\n";

        detalle.forEach(item => {
            const id = item.id || '';
            const hab = `Hab. ${item.num_habitacion || item.numero || 'N/A'}`;
            const ingreso = item.created_at ? new Date(item.created_at).toLocaleString('es-MX') : '';
            const estado = item.estado || '';
            const salida = item.fecha_checkout ? new Date(item.fecha_checkout).toLocaleString('es-MX') : (item.estado === 'ACTIVA' ? 'En curso' : 'N/A');
            const monto = item.precio_cobrado || 0;

            csvContent += `"${id}","${hab}","${ingreso}","${estado}","${salida}","$${Number(monto).toFixed(2)}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Reporte_Supervisor_${periodo}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex font-sans">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            <div className={`flex-1 ${isCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-64'} flex flex-col min-w-0 transition-all duration-300 pb-24 md:pb-0`}>
                <header className="bg-white text-black flex items-center justify-between h-16 px-6 border-b border-gray-200 shadow-sm">
                    <h1 className="text-lg font-semibold text-gray-800">Reportes y Auditoría - Supervisor</h1>
                    <span className="text-sm text-gray-600 hidden sm:block">Bienvenido, {nombreUsuario || "Supervisor"}</span>
                </header>

                <div className="p-4 sm:p-8 flex flex-col gap-6">

                    {/* Barra de Filtros */}
                    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-blue-600 shrink-0" />
                            <h3 className="font-bold text-gray-800 text-sm">Filtrar Auditoría por:</h3>
                        </div>

                        {/* Botones de Período (Hoy, Semana, Mes) */}
                        <div className="grid grid-cols-3 gap-2 w-full">
                            <button
                                onClick={() => cargarReporte('dia')}
                                className={`py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-center ${periodo === 'dia' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Hoy
                            </button>
                            <button
                                onClick={() => cargarReporte('semana')}
                                className={`py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-center ${periodo === 'semana' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Semana
                            </button>
                            <button
                                onClick={() => cargarReporte('mes')}
                                className={`py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-center ${periodo === 'mes' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Mes
                            </button>
                        </div>

                        {/* Selector de Rango de Fechas */}
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-gray-50 border border-gray-200 p-3 rounded-2xl w-full">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                                <div className="flex items-center gap-2 w-full">
                                    <Calendar className="w-4 h-4 text-blue-600 shrink-0 hidden sm:block" />
                                    <span className="font-bold text-gray-600 shrink-0 w-6">De:</span>
                                    <input
                                        type="date"
                                        value={fechaInicio}
                                        onChange={(e) => setFechaInicio(e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-2 font-medium text-gray-700 outline-none focus:border-blue-600 shadow-2xs text-xs"
                                    />
                                </div>
                                <div className="flex items-center gap-2 w-full">
                                    <span className="font-bold text-gray-600 shrink-0 w-6">A:</span>
                                    <input
                                        type="date"
                                        value={fechaFin}
                                        onChange={(e) => setFechaFin(e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-2 font-medium text-gray-700 outline-none focus:border-blue-600 shadow-2xs text-xs"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleBuscarRango}
                                className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs shrink-0"
                            >
                                Filtrar Rango
                            </button>
                        </div>

                        {/* Botón de Exportar a Excel */}
                        <button
                            onClick={exportarAExcel}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                            <Download className="w-4 h-4" /> Exportar Excel
                        </button>
                    </div>

                    {/* Tarjetas de Resumen */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Estancias Totales</p>
                                <p className="text-3xl font-black text-gray-900 mt-1">{resumen.total_estancias}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                <BedDouble className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Ingresos Registrados</p>
                                <p className="text-3xl font-black text-emerald-600 mt-1">${Number(resumen.ingresos_totales).toFixed(2)}</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Desglose de Estancias */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" /> Desglose Operativo de Estancias
                            </h3>
                            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
                                {periodo === 'personalizado' ? `Rango: ${fechaInicio} al ${fechaFin}` : `Periodo: ${periodo.toUpperCase()}`}
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                                        <th className="py-3 px-6 font-semibold">Habitación</th>
                                        <th className="py-3 px-6 font-semibold">Fecha y Hora de Ingreso</th>
                                        <th className="py-3 px-6 font-semibold">Estado</th>
                                        <th className="py-3 px-6 font-semibold">Fecha y Hora de Salida</th>
                                        <th className="py-3 px-6 font-semibold text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-sm">
                                    {loading ? (
                                        <tr><td colSpan="5" className="py-8 text-center text-gray-500">Cargando...</td></tr>
                                    ) : detalle.length > 0 ? (
                                        detalle.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition">
                                                <td className="py-3 px-6 font-bold text-gray-800 flex items-center gap-1.5 min-w-30">
                                                    <BedDouble className="w-4 h-4 text-blue-600 shrink-0" /> Hab. {item.num_habitacion || item.numero || 'N/A'}
                                                </td>
                                                <td className="py-3 px-6 text-xs text-gray-600 min-w-37.5">
                                                    {new Date(item.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </td>
                                                <td className="py-3 px-6 min-w-30">
                                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border inline-block ${item.estado === 'ACTIVA' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                                        {item.estado}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-6 text-xs text-gray-600 min-w-37.5">
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
                                                <td className="py-3 px-6 text-right font-bold text-emerald-600 min-w-30">
                                                    ${Number(item.precio_cobrado).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="py-12 text-center text-gray-400 text-sm">Sin registros para este periodo.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* MODAL DE ALERTAS PERSONALIZADO */}
                {alertaModal.isOpen && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 flex flex-col items-center text-center">
                            
                            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-red-50 text-red-600">
                                <AlertTriangle className="w-6 h-6" />
                            </div>

                            <h3 className="text-base font-bold text-gray-900 mb-2">
                                Aviso del Sistema
                            </h3>

                            <p className="text-sm text-gray-500 mb-6">
                                {alertaModal.mensaje}
                            </p>

                            <button
                                type="button"
                                onClick={() => setAlertaModal({ isOpen: false, mensaje: '' })}
                                className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm cursor-pointer bg-red-600 hover:bg-red-700"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}