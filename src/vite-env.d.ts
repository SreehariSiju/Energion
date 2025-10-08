/// <reference types="vite/client" />

// This tells TypeScript that we are adding a new property to the global Window object
interface Window {
  // We are declaring that a property named 'Razorpay' will exist, 
  // and we can use 'any' as its type to keep it simple.
  Razorpay: any;
}

