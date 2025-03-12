// models/habitacion.js
'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Habitacion extends Model {}
  Habitacion.init(
    {
      numero: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      tipo: { type: DataTypes.STRING, allowNull: false },
      estado: { 
        type: DataTypes.ENUM('disponible', 'ocupada', 'limpieza'), 
        allowNull: false, 
        defaultValue: 'disponible' 
      },
    },
    {
      sequelize,
      modelName: 'Habitacion',
      tableName: 'habitaciones', // Nombre exacto en la BD (todo en minúsculas)
      timestamps: false,
    }
  );
  // Asociación se define en index.js o aquí
  Habitacion.associate = (models) => {
    Habitacion.hasMany(models.Reserva, { foreignKey: 'habitacionId', as: 'reservas' });
  };

  return Habitacion;
};
