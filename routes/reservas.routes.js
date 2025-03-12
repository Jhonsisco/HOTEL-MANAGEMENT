// routes/reservas.routes.js
const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const { Reserva, Habitacion } = require('../models');
const { enviarCorreo } = require('../config/nodemailer');
const { Op } = require('sequelize');

// Crear una reserva
router.post('/', verificarToken, async (req, res) => {
  try {
    const { nombre, documento, fechaEntrada, fechaSalida, habitacionId, notas, email } = req.body;
    
    // Verificar que la habitación exista y esté disponible
    const habitacion = await Habitacion.findByPk(habitacionId);
    if (!habitacion || habitacion.estado !== 'disponible') {
      return res.status(400).json({ error: 'Habitación no disponible' });
    }
    
    const nuevaReserva = await Reserva.create({ nombre, documento, fechaEntrada, fechaSalida, habitacionId, notas });
    
    // Actualizar el estado de la habitación a "ocupada"
    await habitacion.update({ estado: 'ocupada' });
    
    // Enviar correo de confirmación (si se proporcionó email)
    if (email) {
      await enviarCorreo(email, 'Reserva confirmada', 'Tu reserva ha sido confirmada.');
    }
    
    res.status(201).json({ reserva: nuevaReserva });
  } catch (error) {
    console.error('❌ Error al crear reserva:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Check-in: marcar habitación como ocupada (opcional, ya se hace en creación)
router.put('/checkin/:id', verificarToken, async (req, res) => {
  try {
    const reserva = await Reserva.findByPk(req.params.id, { include: 'habitacion' });
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    
    await reserva.habitacion.update({ estado: 'ocupada' });
    res.json({ mensaje: 'Check-in realizado' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Check-out: liberar la habitación
router.put('/checkout/:id', verificarToken, async (req, res) => {
  try {
    const reserva = await Reserva.findByPk(req.params.id, { include: 'habitacion' });
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    
    await reserva.habitacion.update({ estado: 'disponible' });
    res.json({ mensaje: 'Check-out realizado' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Buscar reservas por nombre o documento
router.get('/', verificarToken, async (req, res) => {
    try {
      const reservas = await Reserva.findAll({ include: { model: Habitacion, as: 'habitacion' } });
      res.status(200).json(reservas);
    } catch (error) {
      console.error('Error al obtener reservas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

module.exports = router;
