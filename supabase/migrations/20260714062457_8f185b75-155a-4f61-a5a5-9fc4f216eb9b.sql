
CREATE TYPE public.reminder_category AS ENUM ('routine', 'product', 'lifestyle', 'appointment');
CREATE TYPE public.reminder_repeat AS ENUM ('once', 'daily', 'weekly', 'weekdays', 'weekends', 'custom');
CREATE TYPE public.reminder_log_status AS ENUM ('completed', 'missed', 'snoozed', 'upcoming');

CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category public.reminder_category NOT NULL DEFAULT 'routine',
  name TEXT NOT NULL,
  repeat public.reminder_repeat NOT NULL DEFAULT 'daily',
  repeat_days INTEGER[] NOT NULL DEFAULT '{}',
  time_of_day TIME NOT NULL DEFAULT '08:00',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  notify_minutes_before INTEGER NOT NULL DEFAULT 15,
  note TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reminders" ON public.reminders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reminders" ON public.reminders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reminders" ON public.reminders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own reminders" ON public.reminders FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER reminders_updated_at BEFORE UPDATE ON public.reminders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_reminders_user ON public.reminders(user_id, active);

CREATE TABLE public.reminder_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_id UUID NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  status public.reminder_log_status NOT NULL DEFAULT 'upcoming',
  snoozed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reminder_id, scheduled_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminder_logs TO authenticated;
GRANT ALL ON public.reminder_logs TO service_role;
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reminder logs" ON public.reminder_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reminder logs" ON public.reminder_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reminder logs" ON public.reminder_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own reminder logs" ON public.reminder_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_reminder_logs_user_date ON public.reminder_logs(user_id, scheduled_date);
