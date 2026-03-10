// Root admin layout - just a pass-through.
// Unauthenticated pages (login/register) live in admin/(auth)/
// Authenticated pages live in admin/(dashboard)/ which applies ProtectedRoute.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
