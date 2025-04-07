
const { Pago, Factura, Reserva } = require("../models")
const { Op } = require("sequelize")
const sequelize = require("../database")

// Registrar un nuevo pago
exports.registrarPago = async (req, res) => {
  const transaction = await sequelize.transaction()

  try {
    const { facturaId, monto, metodo, referencia } = req.body

    // Verificar que la factura existe
    const factura = await Factura.findByPk(facturaId, { transaction })
    if (!factura) {
      await transaction.rollback()
      return res.status(404).json({ mensaje: "Factura no encontrada" })
    }

    // Verificar que la factura no esté anulada
    if (factura.estado === "anulada") {
      await transaction.rollback()
      return res.status(400).json({ mensaje: "No se puede registrar pago en una factura anulada" })
    }

    // Obtener el total de pagos ya realizados
    const pagosExistentes = await Pago.findAll({
      where: {
        facturaId,
        estado: "completado",
      },
      transaction,
    })

    const totalPagado = pagosExistentes.reduce((sum, pago) => sum + Number.parseFloat(pago.monto), 0)

    // Verificar que el monto no exceda el saldo pendiente
    const saldoPendiente = Number.parseFloat(factura.total) - totalPagado

    if (Number.parseFloat(monto) > saldoPendiente) {
      await transaction.rollback()
      return res.status(400).json({
        mensaje: "El monto del pago excede el saldo pendiente",
        saldoPendiente,
      })
    }

    // Crear el pago
    const pago = await Pago.create(
      {
        monto,
        fecha: new Date(),
        metodo,
        referencia,
        estado: "completado",
        facturaId,
      },
      { transaction },
    )

    // Actualizar el estado de la factura si está completamente pagada
    if (Number.parseFloat(monto) === saldoPendiente) {
      await factura.update({ estado: "pagada" }, { transaction })
    }

    await transaction.commit()

    res.status(201).json(pago)
  } catch (error) {
    await transaction.rollback()
    console.error("Error al registrar pago:", error)
    res.status(500).json({ mensaje: "Error al registrar el pago", error: error.message })
  }
}

// Obtener todos los pagos
exports.obtenerPagos = async (req, res) => {
  try {
    const pagos = await Pago.findAll({
      include: [
        {
          model: Factura,
          as: "factura",
          include: [{ model: Reserva, as: "reserva" }],
        },
      ],
    })

    res.status(200).json(pagos)
  } catch (error) {
    console.error("Error al obtener pagos:", error)
    res.status(500).json({ mensaje: "Error al obtener los pagos", error: error.message })
  }
}

// Obtener un pago por ID
exports.obtenerPagoPorId = async (req, res) => {
  try {
    const { id } = req.params

    const pago = await Pago.findByPk(id, {
      include: [
        {
          model: Factura,
          as: "factura",
          include: [{ model: Reserva, as: "reserva" }],
        },
      ],
    })

    if (!pago) {
      return res.status(404).json({ mensaje: "Pago no encontrado" })
    }

    res.status(200).json(pago)
  } catch (error) {
    console.error("Error al obtener pago:", error)
    res.status(500).json({ mensaje: "Error al obtener el pago", error: error.message })
  }
}

// Procesar reembolso
exports.procesarReembolso = async (req, res) => {
  const transaction = await sequelize.transaction()

  try {
    const { id } = req.params
    const { motivo } = req.body

    // Verificar que el pago existe
    const pago = await Pago.findByPk(id, {
      include: [{ model: Factura, as: "factura" }],
      transaction,
    })

    if (!pago) {
      await transaction.rollback()
      return res.status(404).json({ mensaje: "Pago no encontrado" })
    }

    // Verificar que el pago no esté ya reembolsado
    if (pago.estado === "reembolsado") {
      await transaction.rollback()
      return res.status(400).json({ mensaje: "El pago ya ha sido reembolsado" })
    }

    // Actualizar el estado del pago
    await pago.update(
      {
        estado: "reembolsado",
        referencia: pago.referencia ? `${pago.referencia} (Reembolsado: ${motivo})` : `Reembolsado: ${motivo}`,
      },
      { transaction },
    )

    // Actualizar el estado de la factura si estaba pagada
    if (pago.factura.estado === "pagada") {
      await pago.factura.update({ estado: "emitida" }, { transaction })
    }

    await transaction.commit()

    res.status(200).json({ mensaje: "Reembolso procesado correctamente", pago })
  } catch (error) {
    await transaction.rollback()
    console.error("Error al procesar reembolso:", error)
    res.status(500).json({ mensaje: "Error al procesar el reembolso", error: error.message })
  }
}
