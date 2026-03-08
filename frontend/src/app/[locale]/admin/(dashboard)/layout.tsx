import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute>
            <AdminLayout>
                {children}
            </AdminLayout>
        </ProtectedRoute>
    );
}
