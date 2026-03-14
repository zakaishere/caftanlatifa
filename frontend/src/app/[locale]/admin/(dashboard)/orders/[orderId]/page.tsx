import { notFound } from 'next/navigation';
import { OrderDetailView } from '@/features/admin/orders/OrderDetailView';

interface PageProps {
  params: Promise<{ locale: string; orderId: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;

  if (!orderId) notFound();

  return <OrderDetailView orderId={orderId} />;
}
