'use strict';

module.exports = (sequelize, DataTypes) => {
  const Habitacion = sequelize.define(
    "Habitacion",
    {
      numero: { type: DataTypes.STRING, allowNull: false, unique: true },
      tipo: { type: DataTypes.STRING, allowNull: false },
      estado: { type: DataTypes.ENUM("disponible", "ocupada", "mantenimiento"), defaultValue: "disponible" }
    },
    {
      tableName: "habitaciones",
      timestamps: false,
    }
  );

  return Habitacion;
};
