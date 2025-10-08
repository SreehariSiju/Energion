import Razorpay from "razorpay";
import { nanoid } from 'nanoid'; // Import the nanoid library

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { amount } = req.body;

    // Initialize Razorpay client with keys from environment variables
    const razorpay = new Razorpay({
      // --- THE FIX IS HERE ---
      // Use a regular backend environment variable (no VITE_ prefix)
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Generate a short, unique ID (e.g., 'Uakgb_J5m9g-0JDM')
    const shortId = nanoid(14);
    const receiptId = `rcpt_${shortId}`;

    const options = {
      amount: amount * 100, // Amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: receiptId,
    };

    // Create the order on Razorpay's servers
    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ message: "Error creating order" });
    }

    // Send the created order details back to the client
    res.status(200).json(order);

  } catch (error) {
    // Log the detailed error on the server for debugging
    console.error("Error creating Razorpay order:", error);
    // Send a generic error message to the client
    res.status(500).json({ message: "Internal Server Error" });
  }
}


