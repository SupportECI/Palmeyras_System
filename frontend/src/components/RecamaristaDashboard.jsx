import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "./Sidebar";
import { BrushCleaning, CheckCircle2, BedSingle, AlertCircle } from 'lucide-react';

export default function RecamaristaDashboard() {
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [habitacionesSucian, setHabitacionesSucias] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Estados para el modal de verificación de limpieza
    const [modalOpen, setModalOpen] = useState(false);
    const [habitacionSeleccionada, setHabitacionSeleccionada] = useState(null);
    
    // Los 4 checks obligatorios
    const [checks, setChecks] = useState({
        sabanas: false,
        toallas: false,
        amenidades: false,
        superficies: false
    });

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            const datos = JSON.parse(usuarioGuardado);
            setNombreUsuario(datos.nombre || datos.correo);
        }
        cargarHabitacionesSucias();
    }, []);

    const cargarHabitacionesSucias = async () => {
        try {
            const respuesta = await api.get('/habitaciones');
            // Filtramos estrictamente solo las que estén en estado 'LIBRE_SUCIA'
            const sucias = respuesta.data.habitaciones.filter(h => h.estado === 'LIBRE_SUCIA');
            setHabitacionesSucias(sucias);
        } catch (error) {
            console.error('Error al cargar habitaciones sucias', error);
        }
    };

    const abrirModalLimpieza = (habitacion) => {
        setHabitacionSeleccionada(habitacion);
        // Reiniciamos los checks al abrir
        setChecks({
            sabanas: false,
            toallas: false,
            amenidades: false,
            superficies: false
        });
        setModalOpen(true);
    };

    const handleCheckboxChange = (e) => {
        setChecks({
            ...checks,
            [e.target.name]: e.target.checked
        });
    };

    // Validar que los 4 checks estén marcados para poder enviar
    const todosSeleccionados = checks.sabanas && checks.toallas && checks.amenidades && checks.superficies;

    const confirmarLimpieza = async (e) => {
        e.preventDefault();
        if (!todosSeleccionados) {
            alert('Debe confirmar todos los puntos de limpieza antes de marcar la habitación como limpia.');
            return;
        }

        try {
            // Actualizamos la habitación a LIBRE_LIMPIA
            await api.put(`/habitaciones/${habitacionSeleccionada.id}/estado`, {
                estado: 'LIBRE_LIMPIA',
                rol_usuario: 'RECAMARISTA'
            });

            setModalOpen(false);
            setHabitacionSeleccionada(null);
            cargarHabitacionesSucias(); // Se actualiza la lista y desaparece la habitación atendida
        } catch (error) {
            console.error('Error al actualizar estado de limpieza', error);
            alert('No se pudo completar el cambio de estado');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar configurado exclusivamente para recámara */}
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} rol="recamarista" />

            <div className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} flex flex-col min-w-0 transition-all duration-300`}>
                <header className="bg-white text-black flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <h1 className="text-lg font-semibold text-gray-800">Panel de Recámara y Limpieza</h1>
                    <span className="text-sm text-gray-600">Bienvenida, {nombreUsuario || "Recamarista"}</span>
                </header>

                <div className="p-6">
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Habitaciones Pendientes de Limpieza</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Seleccione una habitación para iniciar el protocolo de sanitización y cambio de blancos.</p>
                        </div>
                        <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 font-bold rounded-xl text-xs">
                            Pendientes: {habitacionesSucian.length}
                        </span>
                    </div>

                    {/* CUADRÍCULA DE HABITACIONES SUCIAS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {habitacionesSucian.length > 0 ? (
                            habitacionesSucian.map((h) => (
                                <div key={h.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-lg text-gray-800">Hab. {h.num_habitacion}</span>
                                            <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-300">
                                                Por Limpiar
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">Tipo: <span className="font-medium text-gray-800">{h.tipo}</span></p>
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-gray-100 flex justify-end">
                                        <button
                                            onClick={() => abrirModalLimpieza(h)}
                                            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                        >
                                            <BrushCleaning className="w-4 h-4" /> Marcar como Limpia
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
                                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-base font-bold text-gray-800">¡Todo en orden!</h3>
                                <p className="text-gray-500 text-xs mt-1">No hay habitaciones pendientes de limpieza en este momento.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* MODAL DE CONFIRMACIÓN DE ADITAMENTOS (4 CHECKS) */}
                {modalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center">
                                    <BedSingle className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">Limpieza Habitación #{habitacionSeleccionada?.num_habitacion}</h2>
                            </div>
                            <p className="text-xs text-gray-500 mb-5">Confirme que se han cambiado y sanitizado los siguientes aditamentos para liberar la habitación:</p>

                            <form onSubmit={confirmarLimpieza} className="flex flex-col gap-3">
                                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                                    <input
                                        type="checkbox"
                                        name="sabanas"
                                        checked={checks.sabanas}
                                        onChange={handleCheckboxChange}
                                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                                    />
                                    <span className="text-xs font-medium text-gray-700">Cambio completo de sábanas y fundas</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                                    <input
                                        type="checkbox"
                                        name="toallas"
                                        checked={checks.toallas}
                                        onChange={handleCheckboxChange}
                                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                                    />
                                    <span className="text-xs font-medium text-gray-700">Reemplazo de juego de toallas limpias</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                                    <input
                                        type="checkbox"
                                        name="amenidades"
                                        checked={checks.amenidades}
                                        onChange={handleCheckboxChange}
                                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                                    />
                                    <span className="text-xs font-medium text-gray-700">Surtido de amenidades (jabón, papel higiénico, shampoo)</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                                    <input
                                        type="checkbox"
                                        name="superficies"
                                        checked={checks.superficies}
                                        onChange={handleCheckboxChange}
                                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                                    />
                                    <span className="text-xs font-medium text-gray-700">Sanitización de pisos, baño y superficies</span>
                                </label>

                                {!todosSeleccionados && (
                                    <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 p-2.5 rounded-xl text-xs mt-1">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>Debe marcar los 4 puntos para continuar.</span>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!todosSeleccionados}
                                        className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition ${
                                            todosSeleccionados 
                                                ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer shadow-sm' 
                                                : 'bg-gray-300 cursor-not-allowed'
                                        }`}
                                    >
                                        Guardar y Marcar Limpia
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