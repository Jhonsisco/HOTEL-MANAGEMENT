// database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT || 'mysql',
  dialectOptions: {
    charset: 'utf8mb4',
  },
  logging: false,
});

sequelize
  .authenticate()
  .then(() => console.log('✅ Conectado a la base de datos'))
  .catch(err => console.error('❌ Error al conectar la base de datos:', err));

module.exports = sequelize;
