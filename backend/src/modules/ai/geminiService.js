/**
 * Google Gemini Integration for NovaStore Admin Copilot
 * Supports Gemini 2.0 Flash and 1.5 Flash with Tool Calling / Function Declarations.
 */

const GEMINI_API_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export const GEMINI_TOOLS_DECLARATIONS = [
  {
    name: "getStoreAnalytics",
    description: "Get current store KPIs: today's revenue, order count, pending fulfillment, pending returns, low stock count.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "getLowStockProducts",
    description: "Find products where stock is less than or equal to a threshold.",
    parameters: {
      type: "OBJECT",
      properties: {
        threshold: { type: "INTEGER", description: "Stock threshold, default 5" },
      },
    },
  },
  {
    name: "searchProducts",
    description: "Search or list products by keyword, category, brand, or name (e.g. phone, laptop, shoes).",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Search keyword, category or product name, e.g. 'phone'" },
        limit: { type: "INTEGER", description: "Number of products to retrieve, default 10" },
      },
    },
  },
  {
    name: "updateProductStock",
    description: "Set or adjust stock quantity for a product by name or ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Product name, slug, or ID" },
        stock: { type: "INTEGER", description: "New stock value" },
        mode: { type: "STRING", enum: ["set", "add", "subtract"], description: "Stock update mode" },
      },
      required: ["query", "stock"],
    },
  },
  {
    name: "updateProductPrice",
    description: "Update product selling price or MRP.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Product name or ID" },
        price: { type: "NUMBER", description: "New selling price in INR" },
        mrp: { type: "NUMBER", description: "New MRP in INR" },
      },
      required: ["query"],
    },
  },
  {
    name: "toggleProductStatus",
    description: "Publish or unpublish (hide) a product from the storefront.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Product name or ID" },
        isPublished: { type: "BOOLEAN", description: "true to publish, false to draft/hide" },
      },
      required: ["query"],
    },
  },
  {
    name: "getOrderDetails",
    description: "Get full status, items, customer info, and tracking for an order number.",
    parameters: {
      type: "OBJECT",
      properties: {
        orderNumber: { type: "STRING", description: "e.g. ORD-548268-2596" },
      },
      required: ["orderNumber"],
    },
  },
  {
    name: "updateOrderStatus",
    description: "Update order fulfillment status (Delivered, Shipped, Confirmed, Processing, Cancelled).",
    parameters: {
      type: "OBJECT",
      properties: {
        orderNumber: { type: "STRING", description: "e.g. ORD-548268-2596" },
        status: {
          type: "STRING",
          enum: ["Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
          description: "New status",
        },
        note: { type: "STRING", description: "Tracking note" },
        carrier: { type: "STRING", description: "Courier name e.g. BlueDart, In-House" },
        trackingNumber: { type: "STRING", description: "AWB Tracking code" },
      },
      required: ["orderNumber", "status"],
    },
  },
  {
    name: "manageReturnRequest",
    description: "Approve, reject, or refund a customer return request on an order.",
    parameters: {
      type: "OBJECT",
      properties: {
        orderNumber: { type: "STRING", description: "Order number" },
        action: { type: "STRING", enum: ["Approve", "Reject", "Refund"], description: "Action to take" },
        refundAmount: { type: "NUMBER", description: "Amount in INR to refund" },
        note: { type: "STRING", description: "Admin note or reason" },
      },
      required: ["orderNumber", "action"],
    },
  },
  {
    name: "createDiscountCoupon",
    description: "Create a promotional discount coupon for the store.",
    parameters: {
      type: "OBJECT",
      properties: {
        code: { type: "STRING", description: "Coupon code, e.g. FESTIVE20" },
        discountType: { type: "STRING", enum: ["percentage", "fixed"] },
        discountValue: { type: "NUMBER", description: "Percentage or flat rupee value" },
        minOrderAmount: { type: "NUMBER", description: "Minimum order cart value" },
        daysValid: { type: "INTEGER", description: "Validity days, default 30" },
      },
      required: ["code", "discountValue"],
    },
  },
  {
    name: "getGstSummary",
    description: "Calculate sales and GST tax collected (CGST, SGST, IGST) for accounting.",
    parameters: {
      type: "OBJECT",
      properties: {
        period: { type: "STRING", enum: ["today", "week", "month"] },
      },
    },
  },
  {
    name: "getPendingQuestions",
    description: "Retrieve pending customer questions waiting for admin answer.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "answerCustomerQuestion",
    description: "Post official admin answer for a customer product question.",
    parameters: {
      type: "OBJECT",
      properties: {
        questionId: { type: "STRING", description: "Question ID" },
        query: { type: "STRING", description: "Matching query or keywords from question" },
        answerText: { type: "STRING", description: "Official answer" },
      },
      required: ["answerText"],
    },
  },
  {
    name: "updateAnnouncementBar",
    description: "Update the top announcement header promo text.",
    parameters: {
      type: "OBJECT",
      properties: {
        text: { type: "STRING", description: "Banner message" },
        enabled: { type: "BOOLEAN" },
      },
      required: ["text"],
    },
  },
  {
    name: "createProduct",
    description: "Create and publish a new product in the store catalog. Extracts name, brand, price, mrp, stock, category, and image automatically.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Product name/title, e.g. 'Noise ColorFit Pro Smartwatch'" },
        brand: { type: "STRING", description: "Brand name, e.g. 'Noise', 'Apple', 'Samsung'" },
        price: { type: "NUMBER", description: "Selling price in INR" },
        mrp: { type: "NUMBER", description: "MRP / original price in INR" },
        stock: { type: "INTEGER", description: "Stock units quantity, default 50" },
        categoryName: { type: "STRING", description: "Category name e.g. 'Accessories & Lifestyle', 'Electronics & Gadgets', 'Smartphones & Mobile', etc." },
        description: { type: "STRING", description: "Product description" },
        image: { type: "STRING", description: "Image URL or 'unsplash' for automatic high quality image" },
      },
      required: ["name", "price"],
    },
  },
  {
    name: "deleteProduct",
    description: "Delete or remove a product from the store catalog by name or ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Product name or ID to delete" },
      },
      required: ["query"],
    },
  },
  {
    name: "deleteCoupon",
    description: "Remove or delete an existing discount coupon code.",
    parameters: {
      type: "OBJECT",
      properties: {
        code: { type: "STRING", description: "Coupon code to delete, e.g. 'SUMMER20'" },
      },
      required: ["code"],
    },
  },
];

export async function callGeminiCopilot({ prompt, apiKey, conversationHistory = [] }) {
  if (!apiKey) throw new Error("Gemini API key is required for Mode A");

  const systemInstruction = `You are the NovaStore Admin AI Copilot. 
You strictly execute store operations for the NovaStore single-vendor e-commerce platform.
DOMAIN BOUNDARY (CRITICAL):
- You ONLY handle e-commerce operations: Products, Inventory, Stock, Pricing, Orders, Fulfillment, Delivery, Returns, Refunds, Coupons, Discounts, GST/Tax Reports, Customer Product Q&As, and Store Announcement Banners.
- You must FIRMLY REFUSE any request outside this store (such as writing general code, answering history, politics, sports, general knowledge, jokes, or writing essays). When refusing, politely state: "I am the NovaStore Admin Copilot. I can only assist with store operations and catalog management."
- Whenever the user asks to perform an administrative action, call the appropriate tool with clean parameters.
- Be concise, professional, and clear.`;

  const contents = [];
  if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    conversationHistory.slice(-4).forEach((msg) => {
      contents.push({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text || "" }],
      });
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: prompt }],
  });

  const payload = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents,
    tools: [
      {
        function_declarations: GEMINI_TOOLS_DECLARATIONS,
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 800,
    },
  };

  const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  if (!candidate || !candidate.content?.parts) {
    return { text: "No response received from Gemini." };
  }

  const parts = candidate.content.parts;
  const functionCallPart = parts.find((p) => p.functionCall);

  if (functionCallPart) {
    return {
      hasFunctionCall: true,
      toolName: functionCallPart.functionCall.name,
      params: functionCallPart.functionCall.args || {},
    };
  }

  const textPart = parts.find((p) => p.text);
  return {
    hasFunctionCall: false,
    text: textPart ? textPart.text : "Processed.",
  };
}
