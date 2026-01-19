const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const { Pool } = require('pg');
const { Resend } = require('resend');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_EMAIL = 'rayane.safollahi@gmail.com';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Email template for customer
function getCustomerEmailHTML(orderData) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .order-id { background: #f0f0f0; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
        .order-id span { font-size: 18px; font-weight: bold; color: #6366f1; }
        .section { margin-bottom: 25px; }
        .section h3 { color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .row:last-child { border-bottom: none; }
        .total { background: #6366f1; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 20px; margin-top: 20px; }
        .footer { background: #333; color: #999; padding: 20px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Merci pour votre commande !</h1>
        </div>
        <div class="content">
          <p>Bonjour ${orderData.customerName},</p>
          <p>Votre paiement a bien été reçu et votre commande est en cours de traitement.</p>

          <div class="order-id">
            Commande n° <span>${orderData.orderId.slice(-8).toUpperCase()}</span>
          </div>

          <div class="section">
            <h3>Détails de l'impression</h3>
            <div class="row"><span>Technologie</span><span>${orderData.technology}</span></div>
            <div class="row"><span>Matériau</span><span>${orderData.material}</span></div>
            <div class="row"><span>Qualité</span><span>${orderData.quality}</span></div>
            <div class="row"><span>Volume</span><span>${orderData.volume} cm³</span></div>
          </div>

          <div class="section">
            <h3>Livraison</h3>
            <div class="row"><span>Mode</span><span>${orderData.deliveryType} (${orderData.deliveryDelay})</span></div>
            <div class="row"><span>Adresse</span><span>${orderData.customerAddress}, ${orderData.customerPostalCode} ${orderData.customerCity}</span></div>
          </div>

          <div class="total">
            Total payé : ${orderData.totalPrice} €
          </div>

          <p style="margin-top: 30px; color: #666;">
            Nous vous tiendrons informé de l'avancement de votre commande par email.
          </p>
        </div>
        <div class="footer">
          3D Print App - Impression 3D professionnelle
        </div>
      </div>
    </body>
    </html>
  `;
}

// Email template for admin
function getAdminEmailHTML(orderData) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #1a1a2e; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #16213e; border-radius: 10px; overflow: hidden; color: #fff; }
        .header { background: #e94560; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; }
        .content { padding: 25px; }
        .section { background: #1a1a2e; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
        .section h3 { color: #e94560; margin-top: 0; font-size: 14px; text-transform: uppercase; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
        .label { color: #888; }
        .value { color: #fff; font-weight: bold; }
        .total { background: #e94560; padding: 15px; border-radius: 8px; text-align: center; font-size: 22px; font-weight: bold; }
        .action { background: #0f3460; border: 2px solid #e94560; padding: 15px; border-radius: 8px; text-align: center; margin-top: 20px; }
        .action a { color: #e94560; text-decoration: none; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>NOUVELLE COMMANDE</h1>
        </div>
        <div class="content">
          <div class="section">
            <h3>Client</h3>
            <div class="row"><span class="label">Nom</span><span class="value">${orderData.customerName}</span></div>
            <div class="row"><span class="label">Email</span><span class="value">${orderData.customerEmail}</span></div>
            <div class="row"><span class="label">Téléphone</span><span class="value">${orderData.customerPhone}</span></div>
            <div class="row"><span class="label">Adresse</span><span class="value">${orderData.customerAddress}</span></div>
            <div class="row"><span class="label">Ville</span><span class="value">${orderData.customerPostalCode} ${orderData.customerCity}</span></div>
          </div>

          <div class="section">
            <h3>Impression</h3>
            <div class="row"><span class="label">Technologie</span><span class="value">${orderData.technology}</span></div>
            <div class="row"><span class="label">Matériau</span><span class="value">${orderData.material}</span></div>
            <div class="row"><span class="label">Qualité</span><span class="value">${orderData.quality}</span></div>
            <div class="row"><span class="label">Volume</span><span class="value">${orderData.volume} cm³</span></div>
            <div class="row"><span class="label">Finition</span><span class="value">${orderData.postProcessing ? 'Oui (ponçage + apprêt)' : 'Non'}</span></div>
          </div>

          <div class="section">
            <h3>Livraison</h3>
            <div class="row"><span class="label">Mode</span><span class="value">${orderData.deliveryType}</span></div>
            <div class="row"><span class="label">Délai</span><span class="value">${orderData.deliveryDelay}</span></div>
          </div>

          <div class="section">
            <h3>Prix</h3>
            <div class="row"><span class="label">Impression</span><span class="value">${orderData.printPrice} €</span></div>
            <div class="row"><span class="label">Finition</span><span class="value">${orderData.finishingPrice} €</span></div>
            <div class="row"><span class="label">Livraison extra</span><span class="value">${orderData.deliveryExtra} €</span></div>
          </div>

          <div class="total">
            TOTAL : ${orderData.totalPrice} €
          </div>

          <div class="action">
            ID Commande: ${orderData.orderId}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send order emails
async function sendOrderEmails(orderData) {
  try {
    // Email to customer
    await resend.emails.send({
      from: '3D Print App <onboarding@resend.dev>',
      to: orderData.customerEmail,
      subject: `Confirmation de commande - ${orderData.orderId.slice(-8).toUpperCase()}`,
      html: getCustomerEmailHTML(orderData)
    });
    console.log('Customer email sent to:', orderData.customerEmail);

    // Email to admin
    await resend.emails.send({
      from: '3D Print App <onboarding@resend.dev>',
      to: ADMIN_EMAIL,
      subject: `Nouvelle commande - ${orderData.customerName} - ${orderData.totalPrice}€`,
      html: getAdminEmailHTML(orderData)
    });
    console.log('Admin email sent to:', ADMIN_EMAIL);

    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

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

    // Send confirmation emails
    const emailData = {
      orderId,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerCity: customer.city,
      customerPostalCode: customer.postalCode,
      technology: order.technology,
      material: order.material?.name,
      quality: order.quality?.name,
      volume: order.volume?.toFixed(2),
      postProcessing: order.postProcessing || false,
      deliveryType: order.delivery?.name,
      deliveryDelay: order.delivery?.delay,
      printPrice: order.prices?.printPrice?.toFixed(2),
      finishingPrice: (order.prices?.finishingPrice || 0).toFixed(2),
      deliveryExtra: (order.prices?.deliveryExtra || 0).toFixed(2),
      totalPrice: order.prices?.totalPrice?.toFixed(2)
    };

    // Send emails in background (don't wait)
    sendOrderEmails(emailData);

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
