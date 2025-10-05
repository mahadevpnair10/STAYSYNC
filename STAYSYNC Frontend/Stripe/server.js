// This is your test secret API key.
const stripe = require('stripe')('sk_test_51SEq78RxN5wH7cr1wdPKiDjR9ZrpNtjInFnHFspnTHyl0XgCXL2RWniZlYSDZwAhmT6myLOcpJ3V9yCl69Dyq7jv00PkOHafaa');
const express = require('express');
const app = express();

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware for local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

const YOUR_DOMAIN = 'http://localhost:8080'; // Updated to match your React app domain

app.get('/create-checkout-session', async (req, res) => {
  try {
    const { amount, currency = 'inr', paymentId } = req.query;
    
    if (!amount || !paymentId) {
      return res.status(400).json({ error: 'Amount and paymentId are required' });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: 'StaySync Hotel Payment',
              description: 'Hotel stay payment via StaySync',
              images: ['https://via.placeholder.com/300x200?text=StaySync+Hotel'],
            },
            unit_amount: parseInt(amount), // Amount should already be in smallest currency unit (paisa for INR)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}&payment_id=${paymentId}`,
      cancel_url: `${YOUR_DOMAIN}/payment-canceled?payment_id=${paymentId}`,
      metadata: {
        paymentId: paymentId
      }
    });

    res.redirect(303, session.url);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Handle POST requests as well for compatibility
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { amount = 2000, currency = 'inr', paymentId } = req.body;

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: 'StaySync Hotel Payment',
              description: 'Hotel stay payment via StaySync',
              images: ['https://via.placeholder.com/300x200?text=StaySync+Hotel'],
            },
            unit_amount: parseInt(amount),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}&payment_id=${paymentId || 'default'}`,
      cancel_url: `${YOUR_DOMAIN}/payment-canceled?payment_id=${paymentId || 'default'}`,
      metadata: {
        paymentId: paymentId || 'default'
      }
    });

    res.redirect(303, session.url);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.listen(4242, () => console.log('Stripe server running on port 4242'));