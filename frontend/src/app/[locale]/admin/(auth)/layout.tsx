// No ProtectedRoute here — login/register are public admin pages
export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
