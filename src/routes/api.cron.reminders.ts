import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import webPush from "web-push";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/cron/reminders")({
  server: {
    handlers: {
      POST: async () => {
        try {
          let debugLog = `cwd: ${process.cwd()}\n`;
          // Always read .env file manually in production Nitro builds to guarantee variables are loaded
          try {
              const fs = await import("fs");
              const path = await import("path");
              const envPath = path.resolve(process.cwd(), ".env");
              debugLog += `envPath: ${envPath}\n`;
              if (fs.existsSync(envPath)) {
                const envFile = fs.readFileSync(envPath, "utf-8");
                let foundKeys = [];
                envFile.split("\n").forEach(line => {
                  const match = line.match(/^([^=]+)=(.*)$/);
                  if (match) {
                    let key = match[1].trim();
                    let val = match[2].trim();
                    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
                    process.env[key] = val;
                    foundKeys.push(key);
                  }
                });
                debugLog += `Parsed keys: ${foundKeys.join(", ")}\n`;
              } else {
                debugLog += `File not found at envPath\n`;
              }
            } catch (e: any) {
              console.error("Failed to read .env file fallback", e);
              debugLog += `Fallback error: ${e.message}\n`;
            }

          // Initialize Web Push inside the handler to prevent startup crashes if env vars are missing
          const vapidPublic = process.env['VITE_VAPID_PUBLIC_KEY'];
          const vapidPrivate = process.env['VAPID_PRIVATE_KEY'];
          
          if (!vapidPublic || !vapidPrivate) {
            debugLog += `Public: ${!!vapidPublic}, Private: ${!!vapidPrivate}\n`;
            return new Response(`Missing VAPID keys\nDebug:\n${debugLog}`, { status: 500 });
          }

          webPush.setVapidDetails(
            process.env.VAPID_SUBJECT || "mailto:admin@sknpop.ai",
            vapidPublic,
            vapidPrivate
          );
          // Initialize Supabase admin client (using service role key to bypass RLS)
          const supabaseUrl = process.env['VITE_SUPABASE_URL'] as string;
          const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] as string;
          
          if (!supabaseUrl || !supabaseServiceKey) {
            console.error("Missing Supabase credentials for cron job");
            return new Response("Missing credentials", { status: 500 });
          }

          const supabase = createClient(supabaseUrl, supabaseServiceKey);

          // Get current time in HH:MM format in India Standard Time (IST)
          // This ensures reminders fire correctly for Indian users regardless of VPS timezone
          const now = new Date();
          const options: Intl.DateTimeFormatOptions = { 
            timeZone: 'Asia/Kolkata', 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          };
          // 'en-GB' format returns HH:MM directly
          let istTime = new Intl.DateTimeFormat('en-GB', options).format(now);
          // Some environments might return "24:xx" instead of "00:xx" for midnight
          if (istTime.startsWith('24:')) istTime = istTime.replace('24:', '00:');
          
          const currentTimeString = `${istTime}:00`;

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
