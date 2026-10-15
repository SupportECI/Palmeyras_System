import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "./Sidebar";
import { DollarSign, FileText, Filter, BedDouble, Calendar, Download } from 'lucide-react';

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
            alert("No se pudo obtener la información del reporte");
        } finally {
            setLoading(false);
        }
    };

    const handleBuscarRango = () => {
        if (!fechaInicio || !fechaFin) {
            alert("Por favor seleccione ambas fechas (inicio y fin).");
            return;
        }
        if (fechaInicio > fechaFin) {
            alert("La fecha de inicio no puede ser posterior a la fecha fin.");
            return;
        }
        cargarReporte('personalizado', fechaInicio, fechaFin);
    };

    // Función para exportar los datos actuales de la tabla a un archivo CSV compatible con Excel
    const exportarAExcel = () => {
        if (detalle.length === 0) {
            alert("No hay datos para exportar.");
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

            <div className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} flex flex-col min-w-0 transition-all duration-300`}>
                <header className="bg-white text-black flex items-center justify-between h-16 px-6 border-b border-gray-200 shadow-sm">
                    <h1 className="text-lg font-semibold text-gray-800">Reportes y Auditoría - Supervisor</h1>
                    <span className="text-sm text-gray-600">Bienvenido, {nombreUsuario || "Supervisor"}</span>
                </header>

                <div className="p-8 flex flex-col gap-6">
                    {/* Barra de Filtros, Rango de Fechas y Exportación */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2 w-full xl:w-auto">
                            <Filter className="w-5 h-5 text-blue-600 shrink-0" />
                            <h3 className="font-bold text-gray-800 text-sm">Filtrar Auditoría por:</h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => cargarReporte('dia')}
                                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${periodo === 'dia' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Hoy
                                </button>
                                <button
                                    onClick={() => cargarReporte('semana')}
                                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${periodo === 'semana' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Semana
                                </button>
                                <button
                                    onClick={() => cargarReporte('mes')}
                                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${periodo === 'mes' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Mes
                                </button>
                            </div>

                            {/* Selector de Rango con Calendario Desplegable Nativo */}
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
                                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                                <div className="flex items-center gap-2 text-xs text-gray-700">
                                    <span className="font-medium text-gray-500">De:</span>
                                    <input 
                                        type="date"
                                        value={fechaInicio}
                                        onChange={(e) => setFechaInicio(e.target.value)}
                                        className="bg-white border border-gray-300 rounded-lg px-2 py-1 font-medium text-gray-700 outline-none focus:border-blue-600 cursor-pointer shadow-2xs"
                                    />
                                    <span className="font-medium text-gray-500">A:</span>
                                    <input 
                                        type="date"
                                        value={fechaFin}
                                        onChange={(e) => setFechaFin(e.target.value)}
                                        className="bg-white border border-gray-300 rounded-lg px-2 py-1 font-medium text-gray-700 outline-none focus:border-blue-600 cursor-pointer shadow-2xs"
                                    />
                                </div>
                                <button
                                    onClick={handleBuscarRango}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ml-1 shadow-2xs"
                                >
                                    Filtrar
                                </button>
                            </div>

                            {/* Botón de Exportar a Excel */}
                            <button
                                onClick={exportarAExcel}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                                <Download className="w-4 h-4" /> Exportar Excel
                            </button>
                        </div>
                    </div>

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

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" /> Desglose Operativo de Estancias
                            </h3>
                            <span className="text-xs text-gray-500 font-medium">
                                {periodo === 'personalizado' ? `Rango: ${fechaInicio} al ${fechaFin}` : `Periodo: ${periodo.toUpperCase()}`}
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-200">
                                        <th className="py-3 px-6">Habitación</th>
                                        <th className="py-3 px-6">Fecha y Hora de Ingreso</th>
                                        <th className="py-3 px-6">Estado</th>
                                        <th className="py-3 px-6">Fecha y Hora de Salida</th>
                                        <th className="py-3 px-6 text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-sm">
                                    {loading ? (
                                        <tr><td colSpan="5" className="py-6 text-center text-gray-500">Cargando...</td></tr>
                                    ) : detalle.length > 0 ? (
                                        detalle.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="py-3 px-6 font-bold text-gray-800">Hab. {item.num_habitacion || item.numero || 'N/A'}</td>
                                                <td className="py-3 px-6 text-xs text-gray-600">{new Date(item.created_at).toLocaleString('es-MX')}</td>
                                                <td className="py-3 px-6"><span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">{item.estado}</span></td>
                                                <td className="py-3 px-6 text-xs text-gray-600"> 
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
                                                <td className="py-3 px-6 text-right font-bold text-emerald-600">${Number(item.precio_cobrado).toFixed(2)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="py-8 text-center text-gray-400">Sin registros para este periodo.</td></tr>
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