const request = require('supertest');
const app = require('../server');
const db = require('../models'); // Importar modelos
const { Habitacion, Reserva } = db; // Extraer modelos

beforeAll(async () => {
    await db.sequelize.sync({ force: true }); // Borra y recrea la BD

    // Crear habitación de prueba
    await Habitacion.create({ numero: 101, tipo: 'Suite', estado: 'disponible' });
});

describe('Pruebas para el sistema de reservas', () => {
    test('Debe crear una reserva', async () => {
        const response = await request(app)
            .post('/reservas')
            .send({
                nombre: 'Juan Pérez',
                documento: '12345678',
                habitacionId: 1,
                fechaEntrada: '2025-03-15',
                fechaSalida: '2025-03-20'
            });

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('reserva');
    });

    test('Debe obtener todas las reservas', async () => {
        const response = await request(app).get('/reservas');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });
});

afterAll(async () => {
    await db.sequelize.close(); // Cierra la conexión al finalizar las pruebas
});
