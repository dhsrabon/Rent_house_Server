const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

// 🔴 লুকানো স্পেস বা ক্যারেক্টার ক্লিন করার জন্য (আগের Invalid Character এরর এড়াতে)
const cleanStripeKey = process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.replace(/['"]/g, '').trim() : '';
const stripe = Stripe(cleanStripeKey);

const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');

// ১. চেকআউট সেশন তৈরি করার রাউট
router.post('/create-checkout-session', async (req, res) => {
    console.log("👉 Checkout Session API Hit!");
    try {
        // ফ্রন্টএন্ড ফর্ম থেকে আসা সব ডেটা রিসিভ করা হলো
        const { propertyId, propertyTitle, amount, tenantId, ownerId, moveInDate, contactNumber, notes } = req.body;

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
            // 🔴 Stripe Metadata তে অবশ্যই String পাঠাতে হবে
            metadata: { 
                propertyId: String(propertyId), 
                tenantId: String(tenantId), 
                ownerId: String(ownerId), 
                amount: String(amount),
                moveInDate: String(moveInDate),
                contactNumber: String(contactNumber),
                notes: notes ? String(notes) : "No extra notes"
            },
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

// ২. ওয়েবহুক রাউট
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
        
  
        const { propertyId, tenantId, ownerId, amount, moveInDate, contactNumber, notes } = session.metadata;

        try {
            // ১. প্রথমে বুকিং রেকর্ড তৈরি করা (অ্যাসাইনমেন্টের নিয়ম অনুযায়ী)
            const newBooking = new Booking({
                propertyId,
                tenantId,
                ownerId,
                moveInDate,
                contactNumber,
                notes,
                status: 'pending' // Owner পরে ড্যাশবোর্ড থেকে অ্যাপ্রুভ করবে
            });
            await newBooking.save();
            console.log("✅ Booking successfully saved to DB!");

            // ২. এরপর ট্রানজ্যাকশন সেভ করা (বুকিং আইডিসহ)
            const newTransaction = new Transaction({
                bookingId: newBooking._id, // বুকিংয়ের রেফারেন্স আইডি
                transactionId: session.payment_intent || session.id,
                tenantId,
                amount: Number(amount),
                date: new Date()
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