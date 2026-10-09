const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// Conexión a la base de datos mediante promesas
let db;
async function conectarBD() {
    try {
        db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'hotel_palmeyras'
        });
        console.log("Conectado exitosamente a la base de datos de Hotel Palmeyras.");
    } catch (err) {
        console.error("Error al conectar a la base de datos:", err);
    }
}
conectarBD();

app.post('/api/login', async (req, res) => {
    try {
        const { correo, password } = req.body;
        const sql = "SELECT * FROM usuarios WHERE correo = ? AND password = ?";
        const [results] = await db.query(sql, [correo, password]);

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' });
        }

        const usuario = results[0];

        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });
    } catch (err) {
        console.error("Error en el servidor durante el login:", err);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// Obtener habitaciones y evaluar de forma automática el bloqueo de 2 horas antes de una reserva
app.get('/api/habitaciones', async (req, res) => {
    try {
        const sql = `
            SELECT h.*, 
                   (SELECT UNIX_TIMESTAMP(MAX(rt.created_at)) * 1000
                      FROM rentas rt
                      WHERE rt.habitacion_id = h.id AND rt.estado = 'ACTIVA') AS inicio_renta_ms
            FROM habitaciones h
            ORDER BY CAST(h.num_habitacion AS UNSIGNED) ASC
        `;
        const [habitaciones] = await db.query(sql);
        return res.status(200).json({ success: true, habitaciones });
    } catch (err) {
        console.error("Error al obtener habitaciones:", err);
        return res.status(500).json({ success: false, message: 'Error al obtener habitaciones' });
    }
});

// Crear habitación (Admin / Supervisor)
app.post('/api/habitaciones', async (req, res) => {
    try {
        const { num_habitacion, tipo, precio_base, estado } = req.body;
        const sql = "INSERT INTO habitaciones (num_habitacion, tipo, precio_base, estado) VALUES (?, ?, ?, ?)";
        const [result] = await db.query(sql, [num_habitacion, tipo, precio_base, estado || 'LIBRE_LIMPIA']);
        res.status(201).json({ success: true, message: 'Habitación creada con éxito', id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error al registrar habitación' });
    }
});

// Eliminar habitación (Exclusivo Administrador)
app.delete('/api/habitaciones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = "DELETE FROM habitaciones WHERE id = ?";
        await db.query(sql, [id]);
        res.status(200).json({ success: true, message: 'Habitación eliminada correctamente' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'No se puede eliminar, tiene registros asociados.' });
    }
});

// Cambiar estado operativo (Supervisor: Mantenimiento o Limpieza Semanal)
app.put('/api/habitaciones/:id/estado-operativo', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, motivo } = req.body;

        const sql = "UPDATE habitaciones SET estado = ?, motivo_mantenimiento = ? WHERE id = ?";
        await db.query(sql, [estado, motivo || null, id]);

        return res.status(200).json({ success: true, message: "Estado operativo actualizado" });
    } catch (err) {
        console.error("Error al actualizar estado operativo:", err);
        return res.status(500).json({ success: false, message: "Error en el servidor" });
    }
});

// Actualizar estado genérico (para cambios manuales permitidos)
app.put('/api/habitaciones/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const estadosPermitidos = ['LIBRE_LIMPIA', 'LIBRE_SUCIA', 'OCUPADA', 'RESERVADA'];
        if (!estadosPermitidos.includes(estado)) {
            return res.status(400).json({ success: false, message: 'Estado de habitación no válido.' });
        }

        if (estado === 'LIBRE_SUCIA') {
            const sqlCerrarRenta = "UPDATE rentas SET estado = 'FINALIZADA', hora_fin_real = NOW() WHERE habitacion_id = ? AND estado = 'ACTIVA'";
            await db.query(sqlCerrarRenta, [id]);
        }

        const sqlUpdateHab = "UPDATE habitaciones SET estado = ? WHERE id = ?";
        await db.query(sqlUpdateHab, [estado, id]);

        res.status(200).json({ success: true, message: `Habitación actualizada a ${estado} correctamente.` });
    } catch (err) {
        console.error("Error al actualizar el estado de la habitación:", err);
        return res.status(500).json({ success: false, message: 'No se pudo actualizar el estado de la recámara.' });
    }
});

app.post('/api/rentas/check-in', async (req, res) => {
    try {
        const habitacion_id = req.body.habitacion_id || req.body.habitacionId;
        const precio_cobrado = req.body.precio_cobrado || req.body.precioCobrado;
        const vehiculo = req.body.vehiculo;

        if (!habitacion_id || !precio_cobrado) {
            return res.status(400).json({ success: false, message: 'Faltan datos obligatorios.' });
        }

        const clienteIdDefault = 1;
        const sqlRenta = "INSERT INTO rentas (habitacion_id, cliente_id, precio_cobrado, estado, vehiculo, created_at) VALUES (?, ?, ?, 'ACTIVA', ?, NOW())";
        await db.query(sqlRenta, [habitacion_id, clienteIdDefault, precio_cobrado, vehiculo]);

        const sqlHab = "UPDATE habitaciones SET estado = 'OCUPADA' WHERE id = ?";
        await db.query(sqlHab, [habitacion_id]);

        return res.status(201).json({ success: true, message: 'Check-in realizado con éxito' });
    } catch (err) {
        console.error("Error SQL Renta:", err);
        return res.status(500).json({ success: false, message: 'Error SQL Renta: ' + err.message });
    }
});

app.put('/api/habitaciones/:id/checkout', async (req, res) => {
    try {
        const { id } = req.params;
        const sqlCerrarRenta = "UPDATE rentas SET estado = 'FINALIZADA', fecha_checkout = NOW() WHERE habitacion_id = ? AND estado = 'ACTIVA'";
        await db.query(sqlCerrarRenta, [id]);

        const sqlHab = "UPDATE habitaciones SET estado = 'LIBRE_SUCIA' WHERE id = ?";
        await db.query(sqlHab, [id]);

        return res.status(200).json({ success: true, message: 'Check-out procesado con éxito. Habitación marcada como sucia.' });
    } catch (err) {
        console.error("Error al hacer Check-out:", err);
        return res.status(500).json({ success: false, message: 'Error al procesar el Check-out.' });
    }
});

// COMPLETAR LIMPIEZA Y GUARDAR FOTO BASE64 EN LA TABLA
app.post('/api/habitaciones/:id/completar-limpieza', async (req, res) => {
    try {
        const { id: habitacion_id } = req.params;
        const { tipo_limpieza, recamarista_id, checks, foto_base64 } = req.body;

        if (!foto_base64) {
            return res.status(400).json({ success: false, message: 'La fotografía de evidencia es obligatoria.' });
        }

        const checksParseados = typeof checks === 'string' ? checks : JSON.stringify(checks);

        await db.query(
            `INSERT INTO historial_limpiezas (habitacion_id, recamarista_id, tipo_limpieza, checks_realizados, ruta_foto) VALUES (?, ?, ?, ?, ?)`,
            [habitacion_id, recamarista_id, tipo_limpieza, checksParseados, foto_base64]
        );

        await db.query(`UPDATE habitaciones SET estado = 'LIBRE_LIMPIA' WHERE id = ?`, [habitacion_id]);

        res.status(200).json({ success: true, message: 'Limpieza registrada y habitación liberada con éxito.' });
    } catch (error) {
        console.error("Error al registrar limpieza:", error);
        res.status(500).json({ success: false, message: 'Error interno en el servidor' });
    }
});

// ENDPOINT PARA RENOVAR RENTA (OTRAS 4 HORAS)
app.post('/api/rentas/renovar', async (req, res) => {
    try {
        const { habitacion_id, precio_cobrado } = req.body;

        if (!habitacion_id || !precio_cobrado) {
            return res.status(400).json({ success: false, message: 'Faltan datos obligatorios.' });
        }

        // 1. Finalizar la renta anterior (para que el reporte marque que esa primera etapa terminó)
        const sqlCerrarRenta = "UPDATE rentas SET estado = 'FINALIZADA', fecha_checkout = NOW() WHERE habitacion_id = ? AND estado = 'ACTIVA'";
        await db.query(sqlCerrarRenta, [habitacion_id]);

        // 2. Insertar una nueva renta que comenzará a contar desde este instante
        const clienteIdDefault = 1;
        const sqlNuevaRenta = "INSERT INTO rentas (habitacion_id, cliente_id, precio_cobrado, estado, created_at) VALUES (?, ?, ?, 'ACTIVA', NOW())";
        await db.query(sqlNuevaRenta, [habitacion_id, clienteIdDefault, precio_cobrado]);

        // Nota: No actualizamos el estado de la habitación porque ya está en 'OCUPADA'

        return res.status(201).json({ success: true, message: 'Estancia renovada con éxito' });
    } catch (err) {
        console.error("Error al renovar renta:", err);
        return res.status(500).json({ success: false, message: 'Error interno al renovar.' });
    }
});

// CONSULTAR HISTORIAL Y FOTOGRAFÍAS PARA ADMINISTRADOR Y SUPERVISOR
app.get('/api/habitaciones/:id/historial-limpiezas', async (req, res) => {
    try {
        const { id } = req.params;
        const [historial] = await db.query(
            `SELECT hl.*, u.nombre as recamarista_nombre 
             FROM historial_limpiezas hl 
             LEFT JOIN usuarios u ON hl.recamarista_id = u.id 
             WHERE hl.habitacion_id = ? 
             ORDER BY hl.fecha_hora DESC`,
            [id]
        );

        const historialFormateado = historial.map(item => {
            let foto = item.ruta_foto;
            
            // Si la cadena existe pero no incluye el encabezado data:image, se lo anteponemos
            if (foto && !foto.startsWith('data:image')) {
                foto = `data:image/jpeg;base64,${foto}`;
            }

            return {
                ...item,
                foto_url: foto
            };
        });

        res.status(200).json({ success: true, historial: historialFormateado });
    } catch (error) {
        console.error("Error al obtener historial:", error);
        res.status(500).json({ success: false, message: 'Error al obtener el historial.' });
    }
});

app.post('/api/reservaciones', async (req, res) => {
    try {
        const {
            habitacion_id,
            nombre_cliente, nombre,
            direccion_cliente, direccion,
            telefono_cliente, telefono,
            fecha_reservacion,
            hora_reservacion
        } = req.body;

        const clienteNombre = nombre_cliente || nombre;
        const clienteDireccion = direccion_cliente || direccion || 'Sin dirección';
        const clienteTelefono = telefono_cliente || telefono || null;

        if (!habitacion_id || !clienteNombre || !fecha_reservacion || !hora_reservacion) {
            return res.status(400).json({ success: false, message: 'Faltan datos obligatorios para la reservación.' });
        }

        const sqlVerificarConflicto = `
            SELECT r.id, r.created_at, h.estado 
            FROM rentas r 
            JOIN habitaciones h ON r.habitacion_id = h.id 
            WHERE r.habitacion_id = ? AND r.estado = 'ACTIVA'
        `;

        const [rentasActivas] = await db.query(sqlVerificarConflicto, [habitacion_id]);

        if (rentasActivas.length > 0) {
            const rentaActual = rentasActivas[0];
            const horaInicioRenta = new Date(rentaActual.created_at);
            const finEstanciaYLimpiezaMinutos = (horaInicioRenta.getHours() * 60 + horaInicioRenta.getMinutes()) + (4 * 60) + 30;

            const [hReq, mReq] = hora_reservacion.split(':').map(Number);
            const horaReservacionMinutos = hReq * 60 + mReq;

            const hoy = new Date().toISOString().split('T')[0];
            if (fecha_reservacion === hoy && horaReservacionMinutos < finEstanciaYLimpiezaMinutos) {
                const horaLibreH = Math.floor(finEstanciaYLimpiezaMinutos / 60);
                const horaLibreM = finEstanciaYLimpiezaMinutos % 60;
                const horaFormateada = `${String(horaLibreH).padStart(2, '0')}:${String(horaLibreM).padStart(2, '0')}`;

                return res.status(400).json({
                    success: false,
                    message: `No se puede reservar. La habitación está ocupada y se liberará aproximadamente a las ${horaFormateada} hrs.`
                });
            }
        }

        const sqlCliente = "INSERT INTO clientes (nombre_completo, direccion, telefono) VALUES (?, ?, ?)";
        const [clienteRes] = await db.query(sqlCliente, [clienteNombre, clienteDireccion, clienteTelefono]);
        const clienteId = clienteRes.insertId;

        const sqlReserva = "INSERT INTO reservaciones (habitacion_id, cliente_id, fecha_reservacion, hora_reservacion, estado) VALUES (?, ?, ?, ?, 'PENDIENTE')";
        const [reservaRes] = await db.query(sqlReserva, [habitacion_id, clienteId, fecha_reservacion, hora_reservacion]);

        res.status(201).json({
            success: true,
            message: 'Reservación creada con éxito',
            reservacion_id: reservaRes.insertId
        });
    } catch (err) {
        console.error("Error al procesar reservación:", err);
        return res.status(500).json({ success: false, message: 'Error en el servidor al registrar la reservación' });
    }
});

app.put('/api/reservas/cancelar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo_cancelacion } = req.body;

        const sql = "UPDATE reservaciones SET estado = 'CANCELADA', motivo_cancelacion = ? WHERE id = ?";
        await db.query(sql, [motivo_cancelacion || 'Cancelado por recepción', id]);

        res.status(200).json({ success: true, message: 'Reservación cancelada correctamente' });
    } catch (err) {
        console.error("Error al cancelar reservación:", err);
        return res.status(500).json({ success: false, message: 'No se pudo cancelar la reservación' });
    }
});

app.get('/api/usuarios', async (req, res) => {
    try {
        const [results] = await db.query("SELECT id, nombre, correo, rol FROM usuarios ORDER BY id ASC");
        res.status(200).json({ success: true, usuarios: results });
    } catch (err) {
        console.error("Error al consultar usuarios:", err);
        return res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
    }
});

app.post('/api/usuarios', async (req, res) => {
    try {
        const { nombre, correo, password, rol } = req.body;
        const sql = "INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)";
        const [result] = await db.query(sql, [nombre, correo, password, rol]);
        res.status(201).json({ success: true, message: 'Usuario registrado con éxito', id: result.insertId });
    } catch (err) {
        console.error("Error al registrar usuario:", err);
        return res.status(500).json({ success: false, message: 'Error al registrar el usuario' });
    }
});

// Actualizar un usuario existente (Administrador del Sistema)
app.put('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, correo, password, rol } = req.body;

        let sql;
        let params;

        if (password && password.trim() !== "") {
            sql = "UPDATE usuarios SET nombre = ?, correo = ?, password = ?, rol = ? WHERE id = ?";
            params = [nombre, correo, password, rol, id];
        } else {
            sql = "UPDATE usuarios SET nombre = ?, correo = ?, rol = ? WHERE id = ?";
            params = [nombre, correo, rol, id];
        }

        await db.query(sql, params);
        res.status(200).json({ success: true, message: 'Usuario actualizado correctamente' });
    } catch (err) {
        console.error("Error al actualizar usuario:", err);
        return res.status(500).json({ success: false, message: 'No se pudo actualizar el usuario' });
    }
});

app.delete('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM usuarios WHERE id = ?", [id]);
        res.status(200).json({ success: true, message: 'Usuario eliminado correctamente' });
    } catch (err) {
        console.error("Error al eliminar usuario:", err);
        return res.status(500).json({ success: false, message: 'No se pudo eliminar el usuario' });
    }
});

app.put('/api/habitaciones/:id/limpiar', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = "UPDATE habitaciones SET estado = 'LIBRE_LIMPIA' WHERE id = ?";
        await db.query(sql, [id]);

        res.status(200).json({ success: true, message: 'Habitación limpia y disponible de nuevo.' });
    } catch (err) {
        console.error("Error al marcar habitación como limpia:", err);
        return res.status(500).json({ success: false, message: 'No se pudo actualizar el estado de limpieza.' });
    }
});

app.get('/api/reportes/recepcion', async (req, res) => {
    try {
        const { periodo, fecha_inicio, fecha_fin } = req.query;
        let filtroFecha = "DATE(r.created_at) = CURDATE()";

        if (periodo === 'semana') {
            filtroFecha = "YEARWEEK(r.created_at, 1) = YEARWEEK(CURDATE(), 1)";
        } else if (periodo === 'mes') {
            filtroFecha = "MONTH(r.created_at) = MONTH(CURDATE()) AND YEAR(r.created_at) = YEAR(CURDATE())";
        } else if (periodo === 'personalizado' && fecha_inicio && fecha_fin) {
            filtroFecha = `DATE(r.created_at) BETWEEN '${fecha_inicio}' AND '${fecha_fin}'`;
        }

        const sqlResumen = `
            SELECT 
                COUNT(*) AS total_estancias, 
                COALESCE(SUM(precio_cobrado), 0) AS ingresos_totales 
            FROM rentas r
            WHERE ${filtroFecha}
        `;

        const sqlDetalle = `
            SELECT r.id, r.habitacion_id, h.num_habitacion, r.precio_cobrado, r.estado, r.created_at, r.fecha_checkout 
            FROM rentas r
            JOIN habitaciones h ON r.habitacion_id = h.id
            WHERE ${filtroFecha}
            ORDER BY r.created_at DESC
        `;

        const [resumenResult] = await db.query(sqlResumen);
        const [detalleResult] = await db.query(sqlDetalle);

        return res.status(200).json({
            success: true,
            resumen: resumenResult[0] || { total_estancias: 0, ingresos_totales: 0 },
            detalle: detalleResult || []
        });
    } catch (err) {
        console.error("Error al generar reportes de recepción:", err);
        return res.status(500).json({ success: false, message: 'Error al generar reporte: ' + err.message });
    }
});

// ENDPOINT PARA OBTENER EL HISTORIAL GENERAL DE LIMPIEZAS (AUDITORÍA)
app.get('/api/limpiezas/historial', async (req, res) => {
    try {
        const sqlHistorial = `
            SELECT hl.*, h.num_habitacion, u.nombre as recamarista_nombre 
            FROM historial_limpiezas hl
            JOIN habitaciones h ON hl.habitacion_id = h.id
            LEFT JOIN usuarios u ON hl.recamarista_id = u.id
            ORDER BY hl.fecha_hora DESC
        `;
        const [rows] = await db.query(sqlHistorial);
        return res.status(200).json({ success: true, limpiezas: rows });
    } catch (err) {
        console.error("Error al obtener historial de limpiezas:", err);
        return res.status(500).json({ success: false, message: 'Error interno al cargar el historial.' });
    }
});

// Iniciar servidor en puerto 4000
app.listen(4000, () => {
    console.log("Servidor backend corriendo en el puerto 4000.");
});