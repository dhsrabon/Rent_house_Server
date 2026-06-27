const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');

// ১. চেকআউট সেশন তৈরি করার রাউট
router.post('/create-checkout-session', async (req, res) => {
    console.log("👉 Checkout Session API Hit!"); // টার্মিনালে চেক করার জন্য
    try {
        const { propertyId, propertyTitle, amount, tenantId, ownerId } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: { name: propertyTitle || "Property Booking" },
                        unit_amount: Math.round(Number(amount) * 100),
                    },
                    quantity: 1,
                },
            ],
            metadata: { propertyId, tenantId, ownerId, amount },
            success_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/cancel`,
        });

        console.log("✅ Stripe Session Created:", session.id);
        res.status(200).json({ id: session.id, url: session.url });
    } catch (error) {
        console.error("❌ Stripe Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ২. ওয়েবহুক রাউট
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error("❌ Webhook Error:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { propertyId, tenantId, ownerId, amount } = session.metadata;

        try {
            const newTransaction = new Transaction({
                propertyId,
                tenantId,
                ownerId,
                status: "Paid", 
                transactionId: session.payment_intent,
                amount: Number(amount)
            });
            await newTransaction.save();
            console.log("✅ Transaction successfully saved to DB!");
        } catch (dbError) {
            console.error("❌ Error saving to DB:", dbError);
        }
    }

    res.status(200).json({ received: true });
});

module.exports = router;