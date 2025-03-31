
const request = require("supertest");
const app = require("../server");
const db = require("../models");
const jwt = require("jsonwebtoken");

jest.setTimeout(20000);

let token;

beforeAll(async () => {
  try {
    await db.sequelize.sync({ force: true });
    // Crear una habitación de prueba
    await db.Habitacion.create({ id: 1, numero: "101", tipo: "Suite", estado: "disponible" });
    // Crear un token de prueba
    token = jwt.sign({ id: 1, rol: "recepcionista" }, process.env.JWT_SECRET || "secreto", { expiresIn: "1h" });
  } catch (error) {
    console.error("❌ Error en beforeAll:", error);
  }
});

afterAll(async () => {
  await db.sequelize.close();
});

describe("Pruebas para el sistema de reservas", () => {
  test("Debe crear una reserva", async () => {
    const nuevaReserva = {
      habitacionId: 1,
      nombre: "Juan Pérez",
      documento: "12345678",
      fechaEntrada: "2025-04-01",
      fechaSalida: "2025-04-05"
    };

    const response = await request(app)
      .post("/reservas")
      .set("Authorization", `Bearer ${token}`)
      .send(nuevaReserva);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("reserva");
  });

  test("Debe obtener todas las reservas", async () => {
    const response = await request(app)
      .get("/reservas")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
