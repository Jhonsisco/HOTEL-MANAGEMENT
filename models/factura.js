module.exports = (sequelize, DataTypes) => {
    const Factura = sequelize.define(
      "Factura",
      {
        numero: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        fecha: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        total: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        estado: {
          type: DataTypes.ENUM("emitida", "pagada", "anulada"),
          defaultValue: "emitida",
        },
        reservaId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        conceptos: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: "Detalles de los conceptos facturados (alojamiento, servicios adicionales, etc.)",
        },
      },
      {
        tableName: "facturas",
        timestamps: true,
      },
    )
  
    return Factura
  }
  
  