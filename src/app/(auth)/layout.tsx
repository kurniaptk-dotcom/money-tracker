import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary">
            MoneyTracker
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            Kelola keuangan Anda dengan mudah
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
