import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center">
            <Image src="/logo_normal.png" alt="ArtisanBF" width={80} height={80} className="h-20 w-20 object-contain" priority />
          </Link>
          <p className="text-sm text-stone-500 mt-2">
            L&apos;annuaire des artisans du Burkina Faso
          </p>
        </div>
        <div className="bg-white rounded-lg border border-stone-200 p-8">{children}</div>
      </div>
    </div>
  );
}
