import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { createUser, updateUser, deleteUser } from "@/lib/services/user";

const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

interface ClerkEventData {
  id: string;
  email_addresses?: { email_address: string }[];
  first_name?: string;
  last_name?: string;
}

interface ClerkEvent {
  type: "user.created" | "user.updated" | "user.deleted";
  data: ClerkEventData;
}

async function verifyWebhook(
  req: Request
): Promise<{ verified: boolean; event: ClerkEvent | null }> {
  if (!CLERK_WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return { verified: false, event: null };
  }

  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return { verified: false, event: null };
  }

  const body = await req.text();

  let event: ClerkEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch {
    return { verified: false, event: null };
  }

  return { verified: true, event };
}

export async function POST(req: Request) {
  const { verified, event } = await verifyWebhook(req);

  if (!verified || !event) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "user.created": {
        const primaryEmail = event.data.email_addresses?.[0]?.email_address;
        if (!primaryEmail) {
          return NextResponse.json({ error: "No email found" }, { status: 400 });
        }

        const name = [event.data.first_name, event.data.last_name]
          .filter(Boolean)
          .join(" ") || undefined;

        await createUser({
          clerkId: event.data.id,
          email: primaryEmail,
          name,
        });

        break;
      }

      case "user.updated": {
        const primaryEmail = event.data.email_addresses?.[0]?.email_address;
        const name = [event.data.first_name, event.data.last_name]
          .filter(Boolean)
          .join(" ") || undefined;

        await updateUser(event.data.id, {
          email: primaryEmail,
          name,
        });

        break;
      }

      case "user.deleted": {
        await deleteUser(event.data.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
