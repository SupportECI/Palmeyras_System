import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useIdleTimeout(minutos = 5) {
    const navigate = useNavigate();
    const timeoutRef = useRef(null);

    const cerrarSesion = () => {
        localStorage.removeItem('usuario');
        navigate('/'); 
    };

    const resetearTemporizador = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        if (location.pathname !== '/') {
            timeoutRef.current = setTimeout(cerrarSesion, minutos * 60 * 1000);
        }
    };

    useEffect(() => {
        const usuarioActivo = localStorage.getItem('usuario');
        if (!usuarioActivo) return;

        const eventos = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

        resetearTemporizador();

        eventos.forEach((evento) => document.addEventListener(evento, resetearTemporizador));

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            eventos.forEach((evento) => document.removeEventListener(evento, resetearTemporizador));
        };
    }, [location.pathname, minutos]);
}