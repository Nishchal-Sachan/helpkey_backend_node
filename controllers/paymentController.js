const Razorpay = require("razorpay");
const { db } = require('../utils/db'); // MySQL database connection

// Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    
    // Create a Razorpay order
    const orderOptions = {
      amount: amount * 100, // Amount in paisa
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpayInstance.orders.create(orderOptions);

    if (!order) {
      return res.status(500).json({ message: "Failed to create order" });
    }

    res.status(200).json({
      id: order.id,
      amount: order.amount / 100,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating Razorpay order" });
  }
};

module.exports = {
  createOrder,
};
