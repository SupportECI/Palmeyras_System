import palmeyras from '../assets/palmeyras.webp';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    
    /* Estados para correo y contraseña  */
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post('/login', {
                correo: correo,
                password_hash: password
            });

            const { usuario } = response.data;

            localStorage.setItem('usuario', JSON.stringify(usuario));

            switch(usuario.rol) {
                case 'RECEPCIONISTA':
                    navigate('/dashboard/recepcionista');
                    break;
                case 'RECAMARISTA':
                    navigate('/dashboard/recamarista');
                    break;
                case 'SUPERVISOR':
                    navigate('/dashboard/supervisor');
                    break;
                case 'ADMINISTRADOR':
                    navigate('/dashboard/administrador');
                    break;
                default:
                    setError('Rol no encontrado');
            }
        } catch (error) {
            if(error.response?.status === 401) {
                setError('Correo o contraseña incorrectos');
            } else if (error.response?.status === 400) {
                setError(error.response.data.message);
            } else {
                setError('Ocurrio un error, intente de nuevo')
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="h-screen w-full flex overflow-hidden bg-white">
            {/* Imagen lateral: Oculta en móviles, ajustada para ocupar el 100% de la altura sin desbordar */}
            <div className="hidden md:flex md:w-1/2 lg:w-3/5 h-full bg-gray-600/95 overflow-hidden items-center justify-center">
                <img src={palmeyras} alt="palmeyras" className="h-full w-full object-cover" />
            </div>

            <div className="w-full md:w-1/2 lg:w-2/5 h-full flex flex-col items-center justify-center px-6 sm:px-10 py-4 overflow-y-auto">
                <form action="" onSubmit={handleLogin} className="w-full max-w-sm flex flex-col items-center justify-center my-auto">
                    <h2 className="text-3xl sm:text-4xl text-gray-900 font-medium text-center">Inicia Sesión</h2>
                    <p className="text-xs sm:text-sm text-gray-500/90 mt-1 text-center">Bienvenido de vuelta</p>

                    <button type='button' onClick={() => setIsOpen(true)} className="w-full mt-5 bg-gray-500/10 flex items-center justify-center h-11 rounded-full cursor-pointer hover:bg-gray-500/20 transition-colors">
                        <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/googleLogo.svg" alt="googleLogo" className="w-20 h-20" />
                    </button>

                    <div className="flex items-center gap-3 w-full my-4">
                        <div className="w-full h-px bg-gray-300/90"></div>
                        <p className="text-xs text-nowrap text-gray-500/90 px-1">O ingresa con tu correo</p>
                        <div className="w-full h-px bg-gray-300/90"></div>
                    </div>

                    <div className="flex items-center w-full bg-transparent border border-gray-300/60 h-11 rounded-full overflow-hidden pl-5 gap-2">
                        <svg width="15" height="11" viewBox='0 0 16 11' fill='none' xmlns='http://www.w3.org/2000/svg'>
                            <path fillRule="evenodd" clipRule="evenodd" d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z" fill="#6B7280" />
                        </svg>
                        <input 
                        type="email" 
                        placeholder='Email'
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        className='bg-transparent text-gray-700 outline-none placeholder:text-gray-400 text-xs sm:text-sm w-full h-full pr-5' 
                        required />
                    </div>

                    <div className='flex items-center mt-3.5 w-full bg-transparent border border-gray-300/60 h-11 rounded-full overflow-hidden pl-5 gap-2'>
                        <svg width="12" height="16" viewBox='0 0 13 17' fill='none' xmlns='http://www.w3.org/2000/svg'>
                            <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280" />
                        </svg>
                        <input 
                        type="password" 
                        placeholder='Contraseña'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)} 
                        className='bg-transparent text-gray-700 placeholder:text-gray-400 outline-none text-xs sm:text-sm w-full h-full pr-5' 
                        required />
                    </div>

                    <div className='w-full flex items-center justify-between mt-4 text-gray-600'>
                        <div className='flex items-center gap-2'>
                            <input className='h-3.5 w-3.5 rounded border-gray-300 cursor-pointer' type='checkbox' id='checkbox' />
                            <label className='text-xs cursor-pointer' htmlFor='checkbox'>Recuérdame</label>
                        </div>
                        <a href="#" className='text-xs underline hover:text-gray-900'>Olvidé la contraseña</a>
                    </div>

                    {error && (
                        <p className='text-red-600 text-xs mt-2 text-center'>{error}</p>
                    )}

                    <button type='submit' className='mt-5 w-full h-10 rounded-full text-white bg-[#E31D1E] hover:opacity-90 transition-opacity cursor-pointer font-medium text-sm'
                    >
                         {loading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>
            </div>

            {/* Modal Responsive */}
            {isOpen && (
                <div className='fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4'>
                    <div className='flex flex-col items-center bg-white shadow-xl rounded-2xl py-6 px-6 w-full max-w-sm border border-gray-200 animate-fadeIn'>
                        <div className='flex items-center justify-center p-3 bg-red-100 rounded-full text-red-600'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4" />
                                <path d="M12 8h.01" />
                            </svg>
                        </div>

                        <h2 className='text-gray-900 font-semibold mt-3 text-lg'>Próximamente</h2>
                        <p className='text-xs sm:text-sm text-gray-600 mt-1 text-center'>Esta función pronto estará disponible</p>
                        
                        <div className='flex items-center justify-center gap-4 w-full mt-5'>
                            <button
                                className='w-full h-9 rounded-xl border text-white bg-red-600 font-medium text-xs sm:text-sm hover:bg-red-700 active:scale-95 transition cursor-pointer'
                                type='button'
                                onClick={() => setIsOpen(false)}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}