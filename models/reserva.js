'use strict';

module.exports = (sequelize, DataTypes) => {
  const Reserva = sequelize.define(
    "Reserva",
    {
      nombre: { type: DataTypes.STRING, allowNull: true },
      documento: { type: DataTypes.STRING, allowNull: true },
      fechaEntrada: { type: DataTypes.DATE, allowNull: false },
      fechaSalida: { type: DataTypes.DATE, allowNull: false },
      habitacionId: { type: DataTypes.INTEGER, allowNull: false }
    },
    {
      tableName: "reservas",
      timestamps: false,
    }
  );

  return Reserva;
};
