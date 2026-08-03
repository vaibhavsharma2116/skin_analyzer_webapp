import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listReminders, type ReminderRow } from "@/lib/reminders.functions";
import { supabase } from "@/integrations/supabase/client";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isToday(r: ReminderRow) {
  if (r.repeat === "daily") return true;
  const today = new Date();
  const dow = today.getDay();
  if (r.repeat === "weekdays") return dow >= 1 && dow <= 5;
  if (r.repeat === "weekends") return dow === 0 || dow === 6;
  if (r.repeat === "weekly" || r.repeat === "custom") return r.repeat_days.includes(dow);
  if (r.repeat === "once") return r.start_date === todayISO();
  return false;
}

function addMinutesToTimeStr(timeStr: string, minutes: number): string {
  const [hh, mm] = timeStr.split(":");
  let totalMinutes = parseInt(hh, 10) * 60 + parseInt(mm, 10);
  totalMinutes -= minutes; // We subtract because we notify BEFORE the scheduled time.

  if (totalMinutes < 0) totalMinutes += 24 * 60;
  
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function useRemindersEngine() {
  const fetchList = useServerFn(listReminders);
  const remindersRef = useRef<ReminderRow[]>([]);
  const hasLoadedRef = useRef(false);

  // Load reminders when session is active
  useEffect(() => {
    let active = true;

    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      try {
        const rows = await fetchList();
        if (active) {
          remindersRef.current = (rows as ReminderRow[]).filter((r) => r.active && isToday(r));
          hasLoadedRef.current = true;
        }
      } catch (e) {
        console.error("Failed to load reminders for engine", e);
      }
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        load();
      } else if (event === "SIGNED_OUT") {
        remindersRef.current = [];
        hasLoadedRef.current = false;
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchList]);

  // Periodic checker
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (!hasLoadedRef.current) return;

      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      const currentHHMM = `${currentH.toString().padStart(2, "0")}:${currentM.toString().padStart(2, "0")}`;
      const today = todayISO();

      remindersRef.current.forEach((r) => {
        // Calculate the exact trigger time
        const triggerTime = addMinutesToTimeStr(r.time_of_day, r.notify_minutes_before);
        
        if (triggerTime === currentHHMM) {
          // Check notification settings
          try {
            const raw = localStorage.getItem("skinpop.settings.notifications");
            if (raw) {
              const settings = JSON.parse(raw);
              if (settings.push_all === false || settings.push_reminders === false) {
                return; // User has disabled reminders
              }
            }
          } catch (e) {
            // Ignore parse errors, proceed with notification
          }

          // Check if we've already notified for this today
          const storageKey = `skinpop_notified_${r.id}_${today}`;
          if (!localStorage.getItem(storageKey)) {
            localStorage.setItem(storageKey, "true");
            
            // Trigger in-app Toast
            toast(`Reminder: ${r.name}`, {
              description: `It's time for your ${r.category.toLowerCase()} reminder.`,
              duration: 10000,
              icon: "⏰",
            });

            // Trigger OS Notification if permitted
            if ("Notification" in window && Notification.permission === "granted") {
              try {
                if ("serviceWorker" in navigator) {
                  navigator.serviceWorker.ready.then((registration) => {
                    registration.showNotification(`Reminder: ${r.name}`, {
                      body: `It's time for your ${r.category.toLowerCase()} reminder.`,
                      icon: "/icon-192.png",
                      badge: "/icon-192.png",
                      vibrate: [200, 100, 200],
                      requireInteraction: true,
                      data: { url: "/reminders" },
                    });
                  });
                } else {
                  new Notification(`Reminder: ${r.name}`, {
                    body: `It's time for your ${r.category.toLowerCase()} reminder.`,
                    icon: "/icon-192.png",
                    requireInteraction: true,
                  });
                }
              } catch (e) {
                console.error("Failed to show browser notification", e);
              }
            }
          }
        }
      });
    }, 60000); // Check every minute
    
    // Also perform an immediate check
    const now = new Date();
    // To prevent firing on exact load if they have already been notified, the logic is covered by localStorage,
    // but typically we let the interval handle it unless we need immediate execution.
    
    return () => clearInterval(checkInterval);
  }, []);
}
