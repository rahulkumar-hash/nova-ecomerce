import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: "NovaStore" },
    tagline: { type: String, default: "Your Ultimate Multi-Category Destination" },
    logo: { type: String, default: "" },
    favicon: { type: String, default: "" },

    theme: {
      primaryColor: { type: String, default: "#6366f1" }, // Indigo
      primaryHover: { type: String, default: "#4f46e5" },
      primaryLight: { type: String, default: "#e0e7ff" },
      secondaryColor: { type: String, default: "#06b6d4" },
      accentColor: { type: String, default: "#f59e0b" },
      preset: { type: String, default: "indigo" },
      fontFamily: { type: String, default: "Inter, sans-serif" },
      borderRadius: { type: String, default: "rounded-xl" },
    },

    announcementBar: {
      enabled: { type: Boolean, default: true },
      text: { type: String, default: "⚡ Special Launch Offer: Get Flat 15% OFF on first order! Code: WELCOME15" },
      link: { type: String, default: "/shop" },
      bgColor: { type: String, default: "#4338ca" },
      textColor: { type: String, default: "#ffffff" },
    },

    currency: {
      symbol: { type: String, default: "₹" },
      code: { type: String, default: "INR" },
    },

    shipping: {
      freeShippingThreshold: { type: Number, default: 999 },
      standardShippingFee: { type: Number, default: 49 },
      expressShippingFee: { type: Number, default: 119 },
    },

    tax: {
      taxPercentage: { type: Number, default: 5 }, // 5% GST
      taxIncludedInPrice: { type: Boolean, default: false },
    },

    contact: {
      email: { type: String, default: "support@novastore.com" },
      phone: { type: String, default: "+91 98765 43210" },
      address: { type: String, default: "101, Innovation Square, Cyber City, Bangalore, India" },
    },

    warehouse: {
      name: { type: String, default: "Primary Fulfillment Warehouse" },
      address: { type: String, default: "101, Tech Avenue, Silicon City, Bangalore, India" },
      gstin: { type: String, default: "29AABCN8592M1ZK" },
      pan: { type: String, default: "AABCN8592M" },
      stateCode: { type: String, default: "29 (Karnataka)" },
    },

    bankDetails: {
      bankName: { type: String, default: "HDFC Bank Ltd" },
      accountNumber: { type: String, default: "5020008892182" },
      ifscCode: { type: String, default: "HDFC0000240" },
      branchName: { type: String, default: "Cyber City Branch" },
      upiId: { type: String, default: "pay.novastore@hdfcbank" },
    },

    socialLinks: {
      instagram: { type: String, default: "https://instagram.com" },
      facebook: { type: String, default: "https://facebook.com" },
      twitter: { type: String, default: "https://twitter.com" },
      youtube: { type: String, default: "https://youtube.com" },
    },

    features: {
      enableReviews: { type: Boolean, default: true },
      enableWishlist: { type: Boolean, default: true },
      enableCoupons: { type: Boolean, default: true },
      guestCheckout: { type: Boolean, default: true },
    },

    paymentMethods: {
      cod: {
        enabled: { type: Boolean, default: true },
        label: { type: String, default: "Cash on Delivery" },
        description: { type: String, default: "Pay with cash or UPI upon delivery at your doorstep." },
      },
      razorpay: {
        enabled: { type: Boolean, default: true },
        keyId: { type: String, default: "rzp_test_singlevendor" },
        keySecret: { type: String, default: "" },
        label: { type: String, default: "Online Payment (Razorpay)" },
        description: { type: String, default: "Pay securely via UPI, Cards, NetBanking & Wallets." },
      },
    },

    cloudinary: {
      cloudName: { type: String, default: "" },
      apiKey: { type: String, default: "" },
      apiSecret: { type: String, default: "" },
    },

    smtp: {
      host: { type: String, default: "smtp.gmail.com" },
      port: { type: Number, default: 587 },
      user: { type: String, default: "" },
      pass: { type: String, default: "" },
      fromName: { type: String, default: "NovaStore" },
      fromEmail: { type: String, default: "" },
      secure: { type: Boolean, default: false },
    },

    deliveryGateways: {
      activeProvider: {
        type: String,
        enum: ["manual", "shiprocket", "delhivery", "nimbuspost", "bluedart"],
        default: "manual",
      },
      shiprocket: {
        enabled: { type: Boolean, default: false },
        email: { type: String, default: "" },
        password: { type: String, default: "" },
        token: { type: String, default: "" },
        pickupPincode: { type: String, default: "560100" },
        isSandbox: { type: Boolean, default: true },
      },
      delhivery: {
        enabled: { type: Boolean, default: false },
        apiKey: { type: String, default: "" },
        clientName: { type: String, default: "" },
        pickupLocation: { type: String, default: "Primary Warehouse" },
        isSandbox: { type: Boolean, default: true },
      },
      nimbuspost: {
        enabled: { type: Boolean, default: false },
        email: { type: String, default: "" },
        password: { type: String, default: "" },
        token: { type: String, default: "" },
        isSandbox: { type: Boolean, default: true },
      },
      bluedart: {
        enabled: { type: Boolean, default: false },
        loginId: { type: String, default: "" },
        licenseKey: { type: String, default: "" },
        customerCode: { type: String, default: "" },
        isSandbox: { type: Boolean, default: true },
      },
    },
  },
  { timestamps: true }
);

export const Setting = mongoose.model("Setting", settingSchema);

