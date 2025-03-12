// models/reserva.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  class Reserva extends sequelize.Sequelize.Model {}

  Reserva.init(
    {
      nombre: { type: DataTypes.STRING, allowNull: false },
      documento: { type: DataTypes.STRING, allowNull: false },
      fechaEntrada: { type: DataTypes.DATE, allowNull: false },
      fechaSalida: { type: DataTypes.DATE, allowNull: false },
      // Puedes agregar un campo para notas si lo deseas:
      notas: { type: DataTypes.TEXT, allowNull: true }
    },
    {
      sequelize,
      modelName: 'Reserva',
      tableName: 'reservas', // nombre exacto de la tabla (todo en minúsculas)
      timestamps: false,
    }
  );

  Reserva.associate = (models) => {
    Reserva.belongsTo(models.Habitacion, { foreignKey: 'habitacionId', as: 'habitacion' });
  };

  return Reserva;
};
