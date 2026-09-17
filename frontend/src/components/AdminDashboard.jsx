import { useState } from 'react';
import Sidebar from './Sidebar';

export default function AdminDashboard() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <div className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} p-6 transition-all duration-300`}>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Panel de Administración</h1>
                <p className="text-xs text-gray-500 mb-6">Control general del hotel, reportes financieros y gestión de personal.</p>
                {/* Aquí pondremos la administración global */}
            </div>
        </div>
    );
}