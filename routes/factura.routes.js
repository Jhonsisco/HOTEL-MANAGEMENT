
const express = require("express")
const router = express.Router()
const facturaController = require("../controllers/facturaController")

// Rutas para facturas
router.post("/", facturaController.crearFactura)
router.get("/", facturaController.obtenerFacturas)
router.get("/:id", facturaController.obtenerFacturaPorId)
router.get("/cliente/:documento", facturaController.obtenerFacturasPorCliente)
router.put("/:id/anular", facturaController.anularFactura)
router.get("/:id/pdf", facturaController.generarPDFFactura)

module.exports = router
