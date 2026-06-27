const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');

// ১. চেকআউট সেশন তৈরি করা
const createCheckoutSession = async (req, res) => {
    try {
        const { propertyId, propertyTitle, amount, tenantId, ownerId } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: { name: propertyTitle },
                        unit_amount: Math.round(Number(amount) * 100), // সেন্টে কনভার্ট
                    },
                    quantity: 1,
                },
            ],
            // 🔴 মেটাডেটাতে ডেটাগুলো সেভ করে দিচ্ছি, যেন পেমেন্ট শেষে ওয়েবহুকে এগুলো পাওয়া যায়
            metadata: {
                propertyId,
                tenantId,
                ownerId,
                amount
            },
            success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/cancel`,
        });

        res.status(200).json({ id: session.id, url: session.url });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ২. ওয়েবহুক হ্যান্ডলার (সফল পেমেন্টের পর ডেটাবেজে বুকিং সেভ করবে)
const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // ওয়েবহুক ভেরিফাই করা হচ্ছে
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // পেমেন্ট সফল হলে এই ইভেন্টটি ফায়ার হবে
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // মেটাডেটা থেকে বুকিংয়ের ইনফরমেশন বের করা
        const { propertyId, tenantId, ownerId, amount } = session.metadata;

        try {
            // ডেটাবেজে নতুন বুকিং/ট্রানজেকশন রেকর্ড সেভ করা
            const newBooking = new Booking({
                propertyId,
                tenantId,
                ownerId,
                status: "Approved", 
                paymentStatus: "Paid",
                transactionId: session.payment_intent, // স্ট্রাইপ ট্রানজেকশন আইডি
                amount: Number(amount)
            });

            await newBooking.save();
            console.log("✅ Booking & Transaction successfully saved to DB!");
        } catch (dbError) {
            console.error("Error saving booking to DB:", dbError);
        }
    }

    // স্ট্রাইপকে 200 রেসপন্স পাঠাতে হবে, নাহলে তারা বারবার রিকোয়েস্ট পাঠাবে
    res.status(200).json({ received: true });
};

module.exports = { createCheckoutSession, stripeWebhook };