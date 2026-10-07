import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, rolPermitido }) {
    const usuarioString = localStorage.getItem('usuario');
    
    if (!usuarioString) {
        return <Navigate to="/" replace />;
    }

    const usuario = JSON.parse(usuarioString);

    if (rolPermitido) {
        if (Array.isArray(rolPermitido)) {
            if (!rolPermitido.includes(usuario.rol)) {
                return <Navigate to="/" replace />;
            }
        } 
        else if (usuario.rol !== rolPermitido) {
            return <Navigate to="/" replace />;
        }
    }

    return children;
}