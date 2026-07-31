import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import webPush from "web-push";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/cron/reminders")({
  server: {
    handlers: {
      POST: async () => {
        try {
          // Fallback to manually read .env if process.env doesn't have it (common in production Nitro builds)
          if (!process.env.VAPID_PRIVATE_KEY) {
            try {
              const fs = await import("fs");
              const path = await import("path");
              const envFile = fs.readFileSync(path.resolve(process.cwd(), ".env"), "utf-8");
              envFile.split("\n").forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                  // Remove quotes if present
                  let val = match[2].trim();
                  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                  if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
                  process.env[match[1].trim()] = val;
                }
              });
            } catch (e) {
              console.error("Failed to read .env file fallback");
            }
          }

          // Initialize Web Push inside the handler to prevent startup crashes if env vars are missing
          const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
          const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
          
          if (!vapidPublic || !vapidPrivate) {
            console.error("Missing VAPID keys for Push Notifications. Public:", !!vapidPublic, "Private:", !!vapidPrivate);
            return new Response("Missing VAPID keys", { status: 500 });
          }

          webPush.setVapidDetails(
            process.env.VAPID_SUBJECT || "mailto:admin@sknpop.ai",
            vapidPublic,
            vapidPrivate
          );
          // Initialize Supabase admin client (using service role key to bypass RLS)
          const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
          
          if (!supabaseUrl || !supabaseServiceKey) {
            console.error("Missing Supabase credentials for cron job");
            return new Response("Missing credentials", { status: 500 });
          }

          const supabase = createClient(supabaseUrl, supabaseServiceKey);

          // Get current time in HH:MM format (local time approximation or UTC depending on server)
          // Note: Since reminders use a specific time_of_day string, we need to match it.
          // For a global app, timezone handling is needed, but for now we assume the server time matches the user's expected time or we check the current time string.
          const now = new Date();
          const hh = now.getHours().toString().padStart(2, '0');
          const mm = now.getMinutes().toString().padStart(2, '0');
          const currentTimeString = `${hh}:${mm}:00`;

          // 1. Fetch active reminders for the current time
          const { data: dueReminders, error: reminderError } = await supabase
            .from("reminders")
            .select("id, user_id, name, category")
            .eq("active", true)
            .eq("time_of_day", currentTimeString);

          if (reminderError) {
            throw reminderError;
          }

          if (!dueReminders || dueReminders.length === 0) {
            return new Response("No reminders due", { status: 200 });
          }

          // Get unique user IDs
          const userIds = [...new Set(dueReminders.map(r => r.user_id))];

          // 2. Fetch push subscriptions for those users
          const { data: subscriptions, error: subError } = await supabase
            .from("push_subscriptions")
            .select("user_id, endpoint, p256dh, auth")
            .in("user_id", userIds);

          if (subError) {
            throw subError;
          }

          if (!subscriptions || subscriptions.length === 0) {
            return new Response("No subscriptions found", { status: 200 });
          }

          // 3. Send notifications
          const sendPromises = dueReminders.flatMap((reminder) => {
            const userSubs = subscriptions.filter(s => s.user_id === reminder.user_id);
            
            const payload = JSON.stringify({
              title: "SKIN POP Reminder",
              body: `It's time for your ${reminder.name} (${reminder.category})!`,
              data: {
                url: `/reminders/${reminder.id}`
              }
            });

            return userSubs.map(async (sub) => {
              try {
                await webPush.sendNotification(
                  {
                    endpoint: sub.endpoint,
                    keys: {
                      p256dh: sub.p256dh,
                      auth: sub.auth,
                    },
                  },
                  payload
                );
              } catch (error: any) {
                console.error("Error sending push notification to", sub.endpoint, error);
                if (error.statusCode === 404 || error.statusCode === 410) {
                  // Subscription has expired or is no longer valid, delete it
                  await supabase
                    .from("push_subscriptions")
                    .delete()
                    .eq("endpoint", sub.endpoint);
                }
              }
            });
          });

          await Promise.allSettled(sendPromises);

          return new Response("Notifications sent", { status: 200 });
        } catch (error: any) {
          console.error("Cron job error:", error);
          return new Response(error.message || "Internal Server Error", { status: 500 });
        }
      },
    },
  },
});
