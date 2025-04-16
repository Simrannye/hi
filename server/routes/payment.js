const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/stripe/create-checkout-session', async (req, res) => {
  const { cartItems } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: cartItems.map(item => ({
        price_data: {
          currency: 'usd', // or "npr" if supported
          product_data: {
            name: item.name,
          },
          unit_amount: item.price * 100, // in cents
        },
        quantity: item.quantity,
      })),
      success_url: 'http://localhost:3000/payment-success',
      cancel_url: 'http://localhost:3000/checkout',
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Stripe Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});
