// ============================================================
// FILE: app/api/webhook/route.js
// PURPOSE: Stripe webhook — updates user plan in Supabase
//          when payment succeeds, handles cancellations,
//          and processes referral credits
//
// SETUP:
// 1. In Stripe Dashboard → Developers → Webhooks → Add endpoint
// 2. URL: https://yourdomain.com/api/webhook
// 3. Events to listen for:
//    - checkout.session.completed
//    - customer.subscription.updated
//    - customer.subscription.deleted
//    - invoice.payment_failed
// 4. Copy the webhook signing secret → add to Vercel env as STRIPE_WEBHOOK_SECRET
// ============================================================

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Use the service role key here — webhooks run server-side, not as a user
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event;

  // 1. Verify the webhook is really from Stripe
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 2. Handle each event type
  try {
    switch (event.type) {

      // ─── CHECKOUT COMPLETED (new subscription or lifetime purchase) ───
      case "checkout.session.completed": {
        const session = event.data.object;
        const email = session.customer_email || session.customer_details?.email;
        const plan = session.metadata?.plan || "pro";
        const customerId = session.customer;

        if (!email) {
          console.error("No email in checkout session");
          break;
        }

        // Map plan codes to database values
        const planMap = {
          pro: "pro",
          pro_annual: "pro",
          business: "business",
          business_annual: "business",
          lifetime: "lifetime",
        };
        const dbPlan = planMap[plan] || "pro";

        // Find user by email and update their plan
        const { data: profile, error: findError } = await supabase
          .from("profiles")
          .select("id, referred_by")
          .eq("email", email)
          .single();

        if (findError || !profile) {
          console.error("Could not find user with email:", email);
          break;
        }

        // Update plan + Stripe customer ID
        await supabase
          .from("profiles")
          .update({
            plan: dbPlan,
            stripe_customer_id: customerId,
          })
          .eq("id", profile.id);

        console.log(`✅ Updated ${email} to ${dbPlan} plan`);

        // ─── REFERRAL CREDIT ───
        // If this user was referred and this is their first paid plan,
        // give the referrer 1 month credit
        if (profile.referred_by) {
          await supabase
            .from("referral_credits")
            .insert({
              referrer_id: profile.referred_by,
              referred_id: profile.id,
              type: "paid_conversion",
            });

          console.log(`🎁 Referral credit for ${profile.referred_by}`);
        }

        break;
      }

      // ─── SUBSCRIPTION UPDATED (plan change, renewal) ───
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const status = subscription.status;

        // If subscription becomes active after being past_due
        if (status === "active") {
          const priceId = subscription.items?.data[0]?.price?.id;

          // Determine plan from price ID
          let plan = "pro"; // default
          if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID ||
              priceId === process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID) {
            plan = "business";
          }

          await supabase
            .from("profiles")
            .update({ plan })
            .eq("stripe_customer_id", customerId);

          console.log(`✅ Subscription active for customer ${customerId}: ${plan}`);
        }

        break;
      }

      // ─── SUBSCRIPTION CANCELLED ───
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Downgrade to free (but don't touch lifetime users)
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile && profile.plan !== "lifetime") {
          await supabase
            .from("profiles")
            .update({ plan: "free" })
            .eq("stripe_customer_id", customerId);

          console.log(`⬇️ Downgraded customer ${customerId} to free`);
        }

        break;
      }

      // ─── PAYMENT FAILED ───
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        // Log it — Stripe handles retry automatically
        // You could send an email here via Loops/Resend
        console.log(`⚠️ Payment failed for customer ${customerId}`);

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
