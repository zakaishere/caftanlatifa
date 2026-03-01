import { PublicService } from './src/services/public.service.js';

async function run() {
  try {
    const order = await PublicService.createOrder({
      customerName: "Test Customer",
      email: "onboarding@resend.dev",
      phone: "0600000000",
      city: "Casablanca",
      address: "123 Test St",
      items: [{ productId: "715bcdcb-c355-413a-be22-daa302ac2973", quantity: 1, name: "Test Product", price: 10000 }]
    } as any);
    console.log(order);
  } catch(e) {
    console.error("ERROR:", e);
  }
}
run();
