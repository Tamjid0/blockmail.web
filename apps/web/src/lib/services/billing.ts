import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/constants";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
  typescript: true,
});

/**
 * Get or create a Stripe customer for a user.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Create a Stripe Checkout session for upgrading to PRO.
 */
export async function createCheckoutSession(
  userId: string,
  email: string,
  origin: string
): Promise<Stripe.Checkout.Session> {
  const customerId = await getOrCreateStripeCustomer(userId, email);
  const priceId = PLAN_LIMITS.PRO.stripePriceId;

  if (!priceId) {
    throw new Error("PRO plan Stripe price ID is not configured. Set STRIPE_PRO_PRICE_ID.");
  }

  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?upgraded=true`,
    cancel_url: `${origin}/dashboard/settings`,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
  });
}

/**
 * Create a Stripe Customer Portal session for managing subscription.
 */
export async function createPortalSession(
  userId: string,
  origin: string
): Promise<Stripe.BillingPortal.Session> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeCustomerId) {
    throw new Error("No Stripe customer found. Upgrade to PRO first.");
  }

  return stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/dashboard/settings`,
  });
}

/**
 * Handle Stripe webhook event: update user plan in DB.
 */
export async function handleStripeWebhook(
  event: Stripe.Event
): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "PRO",
            stripeSubscriptionId: session.subscription as string,
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (!userId) break;

      const isActive =
        subscription.status === "active" ||
        subscription.status === "trialing";

      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: isActive ? "PRO" : "FREE",
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { plan: "FREE", stripeSubscriptionId: null },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: "FREE" },
        });
      }
      break;
    }
  }
}
