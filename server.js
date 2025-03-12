// server.js
const express = require('express');
const app = express();
const db = require('./models'); // Contiene Habitacion, Reserva, etc.
const reservasRoutes = require('./routes/reservas.routes');

app.use(express.json());
app.use('/reservas', reservasRoutes);

const PORT = process.env.PORT || 3000;

db.sequelize.sync({ force: process.env.NODE_ENV === 'test' ? true : false })
  .then(() => {
    console.log('✅ Base de datos sincronizada');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error('❌ Error al sincronizar la base de datos:', error);
  });

module.exports = app;
