import StoreLayout from "@/components/layout/StoreLayout";

export default function StoreLayoutBoundary({ children }: { children: React.ReactNode }) {
    return (
        <StoreLayout>
            {children}
        </StoreLayout>
    );
}
