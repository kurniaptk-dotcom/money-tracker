import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ResetPasswordConfirmPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  // This page handles the password reset confirmation
  // The actual password update form would be a client component
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
      <p className="text-muted-foreground">
        Silakan cek email Anda untuk link reset password.
      </p>
    </div>
  );
}
