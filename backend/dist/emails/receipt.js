import { Resend } from 'resend';
import { env } from '../config/env.js';
const resend = new Resend(env.RESEND_API_KEY);
// A simple formatter for purely displaying prices
const centsToMad = (cents) => (cents / 100).toFixed(0);
export async function sendOrderReceipt(order) {
    if (!env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY missing. Skipping email receipt for order:', order.id);
        return;
    }
    if (!order.email) {
        return; // User didn't provide an email
    }
    const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eaeaea;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eaeaea; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eaeaea; text-align: right;">${centsToMad(item.price * item.quantity)} MAD</td>
    </tr>
  `).join('');
    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h1 style="color: #059669; text-align: center;">Order Confirmed!</h1>
      <p>Hi ${order.customerName},</p>
      <p>Thank you for shopping with AtlasStore. We've received your order and are getting it ready for delivery.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Details</h3>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Payment Method:</strong> Cash on Delivery (COD)</p>
        <p><strong>Delivery Address:</strong><br/>${order.address}<br/>${order.city}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 12px; text-align: left;">Item</th>
            <th style="padding: 12px; text-align: center;">Qty</th>
            <th style="padding: 12px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold;">Subtotal:</td>
            <td style="padding: 12px; text-align: right;">${centsToMad(order.total - order.deliveryFee)} MAD</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 12px; text-align: right; color: #666;">Delivery Fee:</td>
            <td style="padding: 12px; text-align: right; color: #666;">${order.deliveryFee === 0 ? 'Free' : `${centsToMad(order.deliveryFee)} MAD`}</td>
          </tr>
          <tr style="font-size: 1.1em;">
            <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; color: #059669;">Total to Pay (COD):</td>
            <td style="padding: 12px; text-align: right; font-weight: bold; color: #059669;">${centsToMad(order.total)} MAD</td>
          </tr>
        </tfoot>
      </table>

      <p style="margin-top: 40px; text-align: center; color: #666; font-size: 0.9em;">
        If you have any questions, reply to this email or contact us via WhatsApp.<br/>
        &copy; ${new Date().getFullYear()} AtlasStore
      </p>
    </div>
  `;
    try {
        const { data, error } = await resend.emails.send({
            from: 'AtlasStore <onboarding@resend.dev>', // Resend testing domain
            to: [order.email],
            subject: `Order Confirmation - ${order.id.split('-')[0]}`,
            html,
        });
        if (error) {
            console.error('Resend API Error:', error);
        }
        else {
            console.log('Order receipt email sent successfully:', data?.id);
        }
    }
    catch (err) {
        console.error('Failed to send email receipt:', err);
    }
}
