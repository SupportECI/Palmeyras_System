import { useEffect, useState } from 'react';
import api from '../services/api';
import Sidebar from './Sidebar';
import { Calendar, Clock, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function ListaReservaciones() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [reservaciones, setReservaciones] = useState([]);
    
    // Estados para el manejo del calendario
    const [fechaSeleccionada, setFechaSeleccionada] = useState(''); // Formato 'YYYY-MM-DD'
    const [mesActual, setMesActual] = useState(new Date());

    useEffect(() => {
        const obtenerReservas = async () => {
            try {
                const res = await api.get('/reservas/todas');
                setReservaciones(res.data.reservaciones);
            } catch (error) {
                console.error('Error al cargar reservaciones', error);
            }
        };
        obtenerReservas();
    }, []);

    // Funciones para navegar entre meses en el calendario
    const mesAnterior = () => {
        setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1));
    };

    const mesSiguiente = () => {
        setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1));
    };

    // Generar los días del mes actual para mostrarlos en la cuadrícula
    const obtenerDiasDelMes = () => {
        const year = mesActual.getFullYear();
        const month = mesActual.getMonth();
        
        const primerDiaDelMes = new Date(year, month, 1).getDay();
        const ultimoDiaDelMes = new Date(year, month + 1, 0).getDate();
        
        const dias = [];
        
        // Espacios vacíos para alinear los días de la semana correctamente
        for (let i = 0; i < (primerDiaDelMes === 0 ? 6 : primerDiaDelMes - 1); i++) {
            dias.push(null);
        }
        
        // Días reales del mes
        for (let dia = 1; dia <= ultimoDiaDelMes; dia++) {
            const mesStr = String(month + 1).padStart(2, '0');
            const diaStr = String(dia).padStart(2, '0');
            dias.push(`${year}-${mesStr}-${diaStr}`);
        }
        
        return dias;
    };

    const diasMes = obtenerDiasDelMes();
    const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const nombreMesAnio = `${nombresMeses[mesActual.getMonth()]} ${mesActual.getFullYear()}`;

    // Filtrar reservaciones: si hay una fecha seleccionada muestra solo ese día, si no, muestra todas
    const reservacionesFiltradas = reservaciones.filter(r => {
        const fechaReserva = r.fecha_reservacion ? r.fecha_reservacion.split('T')[0] : '';
        if (!fechaSeleccionada) return true;
        return fechaReserva === fechaSeleccionada;
    });

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <div className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} p-6 transition-all duration-300`}>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Reservaciones Programadas</h1>
                <p className="text-xs text-gray-500 mb-6">Selecciona una fecha en el calendario para consultar las habitaciones apartadas.</p>

                {/* CONTENEDOR DEL CALENDARIO INTERACTIVO */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold text-gray-800 capitalize">{nombreMesAnio}</h2>
                        <div className="flex gap-1">
                            <button onClick={mesAnterior} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition cursor-pointer">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={mesSiguiente} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition cursor-pointer">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400 mb-2">
                        <span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sá</span><span>Do</span>
                    </div>

                    {/* Cuadrícula de días */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                        {diasMes.map((fecha, index) => {
                            if (!fecha) return <div key={`empty-${index}`} />;

                            // Verificar si este día tiene al menos una reservación activa
                            const tieneReservas = reservaciones.some(r => r.fecha_reservacion?.split('T')[0] === fecha);
                            const esSeleccionado = fechaSeleccionada === fecha;

                            return (
                                <button
                                    key={fecha}
                                    onClick={() => setFechaSeleccionada(esSeleccionado ? '' : fecha)} // Clic de nuevo para deseleccionar
                                    className={`py-2 rounded-xl text-xs font-medium relative transition cursor-pointer flex flex-col items-center justify-center ${
                                        esSeleccionado 
                                            ? 'bg-blue-600 text-white shadow-md' 
                                            : tieneReservas 
                                                ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 hover:bg-blue-100' 
                                                : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <span>{parseInt(fecha.split('-')[2])}</span>
                                    {/* Indicador visual de punto si hay reservas en ese día */}
                                    {tieneReservas && !esSeleccionado && (
                                        <span className="w-1 h-1 bg-blue-600 rounded-full mt-0.5"></span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {fechaSeleccionada && (
                        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                            <span className="text-gray-600">Mostrando reservas para el día: <strong className="text-gray-900">{fechaSeleccionada}</strong></span>
                            <button 
                                onClick={() => setFechaSeleccionada('')} 
                                className="text-blue-600 font-semibold hover:underline cursor-pointer"
                            >
                                Ver todas las fechas
                            </button>
                        </div>
                    )}
                </div>

                {/* TABLA DE RESULTADOS */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600">
                                <th className="p-4">Habitación</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Celular</th>
                                <th className="p-4">Fecha Programada</th>
                                <th className="p-4">Horario</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                            {reservacionesFiltradas.length > 0 ? (
                                reservacionesFiltradas.map((r) => (
                                    <tr key={r.renta_id} className="hover:bg-gray-50/50">
                                        <td className="p-4 font-bold text-gray-900">Hab. #{r.num_habitacion} <span className="text-gray-500 font-normal">({r.tipo})</span></td>
                                        <td className="p-4 font-medium">{r.nombre_completo}</td>
                                        <td className="p-4 text-gray-500">{r.celular}</td>
                                        <td className="p-4 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-500" /> {r.fecha_reservacion?.split('T')[0]}</td>
                                        <td className="p-4"><span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-lg flex items-center gap-1 w-fit"><Clock className="w-3.5 h-3.5" /> {r.hora_reservacion}</span></td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        {fechaSeleccionada ? 'No hay reservaciones registradas para este día.' : 'No hay reservaciones activas registradas.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}