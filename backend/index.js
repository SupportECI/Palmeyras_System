const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

const rutaFrontend = '/home/u305085050/domains/syspal.eurocentrodeidiomas.com/public_html';
app.use(express.static(rutaFrontend));

// Conexión a la base de datos mediante pool
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hotel_palmeyras',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Verificamos que el Pool responda correctamente al arrancar
async function verificarConexion() {
    try {
        const connection = await db.getConnection();
        console.log("Conectado exitosamente a la base de datos de Hotel Palmeyras.");
        connection.release();
    } catch (err) {
        console.error("Error al conectar a la base de datos:", err);
    }
}
verificarConexion();

app.post('/api/login', async (req, res) => {
    try {
        const { correo, password } = req.body;
        const correoFinal = correo;

        if (!correoFinal || !password) {
            return res.status(400).json({ success: false, message: "Correo y contraseña requeridos" });
        }

        // Buscamos al usuario por correo (ajusta 'correo' o 'email' según tu columna en MySQL)
        const [rows] = await db.query("SELECT * FROM usuarios WHERE correo = ?", [correoFinal]);
        
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: "Usuario no encontrado" });
        }

        const usuario = rows[0];

        // Comparamos la contraseña escrita con la encriptada en la base de datos
        const passwordMatch = await bcrypt.compare(password, usuario.password);

        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
        }

        // Si todo es correcto, devolvemos el usuario y su rol
        return res.status(200).json({
            success: true,
            message: "Login exitoso",
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });

    } catch (err) {
        console.error("Error en el login:", err);
        return res.status(500).json({ success: false, message: "Error en el servidor: " + err.message });
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

        // Validamos que el estado recibido sea uno de los permitidos en la base de datos
        const estadosPermitidos = ['LIBRE_LIMPIA', 'LIBRE_SUCIA', 'OCUPADA', 'RESERVADA', 'MANTENIMIENTO', 'LIMPIEZA_SEMANAL'];
        
        if (!estadosPermitidos.includes(estado)) {
            return res.status(400).json({ success: false, message: "Estado de habitación no válido" });
        }

        const sql = "UPDATE habitaciones SET estado = ? WHERE id = ?";
        await db.query(sql, [estado, id]);

        return res.status(200).json({ success: true, message: "Estado actualizado correctamente" });
    } catch (err) {
        console.error("Error al actualizar estado:", err);
        return res.status(500).json({ success: false, message: "Error en el servidor: " + err.message });
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

//Editar habitación (Admin)
app.put('/api/habitaciones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { num_habitacion, tipo, precio_base } = req.body;
        
        await db.query(
            "UPDATE habitaciones SET num_habitacion = ?, tipo = ?, precio_base = ? WHERE id = ?",
            [num_habitacion, tipo, precio_base, id]
        );
        
        res.json({ success: true, message: "Habitación actualizada correctamente" });
    } catch (error) {
        console.error("Error al actualizar habitación:", error);
        res.status(500).json({ error: error.message });
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
        const correoFinal = correo;

        if (!nombre || !correoFinal || !password || !rol) {
            return res.status(400).json({ success: false, message: "Todos los campos son obligatorios" });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const sql = "INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)";
        await db.query(sql, [nombre, correoFinal, hashedPassword, rol]);

        return res.status(201).json({ success: true, message: "Usuario registrado con éxito" });
    } catch (err) {
        console.error("Error al registrar usuario:", err);
        return res.status(500).json({ success: false, message: "Error en el servidor: " + err.message });
    }
});

// Actualizar un usuario existente (Administrador del Sistema)
app.put('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, correo, rol, password } = req.body;
        const correoFinal = correo; 

        // Si se proporciona una contraseña nueva, la encriptamos. Si no, actualizamos solo los datos.
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            const sql = "UPDATE usuarios SET nombre = ?, correo = ?, rol = ?, password = ? WHERE id = ?";
            await db.query(sql, [nombre, correoFinal, rol, hashedPassword, id]);
        } else {
            const sql = "UPDATE usuarios SET nombre = ?, correo = ?, rol = ? WHERE id = ?";
            await db.query(sql, [nombre, correoFinal, rol, id]);
        }

        return res.status(200).json({ success: true, message: "Usuario actualizado correctamente" });
    } catch (err) {
        console.error("Error al actualizar usuario:", err);
        return res.status(500).json({ success: false, message: "Error en el servidor al actualizar" });
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
        
        let query = `
            SELECT r.*, h.num_habitacion 
            FROM rentas r 
            LEFT JOIN habitaciones h ON r.habitacion_id = h.id 
            WHERE 1=1
        `;
        let params = [];

        if (periodo === 'personalizado' && fecha_inicio && fecha_fin) {
            query += " AND DATE(r.created_at) BETWEEN ? AND ?";
            params.push(fecha_inicio, fecha_fin);
        } else if (periodo === 'dia') {
            query += " AND DATE(r.created_at) = CURDATE()";
        } else if (periodo === 'semana') {
            query += " AND YEARWEEK(r.created_at, 1) = YEARWEEK(CURDATE(), 1)";
        } else if (periodo === 'mes') {
            query += " AND MONTH(r.created_at) = MONTH(CURDATE()) AND YEAR(r.created_at) = YEAR(CURDATE())";
        }

        const [detalle] = await db.query(query, params);
        
        let ingresos_totales = detalle.reduce((acc, item) => acc + Number(item.precio_cobrado || 0), 0);
        
        res.json({
            resumen: {
                total_estancias: detalle.length,
                ingresos_totales
            },
            detalle
        });
    } catch (err) {
        console.error("Error en reporte:", err);
        res.status(500).json({ error: err.message });
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

app.use((req, res) => {
    res.sendFile(path.join(rutaFrontend, 'index.html'));
});

// Iniciar servidor en puerto 4000
app.listen(4000, () => {
    console.log("Servidor backend corriendo en el puerto 4000.");
});