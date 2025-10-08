import Razorpay from "razorpay";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // This version takes amount, userId, and planKwh from the body
    const { amount, userId, planKwh } = req.body;

    const razorpay = new Razorpay({
      key_id: process.env.VITE_RAZORPAY_KEY_ID, // Note: This also had the VITE_ prefix issue
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // --- THE PROBLEM WAS HERE ---
    // This receipt ID is too long for Razorpay and causes a 'BAD_REQUEST_ERROR'.
    const receiptId = `${userId}`;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: receiptId, // Using the long receipt ID
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).send("Error creating order");
    }

    res.status(200).json(order);
  } catch (error) {
    // This is where the error from Razorpay would be caught
    // and logged, resulting in the "Internal Server Error"
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
