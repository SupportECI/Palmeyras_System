import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, rolPermitido }) {
    const usuarioGuardado = localStorage.getItem('usuario');

    if (!usuarioGuardado) {
        return <Navigate to="/" replace />;
    }

    try {
        const usuario = JSON.parse(usuarioGuardado);

        if (rolPermitido && usuario.rol !== rolPermitido) {
            return <Navigate to="/" replace />;
        }
    } catch (e) {
        localStorage.removeItem('usuario');
        return <Navigate to="/" replace />;
    }

    return children;
}