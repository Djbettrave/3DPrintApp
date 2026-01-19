const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Create orders table on startup
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(100) UNIQUE NOT NULL,
        stripe_payment_id VARCHAR(100),
        status VARCHAR(50) DEFAULT 'paid',

        -- Client info
        customer_email VARCHAR(255),
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),
        customer_address TEXT,
        customer_city VARCHAR(100),
        customer_postal_code VARCHAR(20),

        -- Order details
        technology VARCHAR(50),
        material VARCHAR(100),
        quality VARCHAR(100),
        volume DECIMAL(10,2),

        -- Options
        post_processing BOOLEAN DEFAULT false,
        delivery_type VARCHAR(50),
        delivery_delay VARCHAR(50),

        -- Prices
        print_price DECIMAL(10,2),
        finishing_price DECIMAL(10,2),
        delivery_extra DECIMAL(10,2),
        total_price DECIMAL(10,2),

        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

initDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API 3D Print App' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', database: 'connected' });
});

// Create Payment Intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'eur', metadata } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save order after successful payment
app.post('/api/orders', async (req, res) => {
  try {
    const {
      orderId,
      stripePaymentId,
      customer,
      order
    } = req.body;

    const result = await pool.query(
      `INSERT INTO orders (
        order_id, stripe_payment_id,
        customer_email, customer_name, customer_phone,
        customer_address, customer_city, customer_postal_code,
        technology, material, quality, volume,
        post_processing, delivery_type, delivery_delay,
        print_price, finishing_price, delivery_extra, total_price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        orderId,
        stripePaymentId,
        customer.email,
        `${customer.firstName} ${customer.lastName}`,
        customer.phone,
        customer.address,
        customer.city,
        customer.postalCode,
        order.technology,
        order.material?.name,
        order.quality?.name,
        order.volume,
        order.postProcessing || false,
        order.delivery?.name,
        order.delivery?.delay,
        order.prices?.printPrice,
        order.prices?.finishingPrice || 0,
        order.prices?.deliveryExtra || 0,
        order.prices?.totalPrice
      ]
    );

    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Order save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all orders (for admin)
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single order by ID
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await pool.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update order status
app.patch('/api/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE order_id = $2 RETURNING *`,
      [status, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
