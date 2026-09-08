/**
 * Local Deterministic Intent & Pattern Parser for NovaStore Admin Copilot
 * Zero external dependencies. Fast, offline-first, and robust with English & Hinglish support.
 */

// Scope Guard: Forbidden / Out-of-bounds keywords
const OUT_OF_SCOPE_REGEX = /\b(python|javascript code|write a code|write a script|essay|poem|joke|prime minister|weather|president|recipe|movie|song|history of|translate to|who is|who was|capital of|biology|chemistry|physics)\b/i;

// Store related keywords that validate domain relevance
const STORE_KEYWORDS_REGEX = /\b(order|product|stock|inventory|price|mrp|discount|coupon|promo|gst|tax|return|refund|customer|sales|revenue|delivered|shipped|tracking|announcement|banner|question|q&a|store|catalog|admin)\b/i;

export function parseLocalAdminIntent(rawPrompt) {
  const prompt = rawPrompt.trim();
  const lower = prompt.toLowerCase();

  // 1. Strict Boundary Guardrail
  if (OUT_OF_SCOPE_REGEX.test(lower) && !STORE_KEYWORDS_REGEX.test(lower)) {
    return {
      isRefusal: true,
      message:
        "⚠️ **Access Restricted to Store Operations**\n\nI am your **NovaStore Admin Copilot**. My purpose is exclusively dedicated to managing store catalog, orders, stock inventory, returns & refunds, coupons, and sales reports. I cannot assist with non-store topics.",
    };
  }

  // Helper regex extractors
  const orderNumberMatch = prompt.match(/\b(ORD-[A-Z0-9-]+|INV-[A-Z0-9-]+)\b/i) || prompt.match(/\b(ORD\d+|\d{5,8})\b/i);
  const orderNumber = orderNumberMatch ? orderNumberMatch[1] : null;

  // -------------------------------------------------------------
  // Intent: Return Requests & Refunds
  // -------------------------------------------------------------
  if (/\b(return|refund|wapas)\b/i.test(lower)) {
    if (/\b(show|list|pending|check|kitne|view|get)\b/i.test(lower) && !/\b(approve|reject|process)\b/i.test(lower)) {
      return {
        toolName: "getStoreAnalytics", // Returns pending returns count + status
        params: {},
        userFriendlyGoal: "Viewing pending returns and store status",
        requiresConfirmation: false,
      };
    }

    if (orderNumber) {
      let action = "Approve";
      if (/\b(reject|rejecting|mana)\b/i.test(lower)) action = "Reject";
      if (/\b(refund|refunded|refund karo)\b/i.test(lower)) action = "Refund";

      // Extract refund amount if mentioned (e.g. "refund 1499" or "refund ₹500")
      // Remove orderNumber from search text so order ID numbers don't match
      const searchWithoutOrder = prompt.replace(orderNumber, "");
      const amtMatch = searchWithoutOrder.match(/(?:₹|rs\.?|inr|refund|amount)?\s*(\d{2,6})/i);
      const refundAmount = amtMatch ? Number(amtMatch[1]) : 0;

      return {
        toolName: "manageReturnRequest",
        params: { orderNumber, action, refundAmount },
        requiresConfirmation: true,
        confirmationPrompt: `Are you sure you want to **${action}** return for **${orderNumber}**${refundAmount ? ` with refund of ₹${refundAmount}` : ""}?`,
        userFriendlyGoal: `${action} return request for order ${orderNumber}`,
      };
    }
  }

  // -------------------------------------------------------------
  // Intent: Update Order Status (e.g. "mark order ORD-xxx delivered")
  // -------------------------------------------------------------
  if (/\b(order|status)\b/i.test(lower) && orderNumber) {
    let targetStatus = null;
    if (/\b(delivered|deliver|pahuch gya|delivered kardo)\b/i.test(lower)) targetStatus = "Delivered";
    else if (/\b(shipped|dispatch|bhej diya)\b/i.test(lower)) targetStatus = "Shipped";
    else if (/\b(confirmed|confirm)\b/i.test(lower)) targetStatus = "Confirmed";
    else if (/\b(processing|process)\b/i.test(lower)) targetStatus = "Processing";
    else if (/\b(out for delivery)\b/i.test(lower)) targetStatus = "Out for Delivery";
    else if (/\b(cancel|cancelled|radd)\b/i.test(lower)) targetStatus = "Cancelled";

    if (targetStatus) {
      return {
        toolName: "updateOrderStatus",
        params: { orderNumber, status: targetStatus },
        requiresConfirmation: ["Delivered", "Cancelled"].includes(targetStatus),
        confirmationPrompt: `Update fulfillment status of order **${orderNumber}** to **${targetStatus}**?`,
        userFriendlyGoal: `Mark order ${orderNumber} as ${targetStatus}`,
      };
    }

    // Otherwise fetch details
    return {
      toolName: "getOrderDetails",
      params: { orderNumber },
      requiresConfirmation: false,
      userFriendlyGoal: `Fetch tracking & details for order ${orderNumber}`,
    };
  }

  // -------------------------------------------------------------
  // Intent: Low Stock / Stock Alert
  // -------------------------------------------------------------
  if (/\b(low stock|out of stock|stock alert|kam stock|reorder)\b/i.test(lower)) {
    const thresholdMatch = prompt.match(/\b(?:less than|below|threshold|<=?)\s*(\d+)\b/i);
    const threshold = thresholdMatch ? Number(thresholdMatch[1]) : 5;
    return {
      toolName: "getLowStockProducts",
      params: { threshold },
      requiresConfirmation: false,
      userFriendlyGoal: `Checking low stock products (threshold: ${threshold})`,
    };
  }

  // -------------------------------------------------------------
  // Intent: Create / Add New Product (e.g. "add a new product of noise brands watch of 2500 rs mrp is 3000 with unsplace image")
  // -------------------------------------------------------------
  if (
    /\b(add|create|new product|insert|banao|add karo|naya product|daal do)\b/i.test(lower) &&
    /\b(product|item|watch|smartwatch|phone|mobile|shoe|shoes|shirt|headphone|earphone|laptop|charger|gadget|maal)\b/i.test(lower) &&
    !/\b(coupon|promo|voucher|discount code|announcement|answer|sawal)\b/i.test(lower)
  ) {
    // 1. Extract MRP
    let mrp = null;
    const mrpMatch = prompt.match(/(?:mrp|original price|maximum price)(?:\s*(?:is|hai|=|:))?\s*(?:₹|rs\.?|inr)?\s*(\d{2,7})\b/i);
    if (mrpMatch) {
      mrp = Number(mrpMatch[1]);
    }

    // 2. Extract Selling Price
    let price = null;
    const priceExplicitMatch = prompt.match(/(?:sale price|selling price|price|rate|cost|keemat)(?:\s*(?:is|hai|=|:))?\s*(?:₹|rs\.?|inr)?\s*(\d{2,7})\b/i);
    const rsMatch = prompt.match(/(?:₹|rs\.?|inr)\s*(\d{2,7})\b/i) || prompt.match(/\b(\d{2,7})\s*(?:₹|rs\.?|inr|rupees)\b/i);
    const ofPriceMatch = prompt.match(/\b(?:of|for|at)\s+(?:₹|rs\.?|inr)?\s*(\d{2,7})\b/i);

    if (priceExplicitMatch) {
      price = Number(priceExplicitMatch[1]);
    } else if (rsMatch && Number(rsMatch[1]) !== mrp) {
      price = Number(rsMatch[1]);
    } else if (ofPriceMatch && Number(ofPriceMatch[1]) !== mrp) {
      price = Number(ofPriceMatch[1]);
    }

    if (!price && mrp) {
      const allNums = [...prompt.matchAll(/\b(\d{2,7})\b/g)].map((m) => Number(m[1])).filter((n) => n !== mrp);
      if (allNums.length > 0) price = allNums[0];
    }
    if (!price) price = 999;
    if (!mrp) mrp = Math.round(price * 1.25);

    // 3. Extract Brand
    let brand = "";
    const knownBrands = [
      "noise", "boat", "apple", "samsung", "nothing", "sony", "oneplus",
      "xiaomi", "realme", "nike", "adidas", "puma", "fastrack", "titan",
      "fire-boltt", "zebronics", "jbl", "boult"
    ];
    const foundKnown = knownBrands.find((b) => new RegExp(`\\b${b}\\b`, "i").test(prompt));
    if (foundKnown) {
      brand = foundKnown.charAt(0).toUpperCase() + foundKnown.slice(1);
    } else {
      const brandMatch = prompt.match(/\b(?:of\s+brand(?:s)?|brand(?:s)?(?:\s*(?:is|name|hai|=|:))?|by)\s+([a-zA-Z0-9]+)\b/i);
      if (brandMatch && !/product|new|watch|phone|shoe/i.test(brandMatch[1])) {
        brand = brandMatch[1];
      }
    }

    // 4. Category hint
    let categoryName = "";
    if (/watch|smartwatch|band|wearable/i.test(lower)) categoryName = "Accessories & Lifestyle";
    else if (/phone|mobile|smartphone/i.test(lower)) categoryName = "Smartphones & Mobile";
    else if (/shoe|sneaker|footwear/i.test(lower)) categoryName = "Footwear & Shoes";
    else if (/shirt|pant|jeans|hoodie|clothing|cloth/i.test(lower)) categoryName = "Clothing & Apparel";
    else if (/headphone|earphone|audio|speaker|charger|gadget/i.test(lower)) categoryName = "Electronics & Gadgets";

    // 5. Image
    let image = "";
    if (/unspla(?:sh|ce)|photo|image|picture/i.test(lower)) {
      image = "unsplash";
    }

    // 6. Title / Name extraction
    let cleanName = prompt
      .replace(/\b(add|create|insert|banao|naya|new|product|of|a|an|the|with|unsplace|unsplash|image|photo|picture|pic|is|rs|inr|rupees|mrp|price|sale|brand(?:s)?|called|named)\b/gi, "")
      .replace(new RegExp(`\\b${price}\\b`, "g"), "")
      .replace(new RegExp(`\\b${mrp}\\b`, "g"), "")
      .replace(/\s+/g, " ")
      .trim();

    let productName = cleanName;
    if (!productName || productName.length < 3) {
      productName = `${brand ? brand + " " : ""}${categoryName ? categoryName.split(" ")[0] : "Item"}`;
    } else {
      productName = productName
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
      if (brand && !new RegExp(`\\b${brand}\\b`, "i").test(productName)) {
        productName = `${brand} ${productName}`;
      }
    }

    return {
      toolName: "createProduct",
      params: {
        name: productName,
        brand: brand || "NovaStore",
        price,
        mrp,
        stock: 50,
        categoryName,
        image: image || "unsplash",
      },
      requiresConfirmation: true,
      confirmationPrompt: `Create new product **"${productName}"** (${brand || "Brand"}) at **₹${price.toLocaleString("en-IN")}** (MRP: ₹${mrp.toLocaleString("en-IN")}) with ${image ? "Unsplash image" : "catalog photo"}?`,
      userFriendlyGoal: `Add new product "${productName}" to catalog`,
    };
  }

  // -------------------------------------------------------------
  // Intent: Delete Product (e.g. "delete product Noise Watch" or "remove item iPhone")
  // -------------------------------------------------------------
  if (/\b(delete|remove|hatao|delete kardo|hata do)\b/i.test(lower) && /\b(product|item|maal|phone|watch|shoe|headphone)\b/i.test(lower)) {
    let cleanQuery = prompt
      .replace(/\b(delete|remove|hatao|kardo|kar do|hata do|product|item|the|a|an|from|catalog|store)\b/gi, "")
      .trim();
    if (cleanQuery.length > 1) {
      return {
        toolName: "deleteProduct",
        params: { query: cleanQuery },
        requiresConfirmation: true,
        confirmationPrompt: `Are you sure you want to permanently delete product **"${cleanQuery}"** from catalog?`,
        userFriendlyGoal: `Delete product "${cleanQuery}"`,
      };
    }
  }

  // -------------------------------------------------------------
  // Intent: Delete Coupon (e.g. "delete coupon FESTIVE20")
  // -------------------------------------------------------------
  if (/\b(delete|remove|hatao|hata do)\b/i.test(lower) && /\b(coupon|promo|voucher|code)\b/i.test(lower)) {
    const textWithoutKeywords = prompt.replace(/\b(delete|remove|hatao|hata do|coupon|promo|voucher|code|the|a)\b/gi, "").trim();
    const codeMatch = textWithoutKeywords.match(/\b([A-Z0-9_]{3,15})\b/i);
    const code = codeMatch ? codeMatch[1].toUpperCase() : null;
    if (code) {
      return {
        toolName: "deleteCoupon",
        params: { code },
        requiresConfirmation: true,
        confirmationPrompt: `Are you sure you want to delete discount coupon **${code}**?`,
        userFriendlyGoal: `Delete coupon ${code}`,
      };
    }
  }

  // -------------------------------------------------------------
  // Intent: Search / List Products (e.g. "give me product list of phone", "show all phones")
  // -------------------------------------------------------------
  if (
    /\b(product list|list of|show products|search product|find product|list products|phone list|mobile list)\b/i.test(lower) ||
    (/\b(list|show|give me|find|search|dikhao|batao)\b/i.test(lower) && /\b(product|products|item|items|phone|phones|mobile|mobiles|laptop|laptops|shoes|watch|charger|headphones|electronics)\b/i.test(lower))
  ) {
    let query = prompt
      .replace(/\b(give me|give|show|list of|product list of|product list|products of|products|product|items|search|find|dikhao|batao|ka|ki|ke|ko|all|the|me|se)\b/gi, "")
      .trim();

    if (!query && /\b(phone|phones|mobile|mobiles)\b/i.test(lower)) query = "phone";
    if (!query && /\b(laptop|laptops)\b/i.test(lower)) query = "laptop";
    if (!query && /\b(shoes|shoe)\b/i.test(lower)) query = "shoes";
    if (!query && /\b(headphone|headphones|earphone|audio)\b/i.test(lower)) query = "headphone";

    return {
      toolName: "searchProducts",
      params: { query: query || "phone", limit: 10 },
      requiresConfirmation: false,
      userFriendlyGoal: `Search products matching "${query || "phone"}"`,
    };
  }

  // -------------------------------------------------------------
  // Intent: Update Product Stock (e.g. "update stock of iPhone to 50" or "stock 20 kardo")
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // Intent: Update Product Stock (e.g. "Nothing Phone (2) 5G update stock 50")
  // -------------------------------------------------------------
  if (/\b(stock|inventory)\b/i.test(lower) && /\b(set|update|change|kardo|kar do|daal do|banao|add|increase|badhao)\b/i.test(lower)) {
    let stockNum = null;
    const stockFollowMatch = prompt.match(/(?:stock|inventory|to|=)\s*(?:is|=|to|of)?\s*(\d{1,6})\b/i);
    if (stockFollowMatch) {
      stockNum = Number(stockFollowMatch[1]);
    } else {
      const lastNumMatch = prompt.match(/\b(\d{1,6})\b(?!.*\b\d{1,6}\b)/);
      if (lastNumMatch) stockNum = Number(lastNumMatch[1]);
    }

    let cleanQuery = prompt;
    if (stockNum !== null) {
      cleanQuery = cleanQuery.replace(new RegExp(`\\b${stockNum}\\b`, "g"), "");
    }
    cleanQuery = cleanQuery
      .replace(/\b(update|set|change|kardo|kar do|daal do|badhao|add|increase|stock|inventory|units?|pcs?|of|product|the|to|ka|ki|ke|ko)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (stockNum !== null && cleanQuery.length > 1) {
      return {
        toolName: "updateProductStock",
        params: { query: cleanQuery, stock: stockNum, mode: "set" },
        requiresConfirmation: true,
        confirmationPrompt: `Update stock of product matching **"${cleanQuery}"** to **${stockNum}** units?`,
        userFriendlyGoal: `Set stock for ${cleanQuery} to ${stockNum}`,
      };
    }
  }

  // -------------------------------------------------------------
  // Intent: Update Product Price (e.g. "Nothing Phone (2) 5G update price 20000" or "change price of wireless mouse to 499")
  // -------------------------------------------------------------
  if (/\b(price|rate|mrp|keemat)\b/i.test(lower) && /\b(update|change|set|kardo|kar do|daal do)\b/i.test(lower)) {
    let price = null;
    const priceFollowMatch = prompt.match(/(?:price|rate|mrp|keemat|to|₹|rs\.?)\s*(?:is|=|to|of)?\s*(\d{2,7})\b/i);
    if (priceFollowMatch) {
      price = Number(priceFollowMatch[1]);
    } else {
      const lastNumMatch = prompt.match(/\b(\d{2,7})\b(?!.*\b\d{2,7}\b)/);
      if (lastNumMatch) price = Number(lastNumMatch[1]);
    }

    let cleanQuery = prompt;
    if (price) {
      cleanQuery = cleanQuery.replace(new RegExp(`\\b${price}\\b`, "g"), "");
    }
    cleanQuery = cleanQuery
      .replace(/\b(update|change|set|kardo|kar do|daal do|price|rate|mrp|keemat|of|product|the|to|₹|rs|inr|for|ka|ki|ke|ko)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (price && cleanQuery.length > 1) {
      return {
        toolName: "updateProductPrice",
        params: { query: cleanQuery, price },
        requiresConfirmation: true,
        confirmationPrompt: `Update selling price of **"${cleanQuery}"** to **₹${price}**?`,
        userFriendlyGoal: `Update price for ${cleanQuery} to ₹${price}`,
      };
    }
  }

  // -------------------------------------------------------------
  // Intent: Create Discount Coupon (e.g. "create 20% coupon SUMMER20 min order 500")
  // -------------------------------------------------------------
  if (/\b(coupon|promo|discount code|voucher)\b/i.test(lower) && /\b(create|banao|add|generate|make)\b/i.test(lower)) {
    const codeMatch = prompt.match(/\b([A-Z0-9_]{4,15})\b/);
    const discountMatch = prompt.match(/(\d{1,3})\s*%/);
    const flatMatch = prompt.match(/(?:flat|₹|rs\.?)\s*(\d{2,5})/i);
    const minOrderMatch = prompt.match(/(?:min|minimum|above)\s*(?:order)?\s*(?:₹|rs\.?)?\s*(\d{2,6})/i);

    const code = codeMatch ? codeMatch[1].toUpperCase() : "PROMO" + Math.floor(100 + Math.random() * 900);
    const discountType = discountMatch ? "percentage" : "fixed";
    const discountValue = discountMatch ? Number(discountMatch[1]) : flatMatch ? Number(flatMatch[1]) : 10;
    const minOrderAmount = minOrderMatch ? Number(minOrderMatch[1]) : 0;

    return {
      toolName: "createDiscountCoupon",
      params: { code, discountType, discountValue, minOrderAmount },
      requiresConfirmation: true,
      confirmationPrompt: `Create coupon **${code}** offering **${discountValue}${discountType === "percentage" ? "%" : "₹"} OFF** (Min order: ₹${minOrderAmount})?`,
      userFriendlyGoal: `Create discount coupon ${code}`,
    };
  }

  // -------------------------------------------------------------
  // Intent: GST / Tax Summary & Reports
  // -------------------------------------------------------------
  if (/\b(gst|tax|cgst|sgst|taxable|gstr|tax report)\b/i.test(lower)) {
    let period = "month";
    if (/\b(today|aaj)\b/i.test(lower)) period = "today";
    else if (/\b(week|hafte)\b/i.test(lower)) period = "week";

    return {
      toolName: "getGstSummary",
      params: { period },
      requiresConfirmation: false,
      userFriendlyGoal: `Calculating GST & Tax summary for ${period}`,
    };
  }

  // -------------------------------------------------------------
  // Intent: Customer Questions (Q&A)
  // -------------------------------------------------------------
  if (/\b(question|questions|sawal|inquiry|q&a|customer asked)\b/i.test(lower)) {
    if (/\b(answer|jawab|reply)\b/i.test(lower)) {
      // e.g. "answer question 'is it waterproof' with 'yes it is IP68'"
      const answerMatch = prompt.match(/(?:with|as|bolo|likho)\s*["']?([^"']+)["']?$/i);
      const answerText = answerMatch ? answerMatch[1].trim() : "Thank you for asking! Yes, this product is completely authentic and verified.";
      return {
        toolName: "answerCustomerQuestion",
        params: { answerText, query: prompt },
        requiresConfirmation: true,
        confirmationPrompt: `Submit answer: "${answerText}" for matching customer question?`,
        userFriendlyGoal: `Answering customer product question`,
      };
    }

    return {
      toolName: "getPendingQuestions",
      params: {},
      requiresConfirmation: false,
      userFriendlyGoal: "Fetching pending customer inquiries",
    };
  }

  // -------------------------------------------------------------
  // Intent: Announcement Bar Update
  // -------------------------------------------------------------
  if (/\b(announcement|header banner|promo bar|notice)\b/i.test(lower) && /\b(update|change|set|likho|banao)\b/i.test(lower)) {
    const textMatch = prompt.match(/(?:to|as|text)\s*["']?([^"']+)["']?$/i);
    const newText = textMatch ? textMatch[1].trim() : prompt;

    return {
      toolName: "updateAnnouncementBar",
      params: { text: newText, enabled: true },
      requiresConfirmation: true,
      confirmationPrompt: `Update store announcement bar to: "${newText}"?`,
      userFriendlyGoal: `Update store announcement bar`,
    };
  }

  // -------------------------------------------------------------
  // Intent: General Store Analytics / Dashboard Overview (Default)
  // -------------------------------------------------------------
  if (/\b(sales|revenue|orders|analytics|kpi|summary|dashboard|stats|overview|kaisa chal rha|aaj ka)\b/i.test(lower)) {
    return {
      toolName: "getStoreAnalytics",
      params: {},
      requiresConfirmation: false,
      userFriendlyGoal: "Fetching overall store analytics and KPIs",
    };
  }

  // Fallback: If store-related but no specific pattern matched
  if (STORE_KEYWORDS_REGEX.test(lower)) {
    return {
      toolName: "getStoreAnalytics",
      params: {},
      requiresConfirmation: false,
      userFriendlyGoal: "Store general query overview",
    };
  }

  // Final Boundary Refusal if query is completely foreign
  return {
    isRefusal: true,
    message:
      "⚠️ **Command Not Recognized Within Store Scope**\n\nI can only execute operations related to NovaStore Admin:\n• 📦 **Inventory:** *'Show low stock items'*, *'Update stock of wireless mouse to 50'*\n• 🚚 **Orders:** *'Mark order ORD-548268-2596 as Delivered'*, *'Order details for ORD-xxx'*\n• 🔄 **Returns:** *'Show pending return requests'*, *'Approve return for ORD-xxx'* \n• 🎟️ **Coupons:** *'Create 20% coupon FESTIVE20 min order 999'*\n• 📊 **Tax & Reports:** *'Show this month GST summary'*",
  };
}
