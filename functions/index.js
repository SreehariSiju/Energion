const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// IMPORTANT: Set these in your Firebase environment
// Run these commands in your terminal:
// firebase functions:config:set razorpay.key_id="YOUR_KEY_ID"
// firebase functions:config:set razorpay.key_secret="YOUR_KEY_SECRET"
const razorpay = new Razorpay({
  key_id: functions.config().razorpay.key_id,
  key_secret: functions.config().razorpay.key_secret,
});

/**
 * Creates a Razorpay order.
 * Expects { amount: number } in the request body.
 */
exports.createOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { amount } = data;
  if (!amount || typeof amount !== "number" || amount <= 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a valid 'amount'."
    );
  }

  const options = {
    amount: amount * 100, // Amount in paise
    currency: "INR",
    receipt: `receipt_${new Date().getTime()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    throw new functions.https.HttpsError("internal", "Could not create order.");
  }
});

/**
 * Verifies a Razorpay payment and updates the user's balance.
 */
exports.verifyPaymentAndUpdateBalance = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    kwh_to_add,
  } = data;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = crypto
    .createHmac("sha256", functions.config().razorpay.key_secret)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    // Payment is authentic, update the user's balance in Firestore
    const userId = context.auth.uid;
    const userDocRef = db.collection("users").doc(userId);

    try {
      await userDocRef.update({
        prepaidBalance_kWh: admin.firestore.FieldValue.increment(kwh_to_add),
      });
      return { status: "success", kwhAdded: kwh_to_add };
    } catch (error) {
      console.error("Failed to update user balance:", error);
      throw new functions.https.HttpsError("internal", "Database update failed.");
    }
  } else {
    throw new functions.https.HttpsError("permission-denied", "Payment verification failed.");
  }
});
