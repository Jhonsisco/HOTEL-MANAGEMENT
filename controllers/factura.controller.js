const { Factura, Reserva, Pago } = require("../models")
const { Op } = require("sequelize")
const PDFDocument = require("pdfkit")
const fs = require("fs")
const path = require("path")

// Generar número de factura único
const generarNumeroFactura = async () => {
  const fecha = new Date()
  const año = fecha.getFullYear().toString().substr(-2)
  const mes = (fecha.getMonth() + 1).toString().padStart(2, "0")

  // Obtener la última factura del mes actual
  const ultimaFactura = await Factura.findOne({
    where: {
      numero: {
        [Op.like]: `F${año}${mes}%`,
      },
    },
    order: [["numero", "DESC"]],
  })

  let secuencia = 1
  if (ultimaFactura) {
    // Extraer la secuencia de la última factura y aumentarla en 1
    const ultimaSecuencia = Number.parseInt(ultimaFactura.numero.substr(5))
    secuencia = ultimaSecuencia + 1
  }

  return `F${año}${mes}${secuencia.toString().padStart(4, "0")}`
}

// Calcular el total de la factura basado en la reserva
const calcularTotalReserva = (reserva) => {
  const fechaEntrada = new Date(reserva.fechaEntrada)
  const fechaSalida = new Date(reserva.fechaSalida)
  const diasEstancia = Math.ceil((fechaSalida - fechaEntrada) / (1000 * 60 * 60 * 24))

  return diasEstancia * (reserva.precioNoche || 0)
}

// Crear una nueva factura
exports.crearFactura = async (req, res) => {
  try {
    const { reservaId, conceptos } = req.body

    // Verificar que la reserva existe
    const reserva = await Reserva.findByPk(reservaId)
    if (!reserva) {
      return res.status(404).json({ mensaje: "Reserva no encontrada" })
    }

    // Generar número de factura
    const numeroFactura = await generarNumeroFactura()

    // Calcular total
    let total = calcularTotalReserva(reserva)

    // Si hay conceptos adicionales, sumarlos al total
    if (conceptos && Array.isArray(conceptos)) {
      const totalConceptos = conceptos.reduce((sum, concepto) => sum + Number.parseFloat(concepto.monto), 0)
      total += totalConceptos
    }

    // Crear la factura
    const factura = await Factura.create({
      numero: numeroFactura,
      fecha: new Date(),
      total,
      estado: "emitida",
      reservaId,
      conceptos: conceptos || [],
    })

    res.status(201).json(factura)
  } catch (error) {
    console.error("Error al crear factura:", error)
    res.status(500).json({ mensaje: "Error al crear la factura", error: error.message })
  }
}

// Obtener todas las facturas
exports.obtenerFacturas = async (req, res) => {
  try {
    const facturas = await Factura.findAll({
      include: [
        { model: Reserva, as: "reserva", include: ["habitacion"] },
        { model: Pago, as: "pagos" },
      ],
    })

    res.status(200).json(facturas)
  } catch (error) {
    console.error("Error al obtener facturas:", error)
    res.status(500).json({ mensaje: "Error al obtener las facturas", error: error.message })
  }
}

// Obtener una factura por ID
exports.obtenerFacturaPorId = async (req, res) => {
  try {
    const { id } = req.params

    const factura = await Factura.findByPk(id, {
      include: [
        { model: Reserva, as: "reserva", include: ["habitacion"] },
        { model: Pago, as: "pagos" },
      ],
    })

    if (!factura) {
      return res.status(404).json({ mensaje: "Factura no encontrada" })
    }

    res.status(200).json(factura)
  } catch (error) {
    console.error("Error al obtener factura:", error)
    res.status(500).json({ mensaje: "Error al obtener la factura", error: error.message })
  }
}

// Obtener facturas por cliente (documento)
exports.obtenerFacturasPorCliente = async (req, res) => {
  try {
    const { documento } = req.params

    const facturas = await Factura.findAll({
      include: [
        {
          model: Reserva,
          as: "reserva",
          where: { documento },
          include: ["habitacion"],
        },
        { model: Pago, as: "pagos" },
      ],
    })

    res.status(200).json(facturas)
  } catch (error) {
    console.error("Error al obtener facturas del cliente:", error)
    res.status(500).json({ mensaje: "Error al obtener las facturas del cliente", error: error.message })
  }
}

// Anular una factura
exports.anularFactura = async (req, res) => {
  try {
    const { id } = req.params
    const { motivo } = req.body

    const factura = await Factura.findByPk(id, {
      include: [{ model: Pago, as: "pagos" }],
    })

    if (!factura) {
      return res.status(404).json({ mensaje: "Factura no encontrada" })
    }

    // Verificar si la factura ya está anulada
    if (factura.estado === "anulada") {
      return res.status(400).json({ mensaje: "La factura ya está anulada" })
    }

    // Verificar si hay pagos que no estén reembolsados
    const pagosPendientes = factura.pagos.filter((pago) => pago.estado !== "reembolsado")
    if (pagosPendientes.length > 0) {
      return res.status(400).json({
        mensaje: "No se puede anular la factura porque tiene pagos pendientes de reembolso",
        pagos: pagosPendientes,
      })
    }

    // Anular la factura
    await factura.update({
      estado: "anulada",
      conceptos: [...(factura.conceptos || []), { tipo: "anulacion", motivo, fecha: new Date() }],
    })

    res.status(200).json({ mensaje: "Factura anulada correctamente", factura })
  } catch (error) {
    console.error("Error al anular factura:", error)
    res.status(500).json({ mensaje: "Error al anular la factura", error: error.message })
  }
}

// Generar PDF de la factura
exports.generarPDFFactura = async (req, res) => {
  try {
    const { id } = req.params

    const factura = await Factura.findByPk(id, {
      include: [
        { model: Reserva, as: "reserva", include: ["habitacion"] },
        { model: Pago, as: "pagos" },
      ],
    })

    if (!factura) {
      return res.status(404).json({ mensaje: "Factura no encontrada" })
    }

    // Crear directorio para PDFs si no existe
    const pdfDir = path.join(__dirname, "../pdfs")
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir)
    }

    const pdfPath = path.join(pdfDir, `factura-${factura.numero}.pdf`)
    const doc = new PDFDocument()
    const stream = fs.createWriteStream(pdfPath)

    doc.pipe(stream)

    // Encabezado
    doc.fontSize(20).text("FACTURA", { align: "center" })
    doc.moveDown()
    doc.fontSize(12).text(`Número: ${factura.numero}`)
    doc.text(`Fecha: ${new Date(factura.fecha).toLocaleDateString()}`)
    doc.text(`Estado: ${factura.estado.toUpperCase()}`)
    doc.moveDown()

    // Datos del cliente
    doc.fontSize(14).text("Datos del Cliente", { underline: true })
    doc.fontSize(12).text(`Nombre: ${factura.reserva.nombre}`)
    doc.text(`Documento: ${factura.reserva.documento}`)
    if (factura.reserva.email) doc.text(`Email: ${factura.reserva.email}`)
    if (factura.reserva.telefono) doc.text(`Teléfono: ${factura.reserva.telefono}`)
    doc.moveDown()

    // Datos de la reserva
    doc.fontSize(14).text("Datos de la Reserva", { underline: true })
    doc.fontSize(12).text(`Habitación: ${factura.reserva.habitacion.numero} (${factura.reserva.habitacion.tipo})`)
    doc.text(`Fecha de entrada: ${new Date(factura.reserva.fechaEntrada).toLocaleDateString()}`)
    doc.text(`Fecha de salida: ${new Date(factura.reserva.fechaSalida).toLocaleDateString()}`)

    // Calcular días de estancia
    const fechaEntrada = new Date(factura.reserva.fechaEntrada)
    const fechaSalida = new Date(factura.reserva.fechaSalida)
    const diasEstancia = Math.ceil((fechaSalida - fechaEntrada) / (1000 * 60 * 60 * 24))

    doc.text(`Días de estancia: ${diasEstancia}`)
    doc.moveDown()

    // Conceptos facturados
    doc.fontSize(14).text("Conceptos Facturados", { underline: true })

    // Tabla de conceptos
    let y = doc.y + 20
    doc.fontSize(10)

    // Encabezados de tabla
    doc.text("Concepto", 50, y)
    doc.text("Cantidad", 300, y)
    doc.text("Precio", 380, y)
    doc.text("Total", 460, y)

    y += 20

    // Línea separadora
    doc.moveTo(50, y).lineTo(550, y).stroke()
    y += 10

    // Alojamiento
    doc.text("Alojamiento", 50, y)
    doc.text(`${diasEstancia} días`, 300, y)
    doc.text(`${factura.reserva.precioNoche?.toFixed(2) || "0.00"}`, 380, y)
    doc.text(`${(diasEstancia * (factura.reserva.precioNoche || 0)).toFixed(2)}`, 460, y)

    y += 20

    // Conceptos adicionales
    if (factura.conceptos && Array.isArray(factura.conceptos)) {
      factura.conceptos.forEach((concepto) => {
        if (concepto.tipo !== "anulacion") {
          doc.text(concepto.descripcion || "Concepto adicional", 50, y)
          doc.text("1", 300, y)
          doc.text(concepto.monto.toFixed(2), 380, y)
          doc.text(concepto.monto.toFixed(2), 460, y)
          y += 20
        }
      })
    }

    // Línea separadora
    doc.moveTo(50, y).lineTo(550, y).stroke()
    y += 20

    // Total
    doc.fontSize(12).text("TOTAL:", 380, y)
    doc.text(`${factura.total.toFixed(2)}`, 460, y)

    // Pagos realizados
    if (factura.pagos && factura.pagos.length > 0) {
      y += 40
      doc.fontSize(14).text("Pagos Realizados", { underline: true })
      y += 20

      // Encabezados de tabla de pagos
      doc.fontSize(10)
      doc.text("Fecha", 50, y)
      doc.text("Método", 150, y)
      doc.text("Referencia", 250, y)
      doc.text("Estado", 350, y)
      doc.text("Monto", 460, y)

      y += 20

      // Línea separadora
      doc.moveTo(50, y).lineTo(550, y).stroke()
      y += 10

      // Listar pagos
      factura.pagos.forEach((pago) => {
        doc.text(new Date(pago.fecha).toLocaleDateString(), 50, y)
        doc.text(pago.metodo, 150, y)
        doc.text(pago.referencia || "-", 250, y)
        doc.text(pago.estado, 350, y)
        doc.text(pago.monto.toFixed(2), 460, y)
        y += 20
      })

      // Calcular total pagado
      const totalPagado = factura.pagos
        .filter((pago) => pago.estado === "completado")
        .reduce((sum, pago) => sum + Number.parseFloat(pago.monto), 0)

      // Línea separadora
      doc.moveTo(50, y).lineTo(550, y).stroke()
      y += 20

      // Total pagado
      doc.fontSize(12).text("TOTAL PAGADO:", 350, y)
      doc.text(`${totalPagado.toFixed(2)}`, 460, y)

      // Saldo pendiente
      y += 20
      const saldoPendiente = factura.total - totalPagado
      doc.text("SALDO PENDIENTE:", 350, y)
      doc.text(`${saldoPendiente.toFixed(2)}`, 460, y)
    }

    // Pie de página
    doc.fontSize(10).text("Gracias por su preferencia", 50, 700, { align: "center" })

    doc.end()

    // Esperar a que termine de escribir el archivo
    stream.on("finish", () => {
      // Enviar el archivo como respuesta
      res.download(pdfPath, `factura-${factura.numero}.pdf`, (err) => {
        if (err) {
          console.error("Error al enviar el PDF:", err)
          return res.status(500).json({ mensaje: "Error al generar el PDF", error: err.message })
        }

        // Opcional: eliminar el archivo después de enviarlo
        fs.unlinkSync(pdfPath)
      })
    })
  } catch (error) {
    console.error("Error al generar PDF de factura:", error)
    res.status(500).json({ mensaje: "Error al generar el PDF de la factura", error: error.message })
  }
}

