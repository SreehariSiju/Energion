// Import the necessary libraries
import crypto from "crypto"; // Used for verifying the payment signature
import admin from "firebase-admin";

// --- Securely Initialize Firebase Admin ---
// This snippet ensures Firebase is initialized on the server.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    });
  } catch (error) {
    console.error("Firebase admin initialization error", error.stack);
  }
}

const db = admin.firestore();

// This is the main serverless function
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planKwh } = req.body;

    // --- Step 1: Verify the Payment Signature ---
    // This is a crucial security step to ensure the request is genuinely from Razorpay.
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    // If the signature is not authentic, it's a fraudulent request.
    if (!isAuthentic) {
      return res.status(400).json({ error: "Invalid payment signature." });
    }

    // --- Step 2: If Signature is Valid, Update Firestore Database ---
    // At this point, we are confident the payment was successful.
    
    // We only update the balance if it's a prepaid plan purchase.
    if (planKwh && planKwh !== "PayAsYouGo") {
        const userDocRef = db.collection("users").doc(userId);

        // Use Firestore's 'FieldValue.increment' to safely add the kWh to the user's balance.
        await userDocRef.update({
            prepaidBalance_kWh: admin.firestore.FieldValue.increment(planKwh),
        });
    }

    // You could also add code here to save the transaction details to another collection for your records.

    // --- Step 3: Send Success Response ---
    res.status(200).json({ success: true, message: "Payment verified and balance updated." });

  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

