const express = require("express")
const router = express.Router()
const pagoController = require("../controllers/pagoController")

// Rutas para pagos
router.post("/", pagoController.registrarPago)
router.get("/", pagoController.obtenerPagos)
router.get("/:id", pagoController.obtenerPagoPorId)
router.put("/:id/reembolso", pagoController.procesarReembolso)

module.exports = router

