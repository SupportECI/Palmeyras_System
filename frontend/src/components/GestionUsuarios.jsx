import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "./Sidebar";
import { Users, UserPlus, Pencil, Trash2, AlertTriangle } from 'lucide-react';

export default function GestionUsuarios() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [usuarios, setUsuarios] = useState([]);

    // Estados para el modal de registrar usuario
    const [modalUserOpen, setModalUserOpen] = useState(false);
    const [nuevoNombre, setNuevoNombre] = useState('');
    const [nuevoCorreo, setNuevoCorreo] = useState('');
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [nuevoRol, setNuevoRol] = useState('RECEPCION');

    // Estados para el modal de Editar usuario
    const [modalEditarOpen, setModalEditarOpen] = useState(false);
    const [usuarioEditandoId, setUsuarioEditandoId] = useState(null);
    const [editNombre, setEditNombre] = useState('');
    const [editCorreo, setEditCorreo] = useState('');
    const [editRol, setEditRol] = useState('RECEPCION');

    // Estados para el modal de Confirmar Eliminación
    const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
    const [usuarioEliminandoId, setUsuarioEliminandoId] = useState(null);
    const [nombreAEliminar, setNombreAEliminar] = useState('');

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const cargarUsuarios = async () => {
        try {
            const res = await api.get('/usuarios');
            setUsuarios(res.data.usuarios || []);
        } catch (error) {
            console.error('Error al cargar usuarios', error);
        }
    };

    // Registrar nuevo usuario
    const handleCrearUsuario = async (e) => {
        e.preventDefault();
        try {
            await api.post('/usuarios', {
                nombre: nuevoNombre,
                email: nuevoCorreo,
                password: nuevaPassword,
                rol: nuevoRol
            });

            setModalUserOpen(false);
            setNuevoNombre('');
            setNuevoCorreo('');
            setNuevaPassword('');
            setNuevoRol('RECEPCION');
            alert('Usuario registrado con éxito');
            cargarUsuarios();
        } catch (error) {
            console.error('Error al registrar usuario', error);
            alert(error.response?.data?.message || 'No se pudo registrar el usuario');
        }
    };

    // Abrir modal de editar con los datos actuales
    const abrirModalEditar = (u) => {
        setUsuarioEditandoId(u.id);
        setEditNombre(u.nombre || '');
        setEditCorreo(u.email || u.correo || '');
        setEditRol(u.rol || 'RECEPCION');
        setModalEditarOpen(true);
    };

    // Guardar cambios de edición
    const handleActualizarUsuario = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/usuarios/${usuarioEditandoId}`, {
                nombre: editNombre,
                email: editCorreo,
                rol: editRol
            });

            setModalEditarOpen(false);
            setUsuarioEditandoId(null);
            alert('Usuario actualizado con éxito');
            cargarUsuarios();
        } catch (error) {
            console.error('Error al actualizar usuario', error);
            alert(error.response?.data?.message || 'No se pudo actualizar la información');
        }
    };

    // Abrir modal de confirmación de eliminación
    const abrirModalEliminar = (u) => {
        setUsuarioEliminandoId(u.id);
        setNombreAEliminar(u.nombre);
        setModalEliminarOpen(true);
    };

    // Confirmar eliminación
    const handleEliminarUsuario = async () => {
        try {
            await api.delete(`/usuarios/${usuarioEliminandoId}`);
            setModalEliminarOpen(false);
            setUsuarioEliminandoId(null);
            alert('Usuario eliminado correctamente');
            cargarUsuarios();
        } catch (error) {
            console.error('Error al eliminar usuario', error);
            alert('No se pudo eliminar el usuario');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} rol="admin" />

            <div className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} flex flex-col min-w-0 transition-all duration-300`}>
                <header className="bg-white text-black flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <h1 className="text-lg font-semibold text-gray-800">Gestión de Usuarios y Personal</h1>
                </header>

                <div className="p-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-base font-bold text-gray-800">Personal Registrado en el Sistema</h3>
                                <p className="text-xs text-gray-500">Cree cuentas, edite la información o revoque accesos al personal.</p>
                            </div>
                            <button
                                onClick={() => setModalUserOpen(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                                <UserPlus className="w-4 h-4" /> Registrar Empleado
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                                        <th className="p-3">Nombre</th>
                                        <th className="p-3">Correo electrónico</th>
                                        <th className="p-3">Rol / Puesto</th>
                                        <th className="p-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {usuarios.length > 0 ? (
                                        usuarios.map((u) => (
                                            <tr key={u.id} className="hover:bg-gray-50">
                                                <td className="p-3 font-bold text-gray-900 flex items-center gap-2">
                                                    <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs">
                                                        {u.nombre?.charAt(0)}
                                                    </div>
                                                    {u.nombre}
                                                </td>
                                                <td className="p-3 text-gray-500">{u.email || u.correo}</td>
                                                <td className="p-3">
                                                    <span className={`px-2.5 py-1 rounded-lg font-semibold text-xs ${
                                                        u.rol === 'ADMIN' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                        u.rol === 'SUPERVISOR' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                        u.rol === 'RECEPCION' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                        'bg-purple-50 text-purple-700 border border-purple-200'
                                                    }`}>
                                                        {u.rol}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => abrirModalEditar(u)}
                                                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                                                            title="Editar usuario"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => abrirModalEliminar(u)}
                                                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition cursor-pointer"
                                                            title="Eliminar usuario"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="p-6 text-center text-gray-500">Cargando personal...</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* MODAL PARA CREAR USUARIO */}
                {modalUserOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <h2 className="text-lg font-bold text-gray-900 mb-1">Registrar Nuevo Empleado</h2>
                            <p className="text-xs text-gray-500 mb-4">Cree una cuenta asignando las credenciales de acceso y su puesto correspondiente.</p>

                            <form onSubmit={handleCrearUsuario} className="flex flex-col gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Completo</label>
                                    <input type="text" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Electrónico</label>
                                    <input type="email" value={nuevoCorreo} onChange={(e) => setNuevoCorreo(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Contraseña</label>
                                    <input type="password" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Rol / Puesto en el Hotel</label>
                                    <select value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white cursor-pointer">
                                        <option value="RECEPCION">Recepción</option>
                                        <option value="RECAMARISTA">Recamarista</option>
                                        <option value="SUPERVISOR">Supervisor</option>
                                        <option value="ADMIN">Administrador</option>
                                    </select>
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                    <button type="button" onClick={() => setModalUserOpen(false)} className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 cursor-pointer">Registrar Empleado</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL PARA EDITAR USUARIO */}
                {modalEditarOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <h2 className="text-lg font-bold text-gray-900 mb-1">Editar Empleado</h2>
                            <p className="text-xs text-gray-500 mb-4">Modifique los datos necesarios del empleado seleccionado.</p>

                            <form onSubmit={handleActualizarUsuario} className="flex flex-col gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Completo</label>
                                    <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Electrónico</label>
                                    <input type="email" value={editCorreo} onChange={(e) => setEditCorreo(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Rol / Puesto en el Hotel</label>
                                    <select value={editRol} onChange={(e) => setEditRol(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white cursor-pointer">
                                        <option value="RECEPCION">Recepción</option>
                                        <option value="RECAMARISTA">Recamarista</option>
                                        <option value="SUPERVISOR">Supervisor</option>
                                        <option value="ADMIN">Administrador</option>
                                    </select>
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                    <button type="button" onClick={() => setModalEditarOpen(false)} className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 cursor-pointer">Guardar Cambios</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL PARA CONFIRMAR ELIMINACIÓN */}
                {modalEliminarOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
                            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h2 className="text-base font-bold text-gray-900 mb-1">¿Eliminar empleado?</h2>
                            <p className="text-xs text-gray-500 mb-5">
                                Está a punto de eliminar a <strong className="text-gray-800">{nombreAEliminar}</strong>. Esta acción no se puede deshacer y perderá su acceso al sistema.
                            </p>

                            <div className="flex justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalEliminarOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer w-full"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleEliminarUsuario}
                                    className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 cursor-pointer w-full shadow-sm"
                                >
                                    Sí, eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}