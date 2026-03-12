// ============================================================
// FILE: app/api/checkout/route.js
// PURPOSE: Creates Stripe Checkout sessions for subscriptions
// SETUP: Add STRIPE_SECRET_KEY + price IDs to Vercel env vars
// ============================================================

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  pro:             process.env.STRIPE_PRO_PRICE_ID || "price_REPLACE_ME",
  pro_annual:      process.env.STRIPE_PRO_ANNUAL_PRICE_ID || "price_REPLACE_ME",
  business:        process.env.STRIPE_BUSINESS_PRICE_ID || "price_REPLACE_ME",
  business_annual: process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID || "price_REPLACE_ME",
  lifetime:        process.env.STRIPE_LIFETIME_PRICE_ID || "price_REPLACE_ME",
};

export async function POST(request) {
  try {
    const url = new URL(request.url);
    const planFromQuery = url.searchParams.get("plan");
    const body = await request.json().catch(() => ({}));
    const plan = body.plan || planFromQuery;
    const email = body.email;

    if (plan === "free") {
      return Response.json({ url: null, message: "Free plan — no payment needed" });
    }

    const priceId = PRICE_IDS[plan];
    if (!priceId || priceId === "price_REPLACE_ME") {
      return Response.json({ url: null, message: "Payments not configured yet" });
    }

    // Lifetime is a one-time payment, everything else is subscription
    const isLifetime = plan === "lifetime";

    const session = await stripe.checkout.sessions.create({
      mode: isLifetime ? "payment" : "subscription",
      payment_method_types: ["card"],
      customer_email: email || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com"}?payment=success&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com"}?payment=cancelled`,
      metadata: { plan },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return Response.json({ error: "Could not create checkout session" }, { status: 500 });
  }
}
