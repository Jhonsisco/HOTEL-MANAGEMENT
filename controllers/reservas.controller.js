const { Reserva, Habitacion } = require("../models");

exports.crearReserva = async (req, res) => {
  try {
    const { habitacionId, nombre, documento, fechaEntrada, fechaSalida } = req.body;

    // Validar que todos los campos obligatorios estén presentes
    if (!habitacionId || !nombre || !documento || !fechaEntrada || !fechaSalida) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    // Verificar que la habitación exista y esté disponible
    const habitacion = await Habitacion.findByPk(habitacionId);
    if (!habitacion) {
      return res.status(404).json({ error: "La habitación no existe" });
    }
    if (habitacion.estado !== "disponible") {
      return res.status(400).json({ error: "La habitación no está disponible" });
    }

    // Crear la reserva
    const nuevaReserva = await Reserva.create({
      habitacionId,
      nombre,
      documento,
      fechaEntrada,
      fechaSalida
    });

    // Marcar la habitación como ocupada
    await habitacion.update({ estado: "ocupada" });

    res.status(201).json({ reserva: nuevaReserva });
  } catch (error) {
    console.error("❌ Error en crearReserva:", error);
    res.status(500).json({ error: "No se pudo crear la reserva" });
  }
};

exports.obtenerReservas = async (req, res) => {
  try {
    // Se usa el alias "habitacion" definido en la asociación del modelo Reserva
    const reservas = await Reserva.findAll({
      include: [{ model: Habitacion, as: "habitacion" }]
    });
    res.status(200).json(reservas);
  } catch (error) {
    console.error("❌ Error en obtenerReservas:", error);
    res.status(500).json({ error: "No se pudieron obtener las reservas" });
  }
};

exports.obtenerReservaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const reserva = await Reserva.findByPk(id, {
      include: [{ model: Habitacion, as: "habitacion" }]
    });

    if (!reserva) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    res.status(200).json(reserva);
  } catch (error) {
    console.error("❌ Error en obtenerReservaPorId:", error);
    res.status(500).json({ error: "No se pudo obtener la reserva" });
  }
};

exports.actualizarReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaEntrada, fechaSalida } = req.body;

    const reserva = await Reserva.findByPk(id);
    if (!reserva) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    await reserva.update({ fechaEntrada, fechaSalida });
    res.status(200).json({ mensaje: "Reserva actualizada", reserva });
  } catch (error) {
    console.error("❌ Error en actualizarReserva:", error);
    res.status(500).json({ error: "No se pudo actualizar la reserva" });
  }
};

exports.eliminarReserva = async (req, res) => {
  try {
    const { id } = req.params;

    const reserva = await Reserva.findByPk(id);
    if (!reserva) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    // Liberar la habitación asociada
    const habitacion = await Habitacion.findByPk(reserva.habitacionId);
    if (habitacion) {
      await habitacion.update({ estado: "disponible" });
    }

    await reserva.destroy();
    res.status(200).json({ mensaje: "Reserva eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error en eliminarReserva:", error);
    res.status(500).json({ error: "No se pudo eliminar la reserva" });
  }
};
