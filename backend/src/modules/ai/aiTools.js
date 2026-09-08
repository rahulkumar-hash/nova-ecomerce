import mongoose from "mongoose";
import { Product } from "../products/product.modal.js";
import { Category } from "../category/category.modal.js";
import { Order } from "../Order/order.model.js";
import { Coupon } from "../coupon/coupon.model.js";
import { Question } from "../Question/Question.model.js";
import { Setting } from "../Setting/Setting.model.js";

/**
 * Robust Product Search Filter supporting token matching and regex character escaping
 */
export function buildProductSearchFilter(query) {
  if (!query) return {};
  if (mongoose.Types.ObjectId.isValid(query)) {
    return { _id: query };
  }
  const clean = query.trim();
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tokens = clean
    .replace(/[()]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const tokenRegex = tokens.join(".*");

  return {
    $or: [
      { name: { $regex: escaped, $options: "i" } },
      { name: { $regex: tokenRegex, $options: "i" } },
      { slug: { $regex: escaped, $options: "i" } },
      { sku: { $regex: escaped, $options: "i" } },
    ],
  };
}

/**
 * AI Tool Registry: Core Store Operations for NovaStore Admin Copilot
 */
export const aiTools = {
  /**
   * 1. Get high-level store health snapshot
   */
  async getStoreAnalytics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      pendingReturns,
      lowStockProducts,
      unansweredQuestions,
      activeCouponsCount,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ orderStatus: { $in: ["Pending", "Confirmed", "Processing"] } }),
      Order.countDocuments({ "returnRequest.status": { $in: ["Requested", "Item Picked Up"] } }),
      Product.countDocuments({ stock: { $lte: 5 } }),
      Question.countDocuments({ answer: { $in: ["", null] } }),
      Coupon.countDocuments({ isActive: true, expiryDate: { $gte: new Date() } }),
    ]);

    // Aggregate today's gross sales
    const salesAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: today }, orderStatus: { $nin: ["Cancelled"] } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const todayRevenue = salesAgg.length > 0 ? salesAgg[0].total : 0;

    const summaryText = `Store snapshot: ₹${todayRevenue.toLocaleString("en-IN")} sales today, ${todayOrders} new orders, ${pendingOrders} pending fulfillment, ${pendingReturns} returns waiting, and ${lowStockProducts} products low on stock.`;
    return {
      success: true,
      message: summaryText,
      summary: summaryText,
      metrics: {
        todayRevenue,
        totalOrders,
        todayOrders,
        pendingOrders,
        pendingReturns,
        lowStockProducts,
        unansweredQuestions,
        activeCouponsCount,
      },
    };
  },

  /**
   * 2. Query products with stock at or below threshold
   */
  async getLowStockProducts({ threshold = 5 } = {}) {
    const limit = Number(threshold) || 5;
    const items = await Product.find({ stock: { $lte: limit } })
      .select("name price mrp stock sku images category isPublished")
      .limit(20)
      .lean();

    return {
      success: true,
      count: items.length,
      threshold: limit,
      products: items.map((p) => ({
        id: p._id,
        name: p.name,
        stock: p.stock,
        price: p.price,
        sku: p.sku || "N/A",
        thumbnail: p.images?.[0] || "",
        isPublished: p.isPublished,
      })),
      message: items.length > 0 
        ? `Found ${items.length} products with stock ≤ ${limit}.` 
        : `All products currently have stock greater than ${limit}.`,
    };
  },

  /**
   * Search / List products by keyword, name, category or brand
   */
  async searchProducts({ query, limit = 10 } = {}) {
    const cleanQuery = (query || "").trim();
    let filter = cleanQuery ? buildProductSearchFilter(cleanQuery) : {};

    const items = await Product.find(filter)
      .select("name price mrp stock sku images category isPublished")
      .limit(Number(limit) || 10)
      .lean();

    return {
      success: true,
      count: items.length,
      query: cleanQuery,
      products: items.map((p) => ({
        id: p._id,
        name: p.name,
        stock: p.stock,
        price: p.price,
        mrp: p.mrp,
        sku: p.sku || "N/A",
        thumbnail: p.images?.[0] || "",
        isPublished: p.isPublished,
      })),
      message: items.length > 0
        ? `Found ${items.length} product(s) matching "${cleanQuery}":`
        : `No products found matching "${cleanQuery}".`,
    };
  },

  /**
   * 3. Update stock of a product (by name, slug, or ID)
   */
  async updateProductStock({ query, stock, mode = "set" }) {
    if (!query) throw new Error("Product name or ID is required");
    const stockNum = Number(stock);
    if (isNaN(stockNum) || stockNum < 0) throw new Error("Valid stock number required");

    let filter = buildProductSearchFilter(query);

    const product = await Product.findOne(filter);
    if (!product) {
      return { success: false, message: `Could not find any product matching "${query}".` };
    }

    const oldStock = product.stock;
    let newStock = stockNum;
    if (mode === "add") {
      newStock = oldStock + stockNum;
    } else if (mode === "subtract") {
      newStock = Math.max(0, oldStock - stockNum);
    }

    product.stock = newStock;
    // If product has variants, update first variant or uniform stock
    if (product.hasVariants && product.variants?.length > 0) {
      product.variants.forEach((v) => {
        v.stock = Math.round(newStock / product.variants.length);
      });
    }

    await Product.findByIdAndUpdate(product._id, {
      stock: newStock,
      variants: product.variants,
    });

    return {
      success: true,
      productId: product._id,
      productName: product.name,
      oldStock,
      newStock,
      message: `Updated stock for "${product.name}" from ${oldStock} to ${newStock} units.`,
    };
  },

  /**
   * 4. Update product price / MRP / discount
   */
  async updateProductPrice({ query, price, mrp }) {
    if (!query) throw new Error("Product identifier required");
    let filter = buildProductSearchFilter(query);

    const product = await Product.findOne(filter);
    if (!product) {
      return { success: false, message: `Could not find any product matching "${query}".` };
    }

    const oldPrice = product.price;
    const oldMrp = product.mrp;
    const newPrice = Number(price);

    let newMrp = mrp !== undefined ? Number(mrp) : Math.max(newPrice, Number(product.mrp) || newPrice);
    let discount = 0;
    if (newMrp > newPrice) {
      discount = Math.round(((newMrp - newPrice) / newMrp) * 100);
    }

    product.price = newPrice;
    product.mrp = newMrp;
    product.discount = discount;
    product.discountValue = discount;
    product.discountType = "percentage";

    if (product.hasVariants && product.variants?.length > 0) {
      product.variants.forEach((v) => {
        v.price = newPrice;
        v.mrp = newMrp;
        v.discount = discount;
      });
    }

    await Product.findByIdAndUpdate(product._id, {
      price: newPrice,
      mrp: newMrp,
      discount,
      discountValue: discount,
      discountType: "percentage",
      variants: product.variants,
    });

    return {
      success: true,
      productId: product._id,
      productName: product.name,
      oldPrice,
      newPrice,
      oldMrp,
      newMrp,
      message: `Updated price for "${product.name}" from ₹${oldPrice?.toLocaleString("en-IN")} to ₹${newPrice?.toLocaleString("en-IN")} (MRP: ₹${newMrp?.toLocaleString("en-IN")}, Discount: ${discount}%).`,
    };
  },

  /**
   * 5. Toggle publish / active status of product
   */
  async toggleProductStatus({ query, isPublished }) {
    if (!query) throw new Error("Product identifier required");
    let filter = mongoose.Types.ObjectId.isValid(query)
      ? { _id: query }
      : { name: { $regex: query, $options: "i" } };

    const product = await Product.findOne(filter);
    if (!product) {
      return { success: false, message: `Product "${query}" not found.` };
    }

    const newStatus = isPublished !== undefined ? Boolean(isPublished) : !product.isPublished;
    product.isPublished = newStatus;
    await product.save();

    return {
      success: true,
      productName: product.name,
      isPublished: product.isPublished,
      message: `Product "${product.name}" is now ${newStatus ? "PUBLISHED (Visible)" : "DRAFT (Hidden)"}.`,
    };
  },

  /**
   * 6. Look up order details
   */
  async getOrderDetails({ orderNumber }) {
    if (!orderNumber) throw new Error("Order number required");
    const cleanNum = orderNumber.trim();
    const order = await Order.findOne({
      $or: [
        { orderNumber: cleanNum },
        { invoiceNumber: cleanNum },
        { orderNumber: { $regex: cleanNum, $options: "i" } },
      ],
    }).lean();

    if (!order) {
      return { success: false, message: `Order with number "${cleanNum}" not found.` };
    }

    return {
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        invoiceNumber: order.invoiceNumber,
        customerName: order.customerInfo?.name || order.shippingAddress?.name,
        customerPhone: order.customerInfo?.phone,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentInfo?.method,
        paymentStatus: order.paymentInfo?.status,
        trackingCarrier: order.tracking?.carrier,
        trackingNumber: order.tracking?.trackingNumber,
        returnStatus: order.returnRequest?.status || "None",
        returnReason: order.returnRequest?.reason,
        itemsCount: order.items?.length || 0,
        createdAt: order.createdAt,
      },
      message: `Order ${order.orderNumber} is currently "${order.orderStatus}" (Payment: ${order.paymentInfo?.status}).`,
    };
  },

  /**
   * 7. Update order fulfillment status
   */
  async updateOrderStatus({ orderNumber, status, note, carrier, trackingNumber }) {
    if (!orderNumber || !status) throw new Error("Order number and new status required");
    const cleanNum = orderNumber.trim();

    const order = await Order.findOne({
      $or: [{ orderNumber: cleanNum }, { orderNumber: { $regex: cleanNum, $options: "i" } }],
    });

    if (!order) {
      return { success: false, message: `Order "${cleanNum}" not found.` };
    }

    const prevStatus = order.orderStatus;
    order.orderStatus = status;

    // If marked Delivered and COD, auto-complete payment
    if (status === "Delivered" && ["COD", "Cash on Delivery"].includes(order.paymentInfo?.method)) {
      order.paymentInfo.status = "Completed";
      order.paymentInfo.paidAt = new Date();
    }

    if (carrier) order.tracking.carrier = carrier;
    if (trackingNumber) order.tracking.trackingNumber = trackingNumber;

    if (!order.tracking.history) order.tracking.history = [];
    order.tracking.history.push({
      status,
      note: note || `Status updated to ${status} via NovaStore Admin AI Copilot.`,
      timestamp: new Date(),
    });

    await order.save();

    return {
      success: true,
      orderNumber: order.orderNumber,
      prevStatus,
      newStatus: order.orderStatus,
      paymentStatus: order.paymentInfo?.status,
      message: `Successfully marked Order ${order.orderNumber} as "${status}".`,
    };
  },

  /**
   * 8. Resolve customer return request & optional refund
   */
  async manageReturnRequest({ orderNumber, action, refundAmount, note }) {
    if (!orderNumber || !action) throw new Error("Order number and action (Approve/Reject/Refund) required");
    const cleanNum = orderNumber.trim();

    const order = await Order.findOne({
      $or: [{ orderNumber: cleanNum }, { orderNumber: { $regex: cleanNum, $options: "i" } }],
    });

    if (!order) {
      return { success: false, message: `Order "${cleanNum}" not found.` };
    }

    const actionLower = action.toLowerCase();
    if (actionLower.includes("approve")) {
      order.returnRequest.status = "Approved";
      order.returnRequest.resolvedAt = new Date();
      order.returnRequest.adminNote = note || "Return request approved via AI Copilot.";
      if (refundAmount) {
        order.returnRequest.refundAmount = Number(refundAmount);
      }
    } else if (actionLower.includes("reject")) {
      order.returnRequest.status = "Rejected";
      order.returnRequest.resolvedAt = new Date();
      order.returnRequest.adminNote = note || "Return request rejected by store administrator.";
    } else if (actionLower.includes("refund")) {
      order.returnRequest.status = "Refunded";
      order.orderStatus = "Returned";
      order.paymentInfo.status = "Refunded";
      order.returnRequest.resolvedAt = new Date();
      order.returnRequest.refundAmount = Number(refundAmount) || order.totalAmount;
      order.returnRequest.adminNote = note || `Refund of ₹${order.returnRequest.refundAmount} issued.`;
    }

    await order.save();

    return {
      success: true,
      orderNumber: order.orderNumber,
      returnStatus: order.returnRequest.status,
      refundAmount: order.returnRequest.refundAmount || 0,
      message: `Return request for Order ${order.orderNumber} updated to "${order.returnRequest.status}".`,
    };
  },

  /**
   * 9. Create a promotional discount coupon
   */
  async createDiscountCoupon({
    code,
    discountType = "percentage",
    discountValue,
    minOrderAmount = 0,
    maxDiscountAmount = 0,
    daysValid = 30,
    usageLimit = 500,
  }) {
    if (!code || !discountValue) throw new Error("Coupon code and discount value required");
    const upperCode = code.toUpperCase().trim();

    const existing = await Coupon.findOne({ code: upperCode });
    if (existing) {
      return { success: false, message: `Coupon "${upperCode}" already exists.` };
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (Number(daysValid) || 30));

    const coupon = await Coupon.create({
      code: upperCode,
      description: `Created via Admin AI Copilot: ${discountValue}${discountType === "percentage" ? "%" : " flat"} off`,
      discountType: discountType === "fixed" ? "fixed" : "percentage",
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: Number(maxDiscountAmount) || 0,
      expiryDate,
      usageLimit: Number(usageLimit) || 500,
      isActive: true,
    });

    return {
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
        expiryDate: coupon.expiryDate,
      },
      message: `Created coupon "${coupon.code}": ${coupon.discountValue}${coupon.discountType === "percentage" ? "%" : "₹"} OFF (Min Order: ₹${coupon.minOrderAmount}, Valid for ${daysValid} days).`,
    };
  },

  /**
   * 10. GST and Tax Summary for reports
   */
  async getGstSummary({ period = "month" } = {}) {
    const now = new Date();
    let startDate = new Date();

    if (period === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      startDate.setDate(now.getDate() - 7);
    } else {
      // Month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const orders = await Order.find({
      createdAt: { $gte: startDate },
      orderStatus: { $nin: ["Cancelled"] },
    }).lean();

    let totalGrossSales = 0;
    let totalTaxCollected = 0;
    let totalDiscount = 0;
    let totalOrdersCount = orders.length;

    orders.forEach((o) => {
      totalGrossSales += o.totalAmount || 0;
      totalTaxCollected += o.pricing?.tax || 0;
      totalDiscount += o.pricing?.discount || 0;
    });

    // Compute Indian GST Split: 50% CGST, 50% SGST (or IGST for interstate)
    const cgst = Math.round((totalTaxCollected / 2) * 100) / 100;
    const sgst = Math.round((totalTaxCollected / 2) * 100) / 100;
    const netTaxableValue = Math.max(0, totalGrossSales - totalTaxCollected);

    return {
      success: true,
      period,
      ordersCount: totalOrdersCount,
      totalGrossSales,
      netTaxableValue,
      totalTaxCollected,
      cgst,
      sgst,
      message: `GST Summary (${period}): Total Sales ₹${totalGrossSales.toLocaleString("en-IN")} across ${totalOrdersCount} orders. Tax Collected: ₹${totalTaxCollected.toLocaleString("en-IN")} (CGST: ₹${cgst}, SGST: ₹${sgst}).`,
    };
  },

  /**
   * 11. View pending customer questions
   */
  async getPendingQuestions() {
    const list = await Question.find({ answer: { $in: ["", null] } })
      .populate("product", "name images price")
      .limit(10)
      .lean();

    return {
      success: true,
      count: list.length,
      questions: list.map((q) => ({
        id: q._id,
        productName: q.product?.name || "Product",
        productId: q.product?._id,
        userName: q.userName,
        question: q.question,
        createdAt: q.createdAt,
      })),
      message: list.length > 0
        ? `Found ${list.length} pending customer question(s).`
        : "No unanswered customer questions found. All questions have been addressed!",
    };
  },

  /**
   * 12. Answer a customer question
   */
  async answerCustomerQuestion({ questionId, answerText, query }) {
    if (!answerText) throw new Error("Answer text is required");

    let questionDoc = null;
    if (questionId && mongoose.Types.ObjectId.isValid(questionId)) {
      questionDoc = await Question.findById(questionId).populate("product", "name");
    } else if (query) {
      questionDoc = await Question.findOne({
        question: { $regex: query, $options: "i" },
        answer: { $in: ["", null] },
      }).populate("product", "name");
    }

    if (!questionDoc) {
      return { success: false, message: "Could not find any matching unanswered question." };
    }

    questionDoc.answer = answerText.trim();
    questionDoc.answeredBy = "NovaStore Support (AI Copilot)";
    questionDoc.answeredAt = new Date();
    questionDoc.isApproved = true;
    await questionDoc.save();

    return {
      success: true,
      questionId: questionDoc._id,
      productName: questionDoc.product?.name,
      question: questionDoc.question,
      answer: questionDoc.answer,
      message: `Answered question for "${questionDoc.product?.name}": "${answerText.trim()}"`,
    };
  },

  /**
   * 13. Update store announcement banner
   */
  async updateAnnouncementBar({ text, enabled, bgColor, textColor }) {
    const setting = await Setting.findOne();
    if (!setting) {
      return { success: false, message: "Store settings record not found." };
    }

    if (text !== undefined) setting.announcementBar.text = text;
    if (enabled !== undefined) setting.announcementBar.enabled = Boolean(enabled);
    if (bgColor !== undefined) setting.announcementBar.bgColor = bgColor;
    if (textColor !== undefined) setting.announcementBar.textColor = textColor;

    await setting.save();

    return {
      success: true,
      announcementBar: setting.announcementBar,
      message: `Announcement bar updated: "${setting.announcementBar.text}" (${setting.announcementBar.enabled ? "Active" : "Disabled"}).`,
    };
  },

  /**
   * 14. Create / Add new product to catalog
   */
  async createProduct({
    name,
    brand = "",
    price,
    mrp,
    stock = 50,
    categoryName = "",
    description = "",
    image = "",
  }) {
    if (!name) throw new Error("Product name is required");
    const salePrice = Number(price) || 999;
    const mrpPrice = Number(mrp) || Math.round(salePrice * 1.25);

    // Auto-resolve Category
    let categoryDoc = null;
    if (categoryName) {
      categoryDoc = await Category.findOne({ name: { $regex: categoryName, $options: "i" } });
    }
    if (!categoryDoc) {
      const lower = name.toLowerCase();
      if (/watch|band|strap|wearable/i.test(lower)) {
        categoryDoc = await Category.findOne({ name: /Accessories|Electronics/i });
      } else if (/phone|mobile|smartphone/i.test(lower)) {
        categoryDoc = await Category.findOne({ name: /Smartphones|Mobile/i });
      } else if (/cloth|shirt|pant|jeans|hoodie|wear|apparel/i.test(lower)) {
        categoryDoc = await Category.findOne({ name: /Clothing/i });
      } else if (/shoe|sneaker|footwear/i.test(lower)) {
        categoryDoc = await Category.findOne({ name: /Footwear/i });
      }
    }
    if (!categoryDoc) {
      categoryDoc = await Category.findOne(); // First available category
    }

    // High quality default Unsplash images for products
    let finalImage = image;
    const lowerName = name.toLowerCase();
    if (!finalImage || /unsplash|unsplace|default/i.test(finalImage)) {
      if (/watch/i.test(lowerName)) {
        finalImage = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80";
      } else if (/phone|mobile/i.test(lowerName)) {
        finalImage = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80";
      } else if (/shoe|sneaker/i.test(lowerName)) {
        finalImage = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80";
      } else if (/headphone|earphone|audio/i.test(lowerName)) {
        finalImage = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80";
      } else {
        finalImage = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80";
      }
    }

    const discount = mrpPrice > salePrice ? Math.round(((mrpPrice - salePrice) / mrpPrice) * 100) : 0;

    const newProd = await Product.create({
      name: name.trim(),
      brand: brand || (name.split(" ")[0] || "NovaStore"),
      price: salePrice,
      mrp: mrpPrice,
      discount,
      discountValue: discount,
      discountType: "percentage",
      stock: Number(stock) || 50,
      category: categoryDoc?._id,
      images: [finalImage],
      thumbnail: finalImage,
      description: description || `Premium ${name} by ${brand || "NovaStore"}. Genuine manufacturer quality with official warranty.`,
      shortDescription: `${name} at the best price on NovaStore.`,
      isPublished: true,
    });

    return {
      success: true,
      productId: newProd._id,
      product: {
        id: newProd._id,
        name: newProd.name,
        price: newProd.price,
        mrp: newProd.mrp,
        stock: newProd.stock,
        thumbnail: finalImage,
        categoryName: categoryDoc?.name || "Catalog",
      },
      productName: newProd.name,
      price: newProd.price,
      mrp: newProd.mrp,
      stock: newProd.stock,
      categoryName: categoryDoc?.name || "Catalog",
      thumbnail: finalImage,
      message: `Successfully created new product "${newProd.name}" under ${categoryDoc?.name || "Catalog"} at ₹${newProd.price?.toLocaleString("en-IN")} (MRP: ₹${newProd.mrp?.toLocaleString("en-IN")}, Stock: ${newProd.stock})!`,
    };
  },

  /**
   * 15. Delete product by name or ID
   */
  async deleteProduct({ query }) {
    if (!query) throw new Error("Product identifier required");
    const filter = buildProductSearchFilter(query);
    const prod = await Product.findOne(filter);
    if (!prod) {
      return { success: false, message: `Could not find any product matching "${query}".` };
    }
    await Product.findByIdAndDelete(prod._id);
    return {
      success: true,
      deletedProductName: prod.name,
      message: `Product "${prod.name}" has been deleted from the store catalog.`,
    };
  },

  /**
   * 16. Delete coupon by code
   */
  async deleteCoupon({ code }) {
    if (!code) throw new Error("Coupon code required");
    const upper = code.toUpperCase().trim();
    const coupon = await Coupon.findOneAndDelete({ code: upper });
    if (!coupon) {
      return { success: false, message: `Coupon "${upper}" not found.` };
    }
    return {
      success: true,
      code: upper,
      message: `Coupon "${upper}" has been removed from the store.`,
    };
  },
};
