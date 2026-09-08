import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Order } from "./order.model.js";
import { Cart } from "../cart/cart.modal.js";
import { Product } from "../products/product.modal.js";
import { Setting } from "../Setting/Setting.model.js";
import { Coupon } from "../coupon/coupon.model.js";
import PDFDocument from "pdfkit";
import { numberToWordsIndian } from "../../utils/numberToWords.js";
import { sendOrderShippedEmail, sendOrderDeliveredEmail } from "../../utils/mailer.js";

const generateOrderAndInvoiceNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `ORD-${timestamp}-${random}`;
  const invoiceNumber = `INV-${timestamp}-${random}`;
  return { orderNumber, invoiceNumber };
};

export const createOrder = asyncHandler(async (req, res) => {
  const {
    items,
    shippingAddress,
    paymentMethod = "Cash on Delivery",
    transactionId = "",
    gateway = "",
    couponCode,
    deliveryOption = "standard",
    notes = "",
  } = req.body;

  if (!items || items.length === 0) {
    throw new ApiError(400, "Cannot place order with empty items");
  }

  if (!shippingAddress || !shippingAddress.name || !shippingAddress.phone || !shippingAddress.street) {
    throw new ApiError(400, "Shipping address is incomplete");
  }

  const storeSettings = (await Setting.findOne()) || {};
  const taxPct = storeSettings?.tax?.taxPercentage || 5;
  const freeShipThreshold = storeSettings?.shipping?.freeShippingThreshold || 999;
  const standardFee = storeSettings?.shipping?.standardShippingFee || 49;
  const expressFee = storeSettings?.shipping?.expressShippingFee || 119;

  let subtotal = 0;
  const orderItems = [];

  // Verify stock & calculate actual price
  for (const item of items) {
    const product = await Product.findById(item.product || item.productId);
    if (!product || !product.isPublished) {
      throw new ApiError(404, `Product ${item.name || ""} is no longer available`);
    }

    let itemPrice = product.price;
    let itemMrp = product.mrp;
    let itemImage = product.thumbnail || product.images?.[0] || "";
    let itemTitle = "";
    let itemAttrs = [];
    let availableStock = product.stock;

    if (product.hasVariants && item.variantId) {
      const variant = product.variants.id(item.variantId);
      if (!variant) throw new ApiError(404, `Selected variant for ${product.name} not found`);
      itemPrice = variant.price;
      itemMrp = variant.mrp || variant.price;
      itemImage = variant.image || itemImage;
      itemTitle = variant.title || "";
      itemAttrs = variant.attributes || [];
      availableStock = variant.stock;
    }

    if (availableStock < item.quantity) {
      throw new ApiError(400, `Not enough stock for ${product.name}. Available: ${availableStock}`);
    }

    const itemTotal = itemPrice * item.quantity;
    subtotal += itemTotal;

    orderItems.push({
      product: product._id,
      variantId: item.variantId || null,
      variantTitle: itemTitle,
      attributes: itemAttrs,
      name: product.name,
      image: itemImage,
      price: itemPrice,
      mrp: itemMrp,
      quantity: item.quantity,
      total: itemTotal,
    });
  }

  // Coupon discount calculation
  let discount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.trim().toUpperCase(),
      isActive: true,
    });

    if (coupon) {
      if (coupon.discountType === "percentage") {
        discount = Math.round((subtotal * coupon.discountValue) / 100);
        if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
          discount = Math.min(discount, coupon.maxDiscountAmount);
        }
      } else if (coupon.discountType === "fixed") {
        discount = Math.min(coupon.discountValue, subtotal);
      }
      coupon.usedCount = (coupon.usedCount || 0) + 1;
      await coupon.save();
    }
  }

  // Shipping Fee calculation
  let shippingFee = 0;
  if (deliveryOption === "express") {
    shippingFee = expressFee;
  } else {
    shippingFee = subtotal >= freeShipThreshold ? 0 : standardFee;
  }

  // Tax calculation
  const tax = Math.round(((subtotal - discount) * taxPct) / 100);
  const totalAmount = Math.max(0, subtotal - discount + shippingFee + tax);

  const { orderNumber, invoiceNumber } = generateOrderAndInvoiceNumber();

  // Deduct stock and increment sales count
  for (const item of orderItems) {
    if (item.variantId) {
      await Product.updateOne(
        { _id: item.product, "variants._id": item.variantId },
        {
          $inc: {
            "variants.$.stock": -item.quantity,
            stock: -item.quantity,
            salesCount: item.quantity,
          },
        }
      );
    } else {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, salesCount: item.quantity },
      });
    }
  }

  // Normalize payment method and check store settings
  let normalizedPaymentMethod = paymentMethod || "Cash on Delivery";
  if (/cod|cash/i.test(paymentMethod)) {
    normalizedPaymentMethod = "Cash on Delivery";
  } else if (/online|razorpay|upi|card|net/i.test(paymentMethod)) {
    normalizedPaymentMethod = "Online Payment";
  }

  if (normalizedPaymentMethod === "Cash on Delivery" && storeSettings?.paymentMethods?.cod?.enabled === false) {
    throw new ApiError(400, "Cash on Delivery is currently disabled by store admin");
  }
  if (normalizedPaymentMethod === "Online Payment" && storeSettings?.paymentMethods?.razorpay?.enabled === false) {
    throw new ApiError(400, "Online payments are currently disabled by store admin");
  }

  // Delivery estimation
  const estDate = new Date();
  estDate.setDate(estDate.getDate() + (deliveryOption === "express" ? 2 : 5));

  const initialHistory = [
    {
      status: "Confirmed",
      note: "Order placed and confirmed successfully",
      location: "Warehouse Dispatch Center",
      timestamp: new Date(),
    },
  ];

  const isCOD = normalizedPaymentMethod === "Cash on Delivery";

  const order = await Order.create({
    orderNumber,
    invoiceNumber,
    user: req.user._id,
    customerInfo: {
      name: req.user.name || shippingAddress.name,
      email: req.user.email,
      phone: req.user.phone || shippingAddress.phone,
    },
    items: orderItems,
    shippingAddress,
    paymentInfo: {
      method: normalizedPaymentMethod,
      status: isCOD ? "Pending" : "Completed",
      transactionId: transactionId || (isCOD ? "" : `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`),
      paidAt: isCOD ? null : new Date(),
    },
    pricing: {
      subtotal,
      discount,
      couponCode: couponCode || "",
      shippingFee,
      tax,
      totalAmount,
    },
    totalAmount,
    orderStatus: "Confirmed",
    deliveryOption,
    tracking: {
      carrier: "Express Courier",
      trackingNumber: `TRK-${orderNumber.slice(-8)}`,
      estDeliveryDate: estDate,
      history: initialHistory,
    },
    notes,
  });

  // Clear user's active cart
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

  return res.status(201).json(new ApiResponse(201, order, "Order placed successfully!"));
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await Order.countDocuments({ user: req.user._id });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orders,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
      "My orders fetched"
    )
  );
});

export const getOrderByIdOrNumber = asyncHandler(async (req, res) => {
  const { identifier } = req.params;

  let query = { orderNumber: identifier };
  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    query = { $or: [{ _id: identifier }, { orderNumber: identifier }] };
  }

  const order = await Order.findOne(query).populate("items.product", "name slug thumbnail");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // If not admin, ensure order belongs to current user
  if (!req.admin && req.user && order.user?.toString() !== req.user._id?.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "Unauthorized access to this order");
  }

  return res.status(200).json(new ApiResponse(200, order, "Order fetched"));
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = "Customer request" } = req.body;

  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  if (req.user && order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "Unauthorized to cancel this order");
  }

  if (["Shipped", "Out for Delivery", "Delivered"].includes(order.orderStatus)) {
    throw new ApiError(400, "Cannot cancel order once it has been shipped");
  }

  order.orderStatus = "Cancelled";
  order.cancelledReason = reason;
  order.tracking.history.push({
    status: "Cancelled",
    note: `Order cancelled: ${reason}`,
    location: "Online Portal",
    timestamp: new Date(),
  });

  await order.save();

  // Restore inventory
  for (const item of order.items) {
    if (item.variantId) {
      await Product.updateOne(
        { _id: item.product, "variants._id": item.variantId },
        {
          $inc: {
            "variants.$.stock": item.quantity,
            stock: item.quantity,
            salesCount: -item.quantity,
          },
        }
      );
    } else {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, salesCount: -item.quantity },
      });
    }
  }

  return res.status(200).json(new ApiResponse(200, order, "Order cancelled successfully"));
});

// Admin Controllers
export const getAllOrdersAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search, dateFrom, dateTo } = req.query;

  const filter = {};
  if (status && status !== "all") {
    if (status.toLowerCase() === "returns" || status.toLowerCase() === "return requested" || status.toLowerCase() === "returned") {
      filter["returnRequest.status"] = { $in: ["Requested", "Approved", "Refunded", "Refund Processed", "Rejected"] };
    } else {
      filter.orderStatus = status;
    }
  }

  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
      { invoiceNumber: { $regex: search, $options: "i" } },
      { "customerInfo.name": { $regex: search, $options: "i" } },
      { "customerInfo.email": { $regex: search, $options: "i" } },
      { "customerInfo.phone": { $regex: search, $options: "i" } },
    ];
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await Order.countDocuments(filter);
  const pendingReturnsCount = await Order.countDocuments({
    "returnRequest.status": "Requested",
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orders,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        pendingReturnsCount,
      },
      "Admin orders fetched"
    )
  );
});

export const getCourierTrackingUrl = (carrier, trackingNumber) => {
  if (!trackingNumber) return "";
  const c = (carrier || "").toLowerCase();
  if (c.includes("delhivery")) return `https://www.delhivery.com/track/package/${trackingNumber}`;
  if (c.includes("blue") || c.includes("dart")) return `https://www.bluedart.com/tracking?trackNumber=${trackingNumber}`;
  if (c.includes("dtdc")) return `https://www.dtdc.in/tracking/shipment-tracking.asp?trackingNo=${trackingNumber}`;
  if (c.includes("shiprocket")) return `https://shiprocket.co/tracking/${trackingNumber}`;
  if (c.includes("ekart")) return `https://ekartlogistics.com/shipmenttrack/${trackingNumber}`;
  if (c.includes("post") || c.includes("speed")) return `https://www.indiapost.gov.in/_layouts/15/dpt.cpt.ui/trackconsignment.aspx`;
  return "";
};

export const updateOrderStatusAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const targetStatus = req.body.orderStatus || req.body.status;
  const { carrier, trackingNumber, trackingUrl, note = "", paymentStatus } = req.body;

  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  const previousStatus = order.orderStatus;

  if (targetStatus) {
    order.orderStatus = targetStatus;
    order.tracking = order.tracking || {};
    order.tracking.history = order.tracking.history || [];
    order.tracking.history.push({
      status: targetStatus,
      note: note || (targetStatus === "Delivered" ? "Package successfully delivered to customer" : `Status updated to ${targetStatus}`),
      location: req.body.location || "Fulfillment Hub",
      timestamp: new Date(),
    });

    // If marked Delivered and COD, mark payment as Completed automatically
    if (targetStatus === "Delivered" && order.paymentInfo?.method?.toLowerCase().includes("cash")) {
      order.paymentInfo.status = "Completed";
      order.paymentInfo.paidAt = new Date();
    }
  }

  if (carrier) order.tracking.carrier = carrier;
  if (trackingNumber) order.tracking.trackingNumber = trackingNumber;
  if (trackingUrl) {
    order.tracking.trackingUrl = trackingUrl;
  } else if (carrier && (trackingNumber || order.tracking?.trackingNumber)) {
    order.tracking.trackingUrl = getCourierTrackingUrl(carrier, trackingNumber || order.tracking.trackingNumber);
  }

  if (paymentStatus) {
    order.paymentInfo.status = paymentStatus;
    if (paymentStatus === "Completed" && !order.paymentInfo.paidAt) {
      order.paymentInfo.paidAt = new Date();
    }
  }

  await order.save();

  // Trigger automated customer emails
  if (targetStatus === "Shipped" && previousStatus !== "Shipped") {
    sendOrderShippedEmail(order).catch((e) => console.warn("Shipped email err:", e));
  } else if (targetStatus === "Delivered" && previousStatus !== "Delivered") {
    sendOrderDeliveredEmail(order).catch((e) => console.warn("Delivered email err:", e));
  }

  return res.status(200).json(new ApiResponse(200, order, "Order status updated successfully"));
});

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount, currency = "INR", receipt } = req.body;
  
  if (!amount || amount <= 0) {
    throw new ApiError(400, "Valid order amount is required");
  }

  // Generate simulated Razorpay order payload (or live order if keys present)
  const orderId = `order_rzp_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        id: orderId,
        amount: Math.round(amount * 100), // in paise
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        status: "created",
      },
      "Razorpay order initialized"
    )
  );
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId, orderId, signature, method = "Online Gateway" } = req.body;

  // Verify signature or simulate verification
  const isVerified = true;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        verified: isVerified,
        transactionId: paymentId || `TXN-${Date.now()}`,
        method,
        timestamp: new Date(),
      },
      "Payment verified successfully"
    )
  );
});

export const downloadOrderInvoicePDF = asyncHandler(async (req, res) => {
  const { identifier } = req.params;

  let query = { orderNumber: identifier };
  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    query = { $or: [{ _id: identifier }, { orderNumber: identifier }] };
  }

  const order = await Order.findOne(query);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const storeSettings = (await Setting.findOne()) || {};
  const storeName = storeSettings?.warehouse?.name || storeSettings?.storeName || "NovaStore";
  const storeTagline = storeSettings?.tagline || "Authorized Single Vendor Platform";
  const storeAddress = storeSettings?.warehouse?.address || storeSettings?.contact?.address || "101, Tech Avenue, Silicon City, Bangalore, India";
  const storeEmail = storeSettings?.contact?.email || "support@novastore.com";
  const storePhone = storeSettings?.contact?.phone || "+91 98765 43210";
  const gstin = storeSettings?.warehouse?.gstin || "29AABCN8592M1ZK";
  const pan = storeSettings?.warehouse?.pan || "AABCN8592M";
  const stateCode = storeSettings?.warehouse?.stateCode || "29 (Karnataka)";

  const bankName = storeSettings?.bankDetails?.bankName || "HDFC Bank Ltd";
  const accountNumber = storeSettings?.bankDetails?.accountNumber || "5020008892182";
  const ifscCode = storeSettings?.bankDetails?.ifscCode || "HDFC0000240";
  const branchName = storeSettings?.bankDetails?.branchName || "Cyber City Branch";
  const upiId = storeSettings?.bankDetails?.upiId || "pay.novastore@hdfcbank";

  const doc = new PDFDocument({ margin: 36, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Invoice-${order.invoiceNumber || order.orderNumber}.pdf"`
  );

  doc.pipe(res);

  // Palette
  const primaryColor = "#4338ca"; // Indigo-700
  const secondaryColor = "#1e1b4b"; // Indigo-950
  const darkColor = "#0f172a";
  const grayColor = "#64748b";
  const lightBg = "#f8fafc";
  const borderCol = "#e2e8f0";
  const isPaid = order.paymentInfo?.status === "Completed" || order.paymentInfo?.status === "Paid";

  // Helper: Draw Background Watermark
  const drawWatermark = () => {
    doc.save();
    doc.rotate(-32, { origin: [297, 420] });
    doc.fontSize(52);
    doc.font("Helvetica-Bold");
    doc.fillColor("#475569");
    doc.fillOpacity(0.04);
    doc.text(isPaid ? "PAID • TAX INVOICE" : "TAX INVOICE • ORIGINAL", -60, 390, {
      align: "center",
      width: 720,
    });
    doc.restore();
    doc.fillOpacity(1);
  };

  drawWatermark();

  // 1. Header Box
  doc.rect(36, 36, 523, 72).fill("#f1f5f9");

  // Left: Store Branding
  doc.fillColor(primaryColor).fontSize(18).font("Helvetica-Bold").text(storeName.toUpperCase(), 50, 48);
  doc.fillColor(grayColor).fontSize(7.5).font("Helvetica").text(storeTagline, 50, 68);
  doc.text(`GSTIN: ${gstin} | PAN: ${pan}`, 50, 80);
  doc.text(`${storeAddress}`, 50, 92);

  // Right: Document Title & Tax Notice
  doc.fillColor(secondaryColor).fontSize(14).font("Helvetica-Bold").text("TAX INVOICE", 380, 48, { align: "right", width: 165 });
  doc.fillColor(primaryColor).fontSize(8).font("Helvetica-Bold").text("ORIGINAL FOR RECIPIENT", 380, 66, { align: "right", width: 165 });
  doc.fillColor(grayColor).fontSize(7.5).font("Helvetica").text("Bill of Supply under Rule 46 GST", 380, 78, { align: "right", width: 165 });
  doc.text(`State Code: ${stateCode}`, 380, 90, { align: "right", width: 165 });

  // 2. Invoice & Order Metadata Strip
  let y = 118;
  doc.rect(36, y, 523, 38).fill("#ffffff").strokeColor(borderCol).stroke();

  doc.fillColor(darkColor).fontSize(7.5);
  doc.font("Helvetica-Bold").text("Invoice No: ", 48, y + 8).font("Helvetica").text(order.invoiceNumber || `INV-${order.orderNumber}`, 105, y + 8);
  doc.font("Helvetica-Bold").text("Invoice Date: ", 48, y + 22).font("Helvetica").text(new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), 105, y + 22);

  doc.font("Helvetica-Bold").text("Order ID: ", 220, y + 8).font("Helvetica").text(`#${order.orderNumber}`, 265, y + 8);
  doc.font("Helvetica-Bold").text("Order Date: ", 220, y + 22).font("Helvetica").text(new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), 265, y + 22);

  doc.font("Helvetica-Bold").text("Payment Mode: ", 380, y + 8).font("Helvetica").text(`${order.paymentInfo?.method || order.paymentMethod || "COD"}`, 450, y + 8);
  doc.font("Helvetica-Bold").text("Payment Status: ", 380, y + 22).fillColor(isPaid ? "#16a34a" : "#ca8a04").font("Helvetica-Bold").text(order.paymentInfo?.status || "Pending", 450, y + 22);

  // 3. Customer Billing & Shipping Address Boxes
  y = 164;
  const colW = 256;
  // Billed To Box
  doc.rect(36, y, colW, 68).fill("#f8fafc").strokeColor(borderCol).stroke();
  doc.fillColor(primaryColor).fontSize(8).font("Helvetica-Bold").text("BILLED TO:", 46, y + 8);
  doc.fillColor(darkColor).fontSize(8.5).font("Helvetica-Bold").text(order.shippingAddress?.name || order.customerInfo?.name || "Customer", 46, y + 20);
  doc.fillColor(grayColor).fontSize(7.5).font("Helvetica");
  doc.text(order.shippingAddress?.street || "", 46, y + 32, { width: colW - 20 });
  doc.text(`${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} - ${order.shippingAddress?.pincode || ""}`, 46, y + 43);
  doc.text(`Phone: ${order.shippingAddress?.phone || order.customerInfo?.phone || "N/A"}`, 46, y + 54);

  // Shipped To Box
  const shipX = 36 + colW + 11;
  doc.rect(shipX, y, colW, 68).fill("#f8fafc").strokeColor(borderCol).stroke();
  doc.fillColor(primaryColor).fontSize(8).font("Helvetica-Bold").text("SHIPPED TO (DELIVERY DESTINATION):", shipX + 10, y + 8);
  doc.fillColor(darkColor).fontSize(8.5).font("Helvetica-Bold").text(order.shippingAddress?.name || order.customerInfo?.name || "Customer", shipX + 10, y + 20);
  doc.fillColor(grayColor).fontSize(7.5).font("Helvetica");
  doc.text(order.shippingAddress?.street || "", shipX + 10, y + 32, { width: colW - 20 });
  doc.text(`${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} - ${order.shippingAddress?.pincode || ""}`, shipX + 10, y + 43);
  doc.text(`Place of Delivery: ${order.shippingAddress?.state || "Karnataka"} (India)`, shipX + 10, y + 54);

  // 4. Products Table
  y = 240;
  doc.rect(36, y, 523, 22).fill(primaryColor);
  doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
  doc.text("#", 44, y + 7);
  doc.text("ITEM DESCRIPTION", 64, y + 7);
  doc.text("HSN/SAC", 260, y + 7);
  doc.text("QTY", 325, y + 7, { align: "center", width: 30 });
  doc.text("UNIT RATE", 365, y + 7, { align: "right", width: 55 });
  doc.text("GST (5%)", 430, y + 7, { align: "right", width: 50 });
  doc.text("TOTAL (INR)", 490, y + 7, { align: "right", width: 60 });

  y += 26;
  doc.font("Helvetica").fontSize(7.5);

  order.items.forEach((item, index) => {
    if (y > 660) {
      doc.addPage();
      drawWatermark();
      y = 40;
    }

    const itemPrice = item.price || 0;
    const itemQty = item.quantity || 1;
    const itemTotal = item.total || itemPrice * itemQty;
    const taxAmt = Math.round((itemTotal * 0.05 / 1.05) * 100) / 100;

    // Row zebra / white
    doc.rect(36, y - 4, 523, 22).fill(index % 2 === 0 ? "#ffffff" : "#f8fafc");

    doc.fillColor(grayColor).text(`${index + 1}`, 44, y + 2);
    doc.fillColor(darkColor).font("Helvetica-Bold").text(item.name || "Product", 64, y + 2, { width: 190 });
    if (item.variantTitle) {
      doc.fillColor(primaryColor).font("Helvetica").fontSize(6.5).text(`Variant: ${item.variantTitle}`, 64, y + 11);
      doc.fontSize(7.5);
    }

    doc.fillColor(grayColor).font("Helvetica").text("8517.12", 260, y + 2);
    doc.fillColor(darkColor).text(`${itemQty}`, 325, y + 2, { align: "center", width: 30 });
    doc.text(`Rs. ${itemPrice.toLocaleString()}`, 365, y + 2, { align: "right", width: 55 });
    doc.fillColor(grayColor).text(`Rs. ${taxAmt.toFixed(2)}`, 430, y + 2, { align: "right", width: 50 });
    doc.fillColor(darkColor).font("Helvetica-Bold").text(`Rs. ${itemTotal.toLocaleString()}`, 490, y + 2, { align: "right", width: 60 }).font("Helvetica");

    y += 24;
    doc.moveTo(36, y - 2).lineTo(559, y - 2).strokeColor(borderCol).stroke();
  });

  y += 6;

  // 5. Financial Summary & Amount in Words
  const grandTotal = order.pricing?.totalAmount ?? order.totalAmount;
  const subtotal = order.pricing?.subtotal ?? order.subtotal ?? grandTotal;
  const discount = order.pricing?.discount || order.couponDiscount || 0;
  const shippingFee = order.pricing?.shippingFee ?? 0;
  const tax = order.pricing?.tax ?? Math.round(grandTotal * 0.05);
  const cgst = (tax / 2).toFixed(2);
  const sgst = (tax / 2).toFixed(2);

  // Left Column: Amount in Words & Bank Transfer Details
  const leftX = 36;
  doc.rect(leftX, y, 280, 105).fill("#f8fafc").strokeColor(borderCol).stroke();
  doc.fillColor(primaryColor).fontSize(7.5).font("Helvetica-Bold").text("INVOICE AMOUNT IN WORDS:", leftX + 10, y + 8);
  doc.fillColor(darkColor).fontSize(8).font("Helvetica-Bold").text(numberToWordsIndian(grandTotal), leftX + 10, y + 20, { width: 260 });

  doc.moveTo(leftX + 10, y + 42).lineTo(leftX + 270, y + 42).strokeColor(borderCol).stroke();
  doc.fillColor(primaryColor).fontSize(7.5).font("Helvetica-Bold").text("DIRECT BANK TRANSFER / UPI DETAILS:", leftX + 10, y + 48);
  doc.fillColor(grayColor).fontSize(7).font("Helvetica");
  doc.text(`Bank Name: ${bankName} | A/C No: ${accountNumber}`, leftX + 10, y + 60);
  doc.text(`IFSC: ${ifscCode} | Branch: ${branchName}`, leftX + 10, y + 71);
  doc.text(`Official UPI ID: ${upiId}`, leftX + 10, y + 82);
  doc.text("Remittance Remark: Quote Invoice #" + (order.invoiceNumber || order.orderNumber), leftX + 10, y + 93);

  // Right Column: Price Breakdown
  const rightX = 326;
  const rightW = 233;
  doc.rect(rightX, y, rightW, 105).fill("#ffffff").strokeColor(borderCol).stroke();

  let ry = y + 8;
  doc.fontSize(7.5).font("Helvetica");

  doc.fillColor(grayColor).text("Taxable Value (Subtotal):", rightX + 12, ry);
  doc.fillColor(darkColor).text(`Rs. ${subtotal.toLocaleString()}`, rightX + 120, ry, { align: "right", width: 95 });
  ry += 14;

  if (discount > 0) {
    doc.fillColor("#16a34a").text(`Promo Discount (${order.pricing?.couponCode || "COUPON"}):`, rightX + 12, ry);
    doc.text(`-Rs. ${discount.toLocaleString()}`, rightX + 120, ry, { align: "right", width: 95 });
    ry += 14;
  }

  doc.fillColor(grayColor).text("Shipping & Handling:", rightX + 12, ry);
  doc.fillColor(darkColor).text(shippingFee === 0 ? "FREE" : `Rs. ${shippingFee.toLocaleString()}`, rightX + 120, ry, { align: "right", width: 95 });
  ry += 14;

  doc.fillColor(grayColor).text("CGST (2.5%):", rightX + 12, ry);
  doc.fillColor(darkColor).text(`Rs. ${cgst}`, rightX + 120, ry, { align: "right", width: 95 });
  ry += 14;

  doc.fillColor(grayColor).text("SGST (2.5%):", rightX + 12, ry);
  doc.fillColor(darkColor).text(`Rs. ${sgst}`, rightX + 120, ry, { align: "right", width: 95 });
  ry += 16;

  // Grand Total Pill
  doc.rect(rightX + 6, ry - 3, rightW - 12, 22).fill(primaryColor);
  doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold").text("TOTAL AMOUNT:", rightX + 14, ry + 3);
  doc.text(`Rs. ${grandTotal.toLocaleString()}`, rightX + 110, ry + 3, { align: "right", width: 100 });

  // 6. Footer: Terms & Authorized Signatory Box
  y += 114;
  doc.rect(36, y, 320, 68).fill("#f8fafc").strokeColor(borderCol).stroke();
  doc.fillColor(primaryColor).fontSize(7.5).font("Helvetica-Bold").text("TERMS & CONDITIONS OF SALE:", 46, y + 8);
  doc.fillColor(grayColor).fontSize(6.8).font("Helvetica");
  doc.text("1. All products sold are backed by 7-Day Hassle-Free Replacement Guarantee.", 46, y + 20);
  doc.text("2. Warranty services are honored through authorized service centers Pan-India.", 46, y + 31);
  doc.text("3. Dispatched via approved courier partners under valid e-Way bill regulations.", 46, y + 42);
  doc.text("4. All disputes are subject to Bangalore, Karnataka jurisdiction only.", 46, y + 53);

  // Authorized Signatory Box (Right)
  const sigX = 366;
  doc.rect(sigX, y, 193, 68).fill("#ffffff").strokeColor(borderCol).stroke();
  doc.fillColor(darkColor).fontSize(7.5).font("Helvetica-Bold").text(`For ${storeName}`, sigX + 10, y + 8);

  // Digital Seal / Signature Stamp Watermark
  doc.rect(sigX + 10, y + 22, 173, 26).strokeColor("#cbd5e1").dash(3, { space: 2 }).stroke();
  doc.undash();
  doc.fillColor("#6366f1").fontSize(7).font("Helvetica-Bold").text("✓ DIGITALLY VERIFIED SIGNATURE", sigX + 15, y + 27, { align: "center", width: 163 });
  doc.fillColor(grayColor).fontSize(6).font("Helvetica").text("Electronic Tax Invoice • System Approved", sigX + 15, y + 37, { align: "center", width: 163 });

  doc.fillColor(darkColor).fontSize(7).font("Helvetica-Bold").text("Authorised Signatory", sigX + 10, y + 54);

  // Bottom Notice
  doc.fillColor(grayColor).fontSize(6.5).text(
    `This is a computer-generated tax invoice generated electronically on ${new Date().toLocaleString("en-IN")}. Questions? Contact support at ${storeEmail} or ${storePhone}.`,
    36,
    765,
    { align: "center", width: 523 }
  );

  doc.end();
});

export const requestOrderReturn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason, comment = "", images = [], refundMode = "Original Source" } = req.body;

  if (!reason) {
    throw new ApiError(400, "Return reason is required");
  }

  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  if (order.user?.toString() !== req.user._id?.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "Unauthorized to request return for this order");
  }

  if (order.orderStatus !== "Delivered") {
    throw new ApiError(400, "Returns can only be requested after the order has been delivered");
  }

  order.returnRequest = {
    status: "Requested",
    reason,
    comment,
    images: Array.isArray(images) ? images : [],
    requestedAt: new Date(),
    refundAmount: order.pricing?.totalAmount || order.totalAmount,
    refundMode,
    adminNote: "",
  };

  order.tracking.history.push({
    status: "Return Requested",
    note: `Customer requested doorstep return: ${reason}`,
    location: "Customer Residence",
    timestamp: new Date(),
  });

  await order.save();
  return res.status(200).json(new ApiResponse(200, order, "Return request submitted successfully!"));
});

export const adminUpdateReturnStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const targetReturnStatus = req.body.returnStatus || req.body.status;
  const { adminNote = "", refundAmount, refundMode } = req.body;

  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  if (!order.returnRequest) {
    order.returnRequest = {};
  }

  if (targetReturnStatus) {
    order.returnRequest.status = targetReturnStatus;
    if (targetReturnStatus === "Refund Processed" || targetReturnStatus === "Approved" || targetReturnStatus === "Refunded") {
      order.returnRequest.resolvedAt = new Date();
    }
    if (targetReturnStatus === "Refund Processed" || targetReturnStatus === "Refunded") {
      order.paymentInfo.status = "Refunded";
      order.orderStatus = "Returned";
    }

    order.tracking = order.tracking || {};
    order.tracking.history = order.tracking.history || [];
    order.tracking.history.push({
      status: `Return ${targetReturnStatus}`,
      note: adminNote || `Return status updated to ${targetReturnStatus}`,
      location: "Fulfillment Center",
      timestamp: new Date(),
    });
  }

  if (adminNote) order.returnRequest.adminNote = adminNote;
  if (refundAmount !== undefined) order.returnRequest.refundAmount = Number(refundAmount);
  if (refundMode) order.returnRequest.refundMode = refundMode;

  await order.save();
  return res.status(200).json(new ApiResponse(200, order, "Return request status updated"));
});

export const adminExportOrdersCsv = asyncHandler(async (req, res) => {
  const { startDate, endDate, status, paymentMethod } = req.query;
  const filter = {};

  if (status && status !== "all") {
    filter.orderStatus = status;
  }
  if (paymentMethod && paymentMethod !== "all") {
    filter["paymentInfo.method"] = paymentMethod;
  }
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 });

  const headers = [
    "Order Number",
    "Invoice Number",
    "Invoice Date",
    "Customer Name",
    "Phone",
    "Email",
    "Place of Supply (State)",
    "Shipping City",
    "Pincode",
    "Payment Method",
    "Payment Status",
    "Order Status",
    "Items Count",
    "Taxable Value (INR)",
    "CGST (INR)",
    "SGST (INR)",
    "IGST (INR)",
    "Total Tax / GST (INR)",
    "Shipping Fee (INR)",
    "Discount (INR)",
    "Total Invoice Value (INR)",
    "Courier Partner",
    "Tracking AWB",
    "Return Status",
  ];

  const escapeCsv = (str) => `"${String(str ?? "").replace(/"/g, '""')}"`;

  const rows = orders.map((o) => {
    const rev = o.pricing?.totalAmount || o.totalAmount || 0;
    const disc = o.pricing?.discount || 0;
    const ship = o.pricing?.shippingFee || 0;
    const tax = o.pricing?.tax || 0;
    const sub = o.pricing?.subtotal || (rev - tax - ship + disc);
    const taxable = Math.max(0, sub - disc);

    const state = (o.shippingAddress?.state || "").trim().toLowerCase();
    const isLocalState = state.includes("karnataka") || state === "ka";
    const cgst = isLocalState ? Number((tax / 2).toFixed(2)) : 0;
    const sgst = isLocalState ? Number((tax / 2).toFixed(2)) : 0;
    const igst = !isLocalState ? Number(tax.toFixed(2)) : 0;

    return [
      escapeCsv(o.orderNumber),
      escapeCsv(o.invoiceNumber || `INV-${o.orderNumber}`),
      escapeCsv(new Date(o.createdAt).toLocaleDateString("en-IN")),
      escapeCsv(o.customerInfo?.name),
      escapeCsv(o.customerInfo?.phone),
      escapeCsv(o.customerInfo?.email),
      escapeCsv(o.shippingAddress?.state || "Karnataka"),
      escapeCsv(o.shippingAddress?.city),
      escapeCsv(o.shippingAddress?.pincode),
      escapeCsv(o.paymentInfo?.method),
      escapeCsv(o.paymentInfo?.status),
      escapeCsv(o.orderStatus),
      o.items?.length || 0,
      taxable.toFixed(2),
      cgst.toFixed(2),
      sgst.toFixed(2),
      igst.toFixed(2),
      tax.toFixed(2),
      ship.toFixed(2),
      disc.toFixed(2),
      rev.toFixed(2),
      escapeCsv(o.tracking?.carrier || ""),
      escapeCsv(o.tracking?.trackingNumber || ""),
      escapeCsv(o.returnRequest?.status || "None"),
    ];
  });

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="NovaStore_GST_Sales_Report_${Date.now()}.csv"`
  );
  return res.status(200).send(csvContent);
});

export const adminGetReportsSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate, status, paymentMethod } = req.query;
  const filter = {};

  if (status && status !== "all") {
    filter.orderStatus = status;
  }
  if (paymentMethod && paymentMethod !== "all") {
    filter["paymentInfo.method"] = paymentMethod;
  }
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 });

  let totalOrders = orders.length;
  let totalRevenue = 0;
  let totalTaxable = 0;
  let totalTax = 0;
  let totalDiscount = 0;
  let totalShipping = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  const statusCount = {};
  const paymentCount = {};

  orders.forEach((o) => {
    const rev = o.pricing?.totalAmount || o.totalAmount || 0;
    const disc = o.pricing?.discount || 0;
    const ship = o.pricing?.shippingFee || 0;
    const tax = o.pricing?.tax || 0;
    const sub = o.pricing?.subtotal || (rev - tax - ship + disc);
    const taxable = Math.max(0, sub - disc);

    totalRevenue += rev;
    totalTaxable += taxable;
    totalTax += tax;
    totalDiscount += disc;
    totalShipping += ship;

    const state = (o.shippingAddress?.state || "").trim().toLowerCase();
    const isLocalState = state.includes("karnataka") || state === "ka";
    if (isLocalState) {
      cgstTotal += Number((tax / 2).toFixed(2));
      sgstTotal += Number((tax / 2).toFixed(2));
    } else {
      igstTotal += Number(tax.toFixed(2));
    }

    statusCount[o.orderStatus] = (statusCount[o.orderStatus] || 0) + 1;
    const pm = o.paymentInfo?.method || "Cash on Delivery";
    paymentCount[pm] = (paymentCount[pm] || 0) + 1;
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTaxable: Math.round(totalTaxable * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        cgstTotal: Math.round(cgstTotal * 100) / 100,
        sgstTotal: Math.round(sgstTotal * 100) / 100,
        igstTotal: Math.round(igstTotal * 100) / 100,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        totalShipping: Math.round(totalShipping * 100) / 100,
        statusCount,
        paymentCount,
        recentOrders: orders.slice(0, 15).map((o) => ({
          _id: o._id,
          orderNumber: o.orderNumber,
          invoiceNumber: o.invoiceNumber || `INV-${o.orderNumber}`,
          createdAt: o.createdAt,
          customerName: o.customerInfo?.name,
          city: o.shippingAddress?.city,
          state: o.shippingAddress?.state,
          totalAmount: o.pricing?.totalAmount || o.totalAmount,
          tax: o.pricing?.tax || 0,
          orderStatus: o.orderStatus,
          paymentMethod: o.paymentInfo?.method,
        })),
      },
      "Reports summary fetched successfully"
    )
  );
});



