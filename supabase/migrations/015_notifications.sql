-- Create notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('budget_alert', 'recurring_reminder', 'debt_due', 'goal_milestone', 'monthly_summary', 'unusual_spending', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_preferences table
CREATE TABLE public.notification_preferences (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  budget_alert_enabled BOOLEAN DEFAULT TRUE,
  budget_alert_threshold NUMERIC(5, 2) DEFAULT 80,
  recurring_reminder_enabled BOOLEAN DEFAULT TRUE,
  debt_due_enabled BOOLEAN DEFAULT TRUE,
  goal_milestone_enabled BOOLEAN DEFAULT TRUE,
  monthly_summary_enabled BOOLEAN DEFAULT TRUE,
  unusual_spending_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for notification_preferences
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
