const config = {
    publicKey: "test_public_key_dcec1502b6f84988b3a615906eed8e4f", 
    productIdentity: "1234567890",
    productName: "Fresh Groceries",
    productUrl: "http://localhost:3000/checkout", 
    eventHandler: {
      onSuccess(payload) {
        console.log("Payment Successful", payload);
        alert("Payment Successful! Your order is confirmed.");
      },
      onError(error) {
        console.error("Khalti Payment Error:", error);
        alert(`Payment Failed! ${error?.message || "Something went wrong."}`);
      },
      onClose() {
        console.log("Khalti Checkout Closed");
      },
    },
    paymentPreference: ["KHALTI"],
};

export default config;
