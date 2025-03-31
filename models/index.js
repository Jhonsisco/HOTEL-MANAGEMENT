'use strict';

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const sequelize = require("../database");

const db = { sequelize };

// Cargar dinámicamente todos los modelos (excepto este archivo)
fs.readdirSync(__dirname)
  .filter(file => file !== "index.js" && file.endsWith(".js"))
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Definir las asociaciones entre modelos
if (db.Habitacion && db.Reserva) {
  db.Reserva.belongsTo(db.Habitacion, { foreignKey: "habitacionId", as: "habitacion" });
  db.Habitacion.hasMany(db.Reserva, { foreignKey: "habitacionId", as: "reservas" });
}

db.Sequelize = Sequelize;
module.exports = db;
