const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conexión exitosa a la base de datos MySQL (hotel_palmeyras)');
});

app.get('/', (req, res) => {
    res.send('API del Hotel Palmeyras funcionando correctamente');
});

const PORT = process.env.PORT || 4000;

app.delete('/api/habitaciones/:id', (req, res) => {
    const habitacionId = req.params.id;
    const sql = 'DELETE FROM habitaciones WHERE id = ?';

    db.query(sql, [habitacionId], (error, resultados) => {
        if (error) {
            console.error('Error en base de datos:', error);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }
        res.status(200).json({ success: true, message: 'Habitación eliminada con éxito' });
    });
});

app.post('/api/login', (req, res) => {
    const { correo, password_hash } = req.body;

    if(!correo || !password_hash) {
        return res.status(400).json({
            success: false,
            message: 'Correo y contraseña son obligatorios'
        });
    }

    const sql = 'SELECT id, nombre, email, rol FROM usuarios WHERE email = ? AND password_hash = ?';

    db.query(sql, [correo, password_hash], (error, results) => {
        if (error) {
            console.error('Error en el login:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno en el servidor'
            });
        }

        if(results.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const usuario = results[0];

        res.status(200).json({
            success: true,
            message: 'Login exitoso',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.email,
                rol: usuario.rol,
            },
        });
    });
});

app.get('/api/habitaciones', (req, res) => {
    const sql = `SELECT h.*, c.nombre_completo AS cliente_nombre
                FROM habitaciones h
                LEFT JOIN rentas r ON h.id = r.habitacion_id AND r.estado_renta = 'ACTIVA'
                LEFT JOIN clientes c ON r.cliente_id = c.id
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error al obtener las habitaciones:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener las habitaciones'
            });
        }

        res.status(200).json({
            success: true,
            total: results.length,
            habitaciones: results
        });
    });
});

app.post('/api/habitaciones', (req, res) => {
    const { num_habitacion, tipo, precio_base, estado } = req.body;

    if (!num_habitacion || !tipo || !precio_base) {
        return res.status(400).json({
            success: false,
            message: 'Todos los campos son obligatorios'
        });
    }

    const sql = 'INSERT INTO habitaciones (num_habitacion, tipo, precio_base, estado) VALUES (?, ?, ?, ?)';

    db.query(sql, [num_habitacion, tipo, precio_base, estado || 'LIBRE_LIMPIA'], (error, results) => {
        if (error) {
            console.error('Error al registrar la habitación:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al registrar la habitación'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Habitación registrada con éxito',
            habitacion_id: results.insertId
        });
    });
});

app.post('/api/checkin', (req, res) => {
    const { habitacion_id, nombre_completo, direccion, celular, precio_cobrado, usuario_recepcion_id } = req.body;

    console.log({ habitacion_id, nombre_completo, direccion, celular,precio_cobrado, usuario_recepcion_id });

    if ( !habitacion_id || !nombre_completo || !direccion || !celular || !precio_cobrado || !usuario_recepcion_id ) {
        return res.status(400).json({
            success: false,
            message: 'Todos los campos son obligatorios'
        });
    }

    const sqlVerificar = 'SELECT estado FROM habitaciones WHERE id = ?';

    db.query(sqlVerificar, [habitacion_id], (error, results) =>{
        if (error || results.length === 0) {
            console.error('Error al verificar el estado de la habitacion:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al verificar el estado de la habitacion',
            });
        }

        const habitacion = results[0];

        if (habitacion.estado !== 'LIBRE_LIMPIA') {
            return res.status(400).json({
                success: false,
                message: 'La habitacion no está disponible para check-in',
            });
        }

        const sqlCliente = 'INSERT INTO clientes (nombre_completo, direccion, celular) VALUES (?, ?, ?)';

        db.query(sqlCliente, [nombre_completo, direccion, celular], (error, resultCliente) => {
            if (error) {
                console.error('Error al registrar al cliente:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error al registrar al cliente',
                });
            }

            const cliente_id = resultCliente.insertId;

            const sqlRenta = `INSERT INTO rentas (habitacion_id, cliente_id, precio_cobrado, usuario_recepcion_id, estado_renta) VALUES (?, ?, ?, ?, 'ACTIVA')`;

            db.query(sqlRenta, [habitacion_id, cliente_id, precio_cobrado, usuario_recepcion_id], (error, resultRenta) => {
                if(error) {
                    console.error(error, 'Error al registrar la renta');
                    return res.status(500).json({
                        success: false,
                        message: 'Error al registrar la renta',
                    });
                }

                const sqlActualizarHabitacion = "UPDATE habitaciones SET estado = 'OCUPADA' WHERE id = ?";

                db.query(sqlActualizarHabitacion, [habitacion_id], (error) => {
                    if(error) {
                        console.error('Error al actualizar el estado de la habitacion:', error);
                        return res.status(500).json({
                            success: false,
                            message: 'Error al actualizar el estado de la habitacion',
                        });
                    }

                    res.status(200).json({
                        success: true,
                        message: 'Check-in realizado con exito',
                        renta_id: resultRenta.insertId,
                    });
                });
            });
        });
    });
});

app.post('/api/reservaciones', (req, res) => {
    const { habitacion_id, nombre_completo, direccion, celular, precio_cobrado, usuario_recepcion_id } = req.body;

    if (!habitacion_id || !nombre_completo || !direccion || !celular || !precio_cobrado || !usuario_recepcion_id) {
        return res.status(400).json({
            success: false,
            message: 'Todos los campos son obligatorios'
        });
    }

    const sqlVerificar = 'SELECT estado FROM habitaciones WHERE id = ?';
    db.query(sqlVerificar, [habitacion_id], (error, results) => {
        if (error || results.length === 0 || results[0].estado !== 'LIBRE_LIMPIA') {
            return res.status(400).json({
                success: false,
                message: 'La habitación no está disponible para reservación'
            });
        }

        const sqlCliente = 'INSERT INTO clientes (nombre_completo, direccion, celular) VALUES (?, ?, ?)';
        db.query(sqlCliente, [nombre_completo, direccion, celular], (error, resultCliente) => {
            if (error) {
                return res.status(500).json({ success: false, message: 'Error al registrar al cliente' });
            }

            const cliente_id = resultCliente.insertId;
            const sqlRenta = `INSERT INTO rentas (habitacion_id, cliente_id, precio_cobrado, usuario_recepcion_id, estado_renta) VALUES (?, ?, ?, ?, 'ACTIVA')`;

            db.query(sqlRenta, [habitacion_id, cliente_id, precio_cobrado, usuario_recepcion_id], (error, resultRenta) => {
                if (error) {
                    return res.status(500).json({ success: false, message: 'Error al registrar la reservación' });
                }

                const sqlActualizarHabitacion = "UPDATE habitaciones SET estado = 'RESERVADA' WHERE id = ?";
                db.query(sqlActualizarHabitacion, [habitacion_id], (error) => {
                    if (error) {
                        return res.status(500).json({ success: false, message: 'Error al actualizar habitación' });
                    }

                    res.status(201).json({
                        success: true,
                        message: 'Reservación realizada con éxito',
                        renta_id: resultRenta.insertId
                    });
                });
            });
        });
    });
});

app.get('/api/rentas/activas', (req, res) => {
    const sql = `SELECT r.id AS renta_id, r.fecha_checkin, r.precio_cobrado,
               h.id AS habitacion_id, h.num_habitacion, h.tipo,
               c.id AS cliente_id, c.nombre_completo, c.celular, c.direccion
        FROM rentas r
        JOIN habitaciones h ON r.habitacion_id = h.id
        JOIN clientes c ON r.cliente_id = c.id
        WHERE h.estado = 'RESERVADA' AND r.estado_renta = 'ACTIVA'
    `;

    db.query(sql, (error, resultados) => {
        if(error) {
            console.error('Error al obtener las rentas activas:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener las rentas activas',
            });
        }

        res.status(200).json({
            success: true,
            total: resultados.length,
            rentas_activas: resultados
        });
    });
});

app.put('/api/reservas/cancelar/:id', (req, res) => {
    const rentaId = req.params.id;
    const { motivo_cancelacion, usuario_cancela_id } = req.body;

    if (!motivo_cancelacion || motivo_cancelacion.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'El motivo de cancelación es obligatorio'
        });
    }

    const sqlBuscar = "SELECT habitacion_id FROM rentas WHERE id = ? AND estado_renta = 'ACTIVA'";
    db.query(sqlBuscar, [rentaId], (err, resultados) => {
        if (err || resultados.length === 0) {
            return res.status(404).json({ success: false, message: 'Reservación no encontrada' });
        }

        const habitacionId = resultados[0].habitacion_id;

        const sqlActualizarRenta = `
            UPDATE rentas 
            SET estado_renta = 'CANCELADA', motivo_cancelacion = ?, usuario_cancela_id = ? 
            WHERE id = ?
        `;

        db.query(sqlActualizarRenta, [motivo_cancelacion, usuario_cancela_id || null, rentaId], (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error al cancelar la renta' });
            }

            const sqlLiberarHabitacion = "UPDATE habitaciones SET estado = 'LIBRE_LIMPIA' WHERE id = ?";
            db.query(sqlLiberarHabitacion, [habitacionId], (err) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Error al liberar la habitación' });
                }

                res.status(200).json({
                    success: true,
                    message: 'Reservación cancelada con éxito'
                });
            });
        });
    });
});

app.get('/api/rentas', (req, res) => {
    const sql = `
        SELECT r.id AS renta_id, r.fecha_checkin, r.fecha_checkout, r.precio_cobrado, r.estado_renta,
               h.numero_habitacion, h.tipo,
               c.nombre_completo AS cliente,
               u.nombre AS recepcionista
        FROM rentas r
        JOIN habitaciones h ON r.habitacion_id = h.id
        JOIN clientes c ON r.cliente_id = c.id
        JOIN usuarios u ON r.usuario_recepcion_id = u.id
        ORDER BY r.id DESC
    `;

    db.query(sql, (error, resultados) => {
        if(error) {
            console.error('Error al obtener las rentas:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener las rentas',
            });
        }

        res.status(200).json({
            success: true,
            total: resultados.length,
            rentas: resultados,
        });
    });
});

app.put('/api/checkout/:id', (req, res) => {
    const rentaId = req.params.id;

    const sqlBuscarRenta = "SELECT habitacion_id FROM rentas WHERE id = ? AND estado_renta = 'ACTIVA'";

    db.query(sqlBuscarRenta, [rentaId], (err, resultados) => {
        if(err || resultados.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Renta no encontrada o ya finalizada'
            });
        }

        const habitacionId = resultados[0].habitacion_id;

        const sqlActualizarRenta = `
            UPDATE rentas
            SET estado_renta = 'FINALIZADA', fecha_checkout = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        db.query(sqlActualizarRenta, [rentaId], (err) => {
            if(err) {
                console.error('Error al actualizar la renta:', err);
                return res.status(500).json({
                    success: false, 
                    message: 'Error al actualizar la renta'
                });
            }

            const sqlActualizarHabitacion = "UPDATE habitaciones SET estado = 'LIBRE_SUCIA' WHERE id = ?";

            db.query(sqlActualizarHabitacion, [habitacionId], (err) => {
                if(err) {
                    console.error('Error al actualizar el estado de la habitacion:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error al actualizar el estado de la habitacion'
                    });
                }

                res.status(200).json({
                    success: true,
                    message: 'Check-out realizado con exito. Habitacion marcada como LIBRE_SUCIA'
                });
            });
        });
    });
});

app.put('/api/habitaciones/:id/limpiar', (req, res) => {
    const habitacionId = req.params.id;

    const sqlActualizarHabitacion = "UPDATE habitaciones SET estado = 'LIBRE_LIMPIA' WHERE id =? AND estado = 'LIBRE_SUCIA'";

    db.query(sqlActualizarHabitacion, [habitacionId], (err, resultados) => {
        if(err) {
            console.error('Error al actualizar el estado de la habitacion:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar el estado de la habitacion'
            });
        }

        if(resultados.affectedRows === 0){
            return res.status(400).json({
                success: false,
                message: 'La habitacion no se existe o no esta en el estado LIBRE_SUCIA'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Habitacion marcada como LIBRE_LIMPIA y lista para check-in'
        });
    })
})

app.put('/api/habitaciones/:id/estado', (req, res) => {
    const habitacionId = req.params.id;
    const { estado } = req.body;

    const sql = 'UPDATE habitaciones SET estado = ? WHERE id = ?';

    db.query(sql, [estado, habitacionId], (err, resultados) => {
        if(err) {
            console.error('Error al actualizar el estado de la habitacion', err);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar el estado de la habitacion'
            });
        }

        if(resultados.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'La habitacion no existe'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Estado actualizado correctamente'
        })
    })
})

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});