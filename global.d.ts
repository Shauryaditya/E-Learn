declare global {
    interface Window {
      Razorpay: any; // Declare Razorpay as part of the Window object
    }
  }
  
  export {}; // This ensures the file is treated as a module
  