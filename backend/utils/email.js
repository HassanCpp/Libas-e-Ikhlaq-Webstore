const nodemailer = require('nodemailer');

const sendConfirmationEmail = async (order) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
            port: process.env.SMTP_PORT || 2525,
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || ''
            }
        });

        const isCredentialsConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;
        
        const mailOptions = {
            from: '"Libas-e-Ikhlaq Store" <noreply@libaseikhlaq.com>',
            to: order.shippingAddress.phone + '@mail.com', // mock client email mapping
            subject: `Order Confirmation - #${order._id}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
                    <h2 style="color: #111; text-align: center;">LIBAS-E-IKHLAQ</h2>
                    <h3 style="color: #2e7d32;">Thank you for your order, ${order.shippingAddress.fullName}!</h3>
                    <p>We are processing your order reference: <strong>#${order._id}</strong></p>
                    <hr style="border: 0; border-top: 1px solid #eee;" />
                    <h4>Delivery Details:</h4>
                    <p>
                        ${order.shippingAddress.addressLine}<br>
                        ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}<br>
                        Phone: ${order.shippingAddress.phone}
                    </p>
                    <hr style="border: 0; border-top: 1px solid #eee;" />
                    <h4>Order Summary:</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f5f5f5;">
                                <th style="padding: 8px; text-align: left;">Item</th>
                                <th style="padding: 8px; text-align: center;">Qty</th>
                                <th style="padding: 8px; text-align: right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
                                    <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
                                    <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">PKR ${item.price.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <h3 style="text-align: right; color: #d32f2f;">Total Paid: PKR ${order.totalAmount.toLocaleString()}</h3>
                    <p style="font-size: 12px; color: #777; text-align: center; margin-top: 30px;">
                        This is an automated invoice. Thank you for shopping with Libas-e-Ikhlaq.
                    </p>
                </div>
            `
        };

        if (isCredentialsConfigured) {
            await transporter.sendMail(mailOptions);
            console.log(`✅ Transactional invoice email dispatched for order: ${order._id}`);
        } else {
            console.log('✉️ [SMTP Settings Empty] Email simulation logs:\n', mailOptions.html);
        }
    } catch (err) {
        console.error('❌ Failed to dispatch transactional email:', err);
    }
};

module.exports = { sendConfirmationEmail };
