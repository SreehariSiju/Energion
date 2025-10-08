// Import the necessary libraries
import Razorpay from "razorpay";
import admin from "firebase-admin";

// --- Securely Initialize Firebase Admin ---
// This snippet securely initializes Firebase on the server.
// It checks if the app is already initialized to prevent errors.
// It reads the FIREBASE_SERVICE_ACCOUNT credentials from your Vercel environment variables.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    });
  } catch (error) {
    console.error("Firebase admin initialization error", error.stack);
  }
}

// --- Initialize Razorpay ---
// It reads your secret keys from your Vercel environment variables.
const razorpay = new Razorpay({
  key_id: process.env.VITE_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// This is the main serverless function
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { amount, userId, planKwh } = req.body;

    // --- Validation ---
    if (!amount || !userId) {
      return res.status(400).json({ error: "Amount and userId are required." });
    }

    // --- Create Razorpay Order ---
    const options = {
      amount: amount * 100, // Amount in the smallest currency unit (e.g., paisa for INR)
      currency: "INR",
      receipt: `receipt_${userId}_${Date.now()}`, // Create a unique receipt ID
      notes: {
        userId,
        planKwh: planKwh || "PayAsYouGo", // Add notes for your reference
      }
    };

    const order = await razorpay.orders.create(options);

    // --- Send Response ---
    // Send the created order details back to the frontend app
    res.status(200).json(order);

  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

