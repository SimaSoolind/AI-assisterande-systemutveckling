import request from "supertest";
import { createApp } from "../src/app";
import { db } from "../src/db";
import { closeDb, resetDb } from "./helpers/db";

const app = createApp();

beforeEach(resetDb);
afterAll(closeDb);

describe("POST /orders", () => {
  it("lägger en beställning med rader", async () => {
    const res = await request(app)
      .post("/orders")
      .set("X-Customer-Id", "3")
      .send({ lines: [{ product: "Musmatta", quantity: 2, unitPrice: 200 }] });
    expect(res.status).toBe(201);
    expect(res.body.customerId).toBe(3);
    expect(res.body.status).toBe("new");
    expect(res.body.lines).toEqual([{ product: "Musmatta", quantity: 2, unitPrice: "200.00" }]);
  });

  it("returnerar 400 utan rader", async () => {
    const res = await request(app).post("/orders").set("X-Customer-Id", "3").send({ lines: [] });
    expect(res.status).toBe(400);
  });

  it("returnerar 400 när antalet inte är positivt", async () => {
    const res = await request(app)
      .post("/orders")
      .set("X-Customer-Id", "3")
      .send({ lines: [{ product: "Musmatta", quantity: 0, unitPrice: 200 }] });
    expect(res.status).toBe(400);
  });

  it("returnerar 401 utan inloggning", async () => {
    const res = await request(app).post("/orders").send({ lines: [] });
    expect(res.status).toBe(401);
  });
});

describe("GET /orders/:id", () => {
  it("returnerar en egen beställning med rader", async () => {
    const res = await request(app).get("/orders/1042").set("X-Customer-Id", "1");
    expect(res.status).toBe(200);
    expect(res.body.lines).toHaveLength(2);
  });

  it("returnerar 403 för en annan kunds beställning", async () => {
    const res = await request(app).get("/orders/1042").set("X-Customer-Id", "2");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("forbidden");
  });

  it("returnerar 404 för en beställning som inte finns", async () => {
    const res = await request(app).get("/orders/9999").set("X-Customer-Id", "1");
    expect(res.status).toBe(404);
  });

  it("returnerar 400 för ett ogiltigt id", async () => {
    const res = await request(app).get("/orders/abc").set("X-Customer-Id", "1");
    expect(res.status).toBe(400);
  });
});

describe("GET /orders/:id/price", () => {
  it("räknar pris med moms via den äldre modulen", async () => {
    const res = await request(app).get("/orders/1042/price").set("X-Customer-Id", "1");
    expect(res.status).toBe(200);
    expect(Number(res.body.total)).toBe(1187.5);
  });
});

describe("POST /orders/:id/cancel", () => {
  it("avbryter en egen beställning som är lagd inom 30 minuter", async () => {
    // Skapa en ny beställning, så den är lagd nyss och har status new
    const created = await request(app)
      .post("/orders")
      .set("X-Customer-Id", "1")
      .send({ lines: [{ product: "Musmatta", quantity: 1, unitPrice: 200 }] });
    const orderId: number = created.body.id;

    // Avbryt beställningen
    const res = await request(app).post(`/orders/${orderId}/cancel`).set("X-Customer-Id", "1");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("cancelled");
  });

  it("returnerar 409 när beställningen är lagd för mer än 30 minuter sedan", async () => {
    // Skapa en ny beställning med status new
    const created = await request(app)
      .post("/orders")
      .set("X-Customer-Id", "1")
      .send({ lines: [{ product: "Musmatta", quantity: 1, unitPrice: 200 }] });
    const orderId: number = created.body.id;

    // Flytta tiden bakåt: beställningen lades för 31 minuter sedan
    await db.query("UPDATE orders SET created_at = now() - interval '31 minutes' WHERE id = $1", [
      orderId,
    ]);

    // Försök avbryta beställningen
    const res = await request(app).post(`/orders/${orderId}/cancel`).set("X-Customer-Id", "1");

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("conflict");

    // Statusen är fortfarande new
    const order = await request(app).get(`/orders/${orderId}`).set("X-Customer-Id", "1");
    expect(order.body.status).toBe("new");
  });

  // Samma test körs två gånger: en gång för varje status
  it.each(["cancelled", "shipped"])(
    "returnerar 409 när beställningen redan har status %s",
    async (status) => {
      // Skapa en ny beställning, lagd nyss
      const created = await request(app)
        .post("/orders")
        .set("X-Customer-Id", "1")
        .send({ lines: [{ product: "Musmatta", quantity: 1, unitPrice: 200 }] });
      const orderId: number = created.body.id;

      // Ge beställningen statusen som testet gäller
      await db.query("UPDATE orders SET status = $1 WHERE id = $2", [status, orderId]);

      // Försök avbryta beställningen
      const res = await request(app).post(`/orders/${orderId}/cancel`).set("X-Customer-Id", "1");

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("conflict");

      // Statusen är oförändrad
      const order = await request(app).get(`/orders/${orderId}`).set("X-Customer-Id", "1");
      expect(order.body.status).toBe(status);
    },
  );

  it("returnerar 403 när beställningen tillhör en annan kund", async () => {
    // Kund 1 skapar en ny beställning
    const created = await request(app)
      .post("/orders")
      .set("X-Customer-Id", "1")
      .send({ lines: [{ product: "Musmatta", quantity: 1, unitPrice: 200 }] });
    const orderId: number = created.body.id;

    // Kund 2 försöker avbryta kund 1:s beställning
    const res = await request(app).post(`/orders/${orderId}/cancel`).set("X-Customer-Id", "2");

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("forbidden");

    // Statusen är fortfarande new
    const order = await request(app).get(`/orders/${orderId}`).set("X-Customer-Id", "1");
    expect(order.body.status).toBe("new");
  });
});
