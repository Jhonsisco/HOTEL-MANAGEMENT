
module.exports = (sequelize, DataTypes) => {
    const Pago = sequelize.define(
      "Pago",
      {
        monto: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        fecha: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        metodo: {
          type: DataTypes.ENUM("efectivo", "tarjeta", "transferencia"),
          allowNull: false,
        },
        referencia: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: "Número de referencia para pagos con tarjeta o transferencia",
        },
        estado: {
          type: DataTypes.ENUM("completado", "pendiente", "reembolsado"),
          defaultValue: "completado",
        },
        facturaId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      },
      {
        tableName: "pagos",
        timestamps: true,
      },
    )
  
    return Pago
  }
  
  