import { Subscriber } from "./Subscriber.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSubscriberWelcomeEmail, sendAdminNewSubscriberNotification } from "../../utils/mailer.js";

/**
 * @desc Subscribe to newsletter (Public)
 * @route POST /api/v1/subscribers/subscribe
 */
export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, message: "Email address is required." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ success: false, message: "Please provide a valid email address." });
  }

  // Check if subscriber already exists
  let subscriber = await Subscriber.findOne({ email: cleanEmail });

  if (subscriber) {
    if (subscriber.status === "active") {
      // Already active, resend welcome email if not yet sent
      if (!subscriber.welcomeEmailSent) {
        try {
          await sendSubscriberWelcomeEmail(cleanEmail, subscriber.couponCode || "WELCOME15", subscriber.discountPercent || 15);
          subscriber.welcomeEmailSent = true;
          await subscriber.save();
        } catch (e) {
          console.warn("Resending welcome email failed:", e.message);
        }
      }
      return res.status(200).json(
        new ApiResponse(200, subscriber, "You are already a VIP subscriber! Use coupon code WELCOME15 at checkout for 15% OFF.")
      );
    } else {
      // Re-activate previously unsubscribed user
      subscriber.status = "active";
      subscriber.subscribedAt = new Date();
      await subscriber.save();

      try {
        await sendSubscriberWelcomeEmail(cleanEmail, "WELCOME15", 15);
        subscriber.welcomeEmailSent = true;
        await subscriber.save();
      } catch (e) {
        console.warn("Sending welcome email failed:", e.message);
      }

      return res.status(200).json(
        new ApiResponse(200, subscriber, "Welcome back! Your VIP subscription has been re-activated and a 15% OFF coupon was sent to your email.")
      );
    }
  }

  // Create new subscriber document
  subscriber = await Subscriber.create({
    email: cleanEmail,
    status: "active",
    couponCode: "WELCOME15",
    discountPercent: 15,
    source: "Homepage VIP Newsletter",
    welcomeEmailSent: false,
    subscribedAt: new Date(),
  });

  // Attempt to dispatch Welcome Email
  try {
    await sendSubscriberWelcomeEmail(cleanEmail, "WELCOME15", 15);
    subscriber.welcomeEmailSent = true;
    await subscriber.save();
  } catch (err) {
    console.warn("Welcome email dispatch failed (SMTP may not be configured):", err.message);
  }

  // Attempt to notify Admin
  try {
    const totalCount = await Subscriber.countDocuments({ status: "active" });
    await sendAdminNewSubscriberNotification(cleanEmail, totalCount);
  } catch (err) {
    console.warn("Admin notification dispatch failed:", err.message);
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      subscriber,
      "🎉 Welcome to the VIP Club! We've sent your 15% OFF coupon code (WELCOME15) to your email."
    )
  );
});

/**
 * @desc Get all subscribers with pagination & search (Admin)
 * @route GET /api/v1/subscribers
 */
export const getAllSubscribers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search ? req.query.search.trim() : "";
  const status = req.query.status || "";

  const query = {};
  if (search) {
    query.email = { $regex: search, $options: "i" };
  }
  if (status) {
    query.status = status;
  }

  const total = await Subscriber.countDocuments(query);
  const subscribers = await Subscriber.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const totalActive = await Subscriber.countDocuments({ status: "active" });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        subscribers,
        total,
        totalActive,
        pages: Math.ceil(total / limit) || 1,
        page,
      },
      "Subscribers retrieved successfully"
    )
  );
});

/**
 * @desc Delete subscriber by ID (Admin)
 * @route DELETE /api/v1/subscribers/:id
 */
export const deleteSubscriber = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const subscriber = await Subscriber.findByIdAndDelete(id);

  if (!subscriber) {
    return res.status(404).json({ success: false, message: "Subscriber not found" });
  }

  return res.status(200).json(new ApiResponse(200, null, "Subscriber deleted successfully"));
});

/**
 * @desc Export all active subscriber emails (Admin)
 * @route GET /api/v1/subscribers/export
 */
export const exportSubscribers = asyncHandler(async (req, res) => {
  const subscribers = await Subscriber.find({ status: "active" }).select("email createdAt").lean();
  const emails = subscribers.map((s) => s.email);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        emails,
        total: emails.length,
        csvString: emails.join(", "),
      },
      "Subscriber emails exported successfully"
    )
  );
});
