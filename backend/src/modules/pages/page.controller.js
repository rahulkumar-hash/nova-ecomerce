import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Page } from "./page.model.js";

const DEFAULT_PAGES = [
  {
    title: "Privacy Policy",
    slug: "privacy-policy",
    category: "legal",
    excerpt: "Learn how we collect, protect, and handle your personal data and privacy.",
    metaTitle: "Privacy Policy | Transparent Data Protection",
    metaDescription: "Our Privacy Policy outlines how your personal data is collected, used, and secured when shopping on our platform.",
    content: `<h2>1. Information We Collect</h2>
<p>We respect your privacy and are committed to safeguarding your personal data. When you visit or make a purchase on our store, we collect information including your name, email address, shipping and billing address, phone number, and payment transaction details.</p>

<h2>2. How We Use Your Information</h2>
<p>We utilize the collected information to:</p>
<ul>
  <li>Process and fulfill your orders smoothly.</li>
  <li>Send order confirmations, tracking information, and delivery updates.</li>
  <li>Provide responsive customer support and resolve any inquiries.</li>
  <li>Improve our website performance, catalog selection, and user experience.</li>
  <li>Prevent fraud and maintain transaction security.</li>
</ul>

<h2>3. Data Protection and Security</h2>
<p>We implement robust industry-standard SSL 256-bit encryption for all sensitive communication. Payment information is securely tokenized and handled through certified payment gateways. We never store raw credit/debit card numbers on our servers.</p>

<h2>4. Cookies and Tracking</h2>
<p>We use essential cookies to maintain your shopping cart, preserve your login session, and remember your preferences (such as Dark/Light theme). You can modify your browser settings to decline non-essential cookies at any time.</p>

<h2>5. Sharing Information with Third Parties</h2>
<p>We do not sell, rent, or trade your personal information. We only share necessary data with trusted logistics partners (to deliver your parcel) and payment processors (to securely verify transactions).</p>

<h2>6. Contact Us Regarding Your Privacy</h2>
<p>If you have any questions or wish to exercise your data rights (including data deletion requests), please contact our Data Protection Officer at <strong>privacy@novastore.com</strong>.</p>`,
  },
  {
    title: "Terms and Conditions",
    slug: "terms-and-conditions",
    category: "legal",
    excerpt: "Standard terms of service, user rights, and contractual obligations.",
    metaTitle: "Terms & Conditions | User Agreement",
    metaDescription: "Read the terms and conditions governing the use of our website and purchase of products.",
    content: `<h2>1. Introduction & Acceptance</h2>
<p>By accessing or using our ecommerce storefront, you agree to be bound by these Terms and Conditions, our Privacy Policy, and all applicable laws. If you do not agree with any part of these terms, please do not use our services.</p>

<h2>2. Account Registration & Security</h2>
<p>When you create an account on our platform, you are responsible for maintaining the confidentiality of your credentials and password. You agree to accept responsibility for all activities that occur under your account.</p>

<h2>3. Product Pricing & Availability</h2>
<p>All prices are listed in Indian Rupees (INR) and inclusive/exclusive of applicable taxes as indicated at checkout. While we strive for absolute accuracy, in the rare event of a pricing or typographical error, we reserve the right to cancel affected orders prior to dispatch.</p>

<h2>4. Orders & Payment Terms</h2>
<p>Order placement constitutes an offer to purchase. We reserve the right to accept or decline any order. Supported payment options include Cash on Delivery (COD), UPI, Credit/Debit Cards, and Net Banking. Payments must be successfully authorized prior to dispatch for online modes.</p>

<h2>5. Intellectual Property Rights</h2>
<p>All content, branding, UI designs, graphics, and product media are the intellectual property of the store and its licensors. Unauthorized copying or commercial reproduction is strictly prohibited.</p>

<h2>6. Governing Law & Jurisdiction</h2>
<p>These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the courts in Bangalore, India.</p>`,
  },
  {
    title: "Refund & Cancellation Policy",
    slug: "refund-policy",
    category: "legal",
    excerpt: "7-day easy returns, hassle-free pickup, and quick refund timelines.",
    metaTitle: "Refund & Return Policy | 7 Days Easy Returns",
    metaDescription: "Understand our return process, eligibility criteria, and refund timelines.",
    content: `<h2>1. 7-Day Easy Return Guarantee</h2>
<p>We want you to be completely delighted with your purchase. If you receive a damaged, defective, or incorrect product, you can request a return or replacement within <strong>7 days</strong> from the date of delivery.</p>

<h2>2. Return Eligibility Criteria</h2>
<ul>
  <li>The item must be unused, unwashed, and in the original packaging with all brand tags intact.</li>
  <li>Electronic items must include all original accessories, manuals, and warranty cards.</li>
  <li>Intimate apparel, perishable items, and personalized custom goods are non-returnable for hygiene and safety reasons.</li>
</ul>

<h2>3. Return & Doorstep Pickup Process</h2>
<ol>
  <li>Navigate to <strong>My Profile &gt; Orders</strong> and select the order you wish to return.</li>
  <li>Click "Request Return" and choose your reason along with brief photos if damaged.</li>
  <li>Our courier partner will pick up the package from your doorstep within 24-48 hours.</li>
</ol>

<h2>4. Refund Timelines</h2>
<p>Once your returned item arrives at our fulfillment hub and passes quality inspection:</p>
<ul>
  <li><strong>Prepaid Orders (UPI / Card / Net Banking):</strong> Refund is credited directly to your original source account within <strong>3-5 business days</strong>.</li>
  <li><strong>Cash on Delivery (COD):</strong> Refund is transferred to your provided UPI ID or Bank Account via NEFT/IMPS within <strong>2-3 business days</strong> after bank verification.</li>
</ul>

<h2>5. Order Cancellation</h2>
<p>You can cancel any order free of charge from your order history dashboard before it has been dispatched from our warehouse.</p>`,
  },
  {
    title: "Shipping & Delivery Policy",
    slug: "shipping-policy",
    category: "legal",
    excerpt: "Express shipping options, delivery SLAs, and real-time parcel tracking.",
    metaTitle: "Shipping & Delivery Policy | Fast Pan-India Delivery",
    metaDescription: "Information regarding shipping fees, delivery speed, and tracking your packages.",
    content: `<h2>1. Shipping Coverage & Timelines</h2>
<p>We ship across all serviceable pincodes in India. We partner with leading express logistics providers to ensure fast, reliable delivery right to your doorstep.</p>

<h2>2. Delivery Speeds & Charges</h2>
<ul>
  <li><strong>Standard Shipping:</strong> Delivered in <strong>3 to 5 business days</strong>. FREE on all orders above ₹999 (Nominal ₹49 fee for orders below ₹999).</li>
  <li><strong>Express Priority Delivery:</strong> Delivered in <strong>1 to 2 business days</strong> across metro cities for a flat fee of ₹119.</li>
</ul>

<h2>3. Real-Time Order Tracking</h2>
<p>As soon as your package is dispatched, we assign a dedicated tracking number and send real-time tracking links via SMS and Email. You can also view live tracking updates on your <strong>Order Status & Tracking</strong> page.</p>

<h2>4. Delivery Verification & Security</h2>
<p>For high-value electronics and luxury apparel, an OTP (One-Time Password) may be sent to your registered phone number to confirm secure delivery handover.</p>

<h2>5. Undelivered Packages</h2>
<p>Our courier partners will attempt delivery up to 3 times. If delivery is unsuccessful after 3 attempts, the package will return to our hub and a full refund will be processed for prepaid orders.</p>`,
  },
  {
    title: "About Us",
    slug: "about-us",
    category: "company",
    excerpt: "Our story, commitment to quality, and single-vendor ecommerce mission.",
    metaTitle: "About Us | Premium Quality & Customer First",
    metaDescription: "Discover the story behind our brand and our mission to provide genuine, curated products.",
    content: `<h2>Our Story</h2>
<p>Founded with a passion for innovation and elegance, our store is built to provide an elevated single-vendor shopping experience. We bridge the gap between premium international quality and accessible everyday pricing.</p>

<h2>Direct From Source — 100% Authentic</h2>
<p>Unlike crowded multi-seller marketplaces where authenticity can be uncertain, every single product in our catalog is directly sourced, inspected, and quality-certified by our in-house engineering and fashion specialists.</p>

<h2>Our Core Commitments</h2>
<ul>
  <li><strong>Curated Excellence:</strong> Every product goes through stringent 15-point quality checks.</li>
  <li><strong>Lightning Fast Fulfillment:</strong> Automated dispatch hubs enable same-day parcel preparation.</li>
  <li><strong>Customer Centricity:</strong> 24/7 dedicated support with 7-day hassle-free doorstep returns.</li>
  <li><strong>Sustainable Packaging:</strong> 100% recyclable, eco-friendly transit boxes.</li>
</ul>`,
  },
  {
    title: "Frequently Asked Questions (FAQ)",
    slug: "faq",
    category: "support",
    excerpt: "Answers to common questions about orders, payments, shipping, and returns.",
    metaTitle: "FAQs | Frequently Asked Questions & Help",
    metaDescription: "Find fast answers to frequently asked questions about shopping, payments, tracking, and returns.",
    content: `<h2>General Questions</h2>
<p><strong>Q: How do I place an order?</strong><br/>
A: Simply browse our catalog, select your preferred variants (such as Size or Color), click "Add to Cart", and proceed to Checkout where you can enter your address and choose a payment method.</p>

<p><strong>Q: Do I need an account to place an order?</strong><br/>
A: While guest browsing is enabled, creating a free account allows you to track orders in real time, save multiple delivery addresses, and enjoy 1-click checkout.</p>

<h2>Payments & Security</h2>
<p><strong>Q: Which payment methods do you accept?</strong><br/>
A: We support Cash on Delivery (COD), UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, MasterCard, RuPay), and Net Banking across all major banks.</p>

<p><strong>Q: Is my payment information secure?</strong><br/>
A: Yes! All online payments are encrypted with 256-bit SSL protocols and processed through RBI-approved secure payment gateways.</p>

<h2>Shipping & Tracking</h2>
<p><strong>Q: How long does delivery take?</strong><br/>
A: Standard delivery takes 3 to 5 business days. Express shipping delivers within 1 to 2 business days in metro cities.</p>

<p><strong>Q: Can I track my order status?</strong><br/>
A: Yes. You can track your order live from your Profile dashboard under the "My Orders" tab.</p>`,
  },
];

export const seedDefaultPages = async () => {
  for (const page of DEFAULT_PAGES) {
    const exists = await Page.findOne({ slug: page.slug });
    if (!exists) {
      await Page.create(page);
    }
  }
};

export const getAllPages = asyncHandler(async (req, res) => {
  const { category, isPublished } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (isPublished !== undefined) filter.isPublished = isPublished === "true";

  // Auto-seed if database is empty
  const count = await Page.countDocuments();
  if (count === 0) {
    await seedDefaultPages();
  }

  const pages = await Page.find(filter).sort({ category: 1, title: 1 });
  return res.status(200).json(new ApiResponse(200, pages, "Pages fetched successfully"));
});

export const getPageBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  let page = await Page.findOne({ slug: slug.toLowerCase() });

  // Auto seed if not found and matches defaults
  if (!page) {
    const defaultMatch = DEFAULT_PAGES.find((p) => p.slug === slug.toLowerCase());
    if (defaultMatch) {
      page = await Page.create(defaultMatch);
    }
  }

  if (!page) {
    throw new ApiError(404, `Page "${slug}" not found`);
  }

  return res.status(200).json(new ApiResponse(200, page, "Page content fetched"));
});

export const createPage = asyncHandler(async (req, res) => {
  const { title, slug, content, excerpt, category, isPublished, metaTitle, metaDescription } = req.body;

  if (!title || !content) {
    throw new ApiError(400, "Title and content are required");
  }

  const cleanSlug = (slug || title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const existing = await Page.findOne({ slug: cleanSlug });
  if (existing) {
    throw new ApiError(400, "A page with this slug already exists");
  }

  const page = await Page.create({
    title,
    slug: cleanSlug,
    content,
    excerpt: excerpt || "",
    category: category || "custom",
    isPublished: isPublished !== undefined ? isPublished : true,
    metaTitle: metaTitle || title,
    metaDescription: metaDescription || excerpt || "",
    lastUpdatedBy: req.admin?._id,
  });

  return res.status(201).json(new ApiResponse(201, page, "Page created successfully"));
});

export const updatePage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, slug, content, excerpt, category, isPublished, metaTitle, metaDescription } = req.body;

  const page = await Page.findById(id);
  if (!page) {
    throw new ApiError(404, "Page not found");
  }

  if (title) page.title = title;
  if (slug) {
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const duplicate = await Page.findOne({ slug: cleanSlug, _id: { $ne: id } });
    if (duplicate) throw new ApiError(400, "Slug already in use by another page");
    page.slug = cleanSlug;
  }
  if (content !== undefined) page.content = content;
  if (excerpt !== undefined) page.excerpt = excerpt;
  if (category) page.category = category;
  if (isPublished !== undefined) page.isPublished = isPublished;
  if (metaTitle !== undefined) page.metaTitle = metaTitle;
  if (metaDescription !== undefined) page.metaDescription = metaDescription;
  page.lastUpdatedBy = req.admin?._id;

  await page.save();
  return res.status(200).json(new ApiResponse(200, page, "Page updated successfully"));
});

export const resetDefaultPages = asyncHandler(async (req, res) => {
  await seedDefaultPages();
  const pages = await Page.find().sort({ category: 1, title: 1 });
  return res.status(200).json(new ApiResponse(200, pages, "Standard legal policy templates restored"));
});

export const deletePage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = await Page.findByIdAndDelete(id);
  if (!page) {
    throw new ApiError(404, "Page not found");
  }
  return res.status(200).json(new ApiResponse(200, null, "Page deleted successfully"));
});
