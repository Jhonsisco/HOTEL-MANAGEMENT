// models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../database'); // Conexión a la BD

const db = {};

// Cargar dinámicamente todos los modelos (excepto este archivo)
fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.endsWith('.js'))
  .forEach(file => {
    const modelImport = require(path.join(__dirname, file));
    const model = modelImport(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Ejecutar asociaciones definidas en cada modelo
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
