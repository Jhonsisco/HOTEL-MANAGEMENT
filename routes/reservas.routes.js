const express = require("express");
const router = express.Router();
const reservasController = require("../controllers/reservas.controller");

// Ruta para crear una reserva
router.post("/", reservasController.crearReserva);

// Ruta para obtener todas las reservas
router.get("/", reservasController.obtenerReservas);

// Ruta para obtener una reserva por ID
router.get("/:id", reservasController.obtenerReservaPorId);

// Ruta para actualizar una reserva
router.put("/:id", reservasController.actualizarReserva);

// Ruta para eliminar (cancelar) una reserva
router.delete("/:id", reservasController.eliminarReserva);

module.exports = router;
