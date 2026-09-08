import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../modules/auth/user.modal.js";
import { Admin } from "../modules/admin/admin.modal.js";
import { Setting } from "../modules/Setting/Setting.model.js";
import { Category } from "../modules/category/category.modal.js";
import { Product } from "../modules/products/product.modal.js";
import { Banner } from "../modules/Banner/banner.modal.js";
import { Coupon } from "../modules/coupon/coupon.model.js";
import { Review } from "../modules/Reviews/review.modal.js";
import { Order } from "../modules/Order/order.model.js";

const seed = async () => {
  try {
    await connectDB();
    console.log("🌱 Clearing old database records...");

    await Promise.all([
      User.deleteMany({}),
      Admin.deleteMany({}),
      Setting.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Banner.deleteMany({}),
      Coupon.deleteMany({}),
      Review.deleteMany({}),
      Order.deleteMany({}),
    ]);

    console.log("✨ Seeding Settings...");
    const setting = await Setting.create({
      storeName: "NovaStore",
      tagline: "Your Ultimate Multi-Category Destination",
      logo: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80",
      theme: {
        primaryColor: "#6366f1", // Indigo
        primaryHover: "#4f46e5",
        primaryLight: "#e0e7ff",
        secondaryColor: "#06b6d4",
        accentColor: "#f59e0b",
        preset: "indigo",
        fontFamily: "Inter, sans-serif",
        borderRadius: "rounded-xl",
      },
      announcementBar: {
        enabled: true,
        text: "⚡ Special Launch Offer: Get Flat 15% OFF on your first order! Use Code: WELCOME15",
        link: "/shop",
        bgColor: "#4338ca",
        textColor: "#ffffff",
      },
      currency: { symbol: "₹", code: "INR" },
      shipping: {
        freeShippingThreshold: 999,
        standardShippingFee: 49,
        expressShippingFee: 119,
      },
      tax: { taxPercentage: 5, taxIncludedInPrice: false },
      contact: {
        email: "support@novastore.com",
        phone: "+91 98765 43210",
        address: "101, Tech Avenue, Silicon City, Bangalore, India",
      },
    });

    console.log("👤 Seeding Admin & Users...");
    const admin = await Admin.create({
      name: "Rahul Super Admin",
      email: "admin@ecomstore.com",
      password: "Admin@123456",
      role: "superadmin",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      isActive: true,
    });

    const user = await User.create({
      name: "John Doe",
      email: "customer@ecomstore.com",
      password: "Customer@123456",
      phone: "+91 98765 12345",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      addresses: [
        {
          name: "John Doe",
          phone: "+91 98765 12345",
          street: "Flat 402, Sunshine Heights, MG Road",
          landmark: "Near City Mall",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
          country: "India",
          addressType: "home",
          isDefault: true,
        },
      ],
    });

    console.log("📂 Seeding Categories...");
    const catElectronics = await Category.create({
      name: "Electronics & Gadgets",
      slug: "electronics",
      description: "Cutting-edge smartphones, audio gear, and accessories",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&auto=format&fit=crop&q=80",
      icon: "Smartphone",
      isFeatured: true,
      displayOrder: 1,
    });

    const catFashion = await Category.create({
      name: "Clothing & Apparel",
      slug: "fashion",
      description: "Trendsetting fashion, premium hoodies, and stylish shirts",
      image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80",
      icon: "Shirt",
      isFeatured: true,
      displayOrder: 2,
    });

    const catFootwear = await Category.create({
      name: "Footwear & Shoes",
      slug: "footwear",
      description: "Performance sneakers, athletic runners, and formal shoes",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
      icon: "Footprints",
      isFeatured: true,
      displayOrder: 3,
    });

    const catAccessories = await Category.create({
      name: "Accessories & Lifestyle",
      slug: "accessories",
      description: "Wallets, watches, smart bottles, and everyday carry",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
      icon: "Watch",
      isFeatured: true,
      displayOrder: 4,
    });

    console.log("🛍️ Seeding Products (with and without variants)...");

    // 1. Variant Product: Smartphone
    const prodPhone = await Product.create({
      name: "Apex Phone 16 Pro Max",
      slug: "apex-phone-16-pro-max",
      shortDescription: "Ultra-fast 3nm processor, Aerospace Titanium build, 48MP Pro Camera System.",
      description: `
        <h3>Revolutionary Performance & Cinematic Imagery</h3>
        <p>The Apex Phone 16 Pro Max introduces groundbreaking power with our custom 3nm neural engine, a stunning 6.9-inch Super Retina OLED display with 120Hz ProMotion, and unmatched battery longevity.</p>
        <h4>Key Features:</h4>
        <ul>
          <li>Aerospace-Grade Grade 5 Titanium frame with textured matte back glass</li>
          <li>Triple lens system: 48MP Main, 48MP Ultra Wide, and 5x Telephoto zoom</li>
          <li>Customizable Action Button and Camera Control capacitive key</li>
          <li>USB-C 3.2 with high-speed data transfer and 4K ProRes recording</li>
        </ul>
      `,
      category: catElectronics._id,
      brand: "ApexTech",
      tags: ["smartphone", "flagship", "5g", "electronics", "pro"],
      images: [
        "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80",
      ],
      thumbnail: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
      hasVariants: true,
      attributeOptions: [
        { name: "Color", values: ["Titanium Black", "Natural Silver", "Desert Gold"] },
        { name: "Storage", values: ["256GB", "512GB", "1TB"] },
      ],
      variants: [
        {
          sku: "APEX-16-BLK-256",
          title: "Titanium Black / 256GB",
          attributes: [
            { name: "Color", value: "Titanium Black" },
            { name: "Storage", value: "256GB" },
          ],
          price: 119999,
          mrp: 134999,
          stock: 25,
          image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
        },
        {
          sku: "APEX-16-BLK-512",
          title: "Titanium Black / 512GB",
          attributes: [
            { name: "Color", value: "Titanium Black" },
            { name: "Storage", value: "512GB" },
          ],
          price: 139999,
          mrp: 154999,
          stock: 18,
          image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
        },
        {
          sku: "APEX-16-SLV-256",
          title: "Natural Silver / 256GB",
          attributes: [
            { name: "Color", value: "Natural Silver" },
            { name: "Storage", value: "256GB" },
          ],
          price: 119999,
          mrp: 134999,
          stock: 30,
          image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80",
        },
        {
          sku: "APEX-16-GLD-512",
          title: "Desert Gold / 512GB",
          attributes: [
            { name: "Color", value: "Desert Gold" },
            { name: "Storage", value: "512GB" },
          ],
          price: 139999,
          mrp: 154999,
          stock: 12,
          image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80",
        },
      ],
      specifications: [
        { key: "Display", value: "6.9-inch Super Retina OLED 120Hz" },
        { key: "Processor", value: "A18 Pro Hexa-Core 3nm" },
        { key: "Camera", value: "48MP Main + 48MP Ultra-wide + 12MP 5x Telephoto" },
        { key: "Battery", value: "4685 mAh with 30W Fast Charge & MagSafe" },
        { key: "Warranty", value: "1 Year Manufacturer Comprehensive Warranty" },
      ],
      isFeatured: true,
      isTrending: true,
      isBestSeller: true,
      rating: 4.9,
      reviewsCount: 128,
    });

    // 2. Variant Product: Wireless Headphones
    const prodHeadphones = await Product.create({
      name: "SoundPulse ANC Wireless Headphones",
      slug: "soundpulse-anc-wireless-headphones",
      shortDescription: "Active Noise Cancellation, Hi-Res Audio, 50-Hour Playtime, Ultra-Plush Memory Cushions.",
      description: `
        <p>Immerse yourself in breathtaking studio-grade acoustics. The SoundPulse ANC delivers hybrid active noise cancelling, custom 40mm beryllium drivers, and ultra-low latency spatial audio.</p>
      `,
      category: catElectronics._id,
      brand: "SoundPulse",
      tags: ["audio", "headphones", "bluetooth", "anc", "music"],
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80",
      ],
      thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
      hasVariants: true,
      attributeOptions: [
        { name: "Color", values: ["Matte Black", "Pearl White", "Navy Blue"] },
      ],
      variants: [
        {
          sku: "SP-ANC-BLK",
          title: "Matte Black",
          attributes: [{ name: "Color", value: "Matte Black" }],
          price: 6999,
          mrp: 11999,
          stock: 45,
          image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
        },
        {
          sku: "SP-ANC-WHT",
          title: "Pearl White",
          attributes: [{ name: "Color", value: "Pearl White" }],
          price: 6999,
          mrp: 11999,
          stock: 35,
          image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80",
        },
        {
          sku: "SP-ANC-BLU",
          title: "Navy Blue",
          attributes: [{ name: "Color", value: "Navy Blue" }],
          price: 7499,
          mrp: 12999,
          stock: 20,
          image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
        },
      ],
      specifications: [
        { key: "Driver Size", value: "40mm Beryllium High-Resolution Drivers" },
        { key: "Battery Life", value: "Up to 50 Hours (ANC On: 38 Hours)" },
        { key: "Connectivity", value: "Bluetooth 5.4 + 3.5mm Aux Lossless" },
        { key: "Charging", value: "Fast USB-C (10 mins charge = 5 hours play)" },
      ],
      isFeatured: true,
      isTrending: true,
      rating: 4.8,
      reviewsCount: 84,
    });

    // 3. Variant Product: Heavyweight Hoodie
    const prodHoodie = await Product.create({
      name: "UrbanAura 450 GSM Oversized Heavyweight Hoodie",
      slug: "urbanaura-450gsm-oversized-hoodie",
      shortDescription: "Ultra-comfy 450 GSM French Terry Cotton, dropped shoulders, double-layered hood.",
      description: `
        <p>Crafted from 100% sustainable combed cotton, the UrbanAura Heavyweight Hoodie provides unmatched warmth, silhouette structure, and pre-shrunk durability for effortless streetwear aesthetics.</p>
      `,
      category: catFashion._id,
      brand: "UrbanAura",
      tags: ["hoodie", "streetwear", "fashion", "cotton", "winter"],
      images: [
        "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80",
      ],
      thumbnail: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
      hasVariants: true,
      attributeOptions: [
        { name: "Size", values: ["S", "M", "L", "XL"] },
        { name: "Color", values: ["Vintage Charcoal", "Sage Green", "Warm Sand"] },
      ],
      variants: [
        {
          sku: "UA-HD-BLK-M",
          title: "Vintage Charcoal / M",
          attributes: [
            { name: "Color", value: "Vintage Charcoal" },
            { name: "Size", value: "M" },
          ],
          price: 2499,
          mrp: 3999,
          stock: 40,
          image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
        },
        {
          sku: "UA-HD-BLK-L",
          title: "Vintage Charcoal / L",
          attributes: [
            { name: "Color", value: "Vintage Charcoal" },
            { name: "Size", value: "L" },
          ],
          price: 2499,
          mrp: 3999,
          stock: 50,
          image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
        },
        {
          sku: "UA-HD-GRN-M",
          title: "Sage Green / M",
          attributes: [
            { name: "Color", value: "Sage Green" },
            { name: "Size", value: "M" },
          ],
          price: 2699,
          mrp: 4199,
          stock: 30,
          image: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80",
        },
        {
          sku: "UA-HD-GRN-L",
          title: "Sage Green / L",
          attributes: [
            { name: "Color", value: "Sage Green" },
            { name: "Size", value: "L" },
          ],
          price: 2699,
          mrp: 4199,
          stock: 25,
          image: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80",
        },
      ],
      specifications: [
        { key: "Fabric", value: "100% Combed Heavyweight French Terry Cotton (450 GSM)" },
        { key: "Fit", value: "Relaxed Oversized Boxy Fit" },
        { key: "Care", value: "Machine wash cold, inside out, tumble dry low" },
      ],
      isFeatured: true,
      isBestSeller: true,
      rating: 4.7,
      reviewsCount: 92,
    });

    // 4. Variant Product: Performance Running Shoes
    const prodShoes = await Product.create({
      name: "StratoFlow Pro Carbon Plated Running Shoes",
      slug: "stratoflow-pro-carbon-running-shoes",
      shortDescription: "Full-length carbon fiber propulsion plate, responsive supercritical foam midsole, breathable mesh.",
      description: `
        <p>Engineered for marathoners and everyday sprinters alike. The StratoFlow Pro delivers 85% energy return, aerodynamic heel counter, and Continental rubber grip for all weather traction.</p>
      `,
      category: catFootwear._id,
      brand: "StratoAthletics",
      tags: ["shoes", "running", "sneakers", "sports", "footwear"],
      images: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80",
      ],
      thumbnail: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
      hasVariants: true,
      attributeOptions: [
        { name: "Size", values: ["UK 7", "UK 8", "UK 9", "UK 10", "UK 11"] },
        { name: "Color", values: ["Inferno Crimson", "Phantom Black"] },
      ],
      variants: [
        {
          sku: "SF-CRIM-8",
          title: "Inferno Crimson / UK 8",
          attributes: [
            { name: "Color", value: "Inferno Crimson" },
            { name: "Size", value: "UK 8" },
          ],
          price: 5499,
          mrp: 8999,
          stock: 20,
          image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
        },
        {
          sku: "SF-CRIM-9",
          title: "Inferno Crimson / UK 9",
          attributes: [
            { name: "Color", value: "Inferno Crimson" },
            { name: "Size", value: "UK 9" },
          ],
          price: 5499,
          mrp: 8999,
          stock: 28,
          image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
        },
        {
          sku: "SF-BLK-9",
          title: "Phantom Black / UK 9",
          attributes: [
            { name: "Color", value: "Phantom Black" },
            { name: "Size", value: "UK 9" },
          ],
          price: 5699,
          mrp: 9299,
          stock: 35,
          image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80",
        },
      ],
      specifications: [
        { key: "Midsole", value: "Supercritical PEBA Foam + 3D Carbon Fiber Plate" },
        { key: "Weight", value: "210 grams (UK 9)" },
        { key: "Drop", value: "8mm heel-to-toe offset" },
      ],
      isTrending: true,
      rating: 4.9,
      reviewsCount: 65,
    });

    // 5. Simple Product (WITHOUT Variants): 65W GaN Charger
    const prodCharger = await Product.create({
      name: "VoltMaster 65W Dual Port GaN III Fast Charger",
      slug: "voltmaster-65w-dual-port-gan-charger",
      shortDescription: "Ultra-compact Gallium Nitride (GaN) fast charger for MacBooks, iPhones, Galaxy & laptops.",
      description: `
        <p>Charge up to 3x faster while reducing charger size by 50%. The VoltMaster 65W GaN III utilizes dynamic power distribution to rapidly charge laptops, tablets, and phones safely with smart temperature monitoring.</p>
      `,
      category: catElectronics._id,
      brand: "VoltMaster",
      tags: ["charger", "gan", "fast-charging", "electronics", "accessories"],
      images: [
        "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=800&auto=format&fit=crop&q=80",
      ],
      thumbnail: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80",
      hasVariants: false,
      price: 1499,
      mrp: 2499,
      discountType: "percentage",
      discountValue: 40,
      stock: 120,
      sku: "VM-GAN-65W",
      specifications: [
        { key: "Output Power", value: "65W Max (USB-C1 + USB-C2 + USB-A)" },
        { key: "Technology", value: "GaN III (Gallium Nitride) Semiconductor" },
        { key: "Safety", value: "Overvoltage, Overcurrent, Short-circuit & Temperature Protections" },
        { key: "Compatibility", value: "PD 3.0, QC 4+, PPS, Apple 2.4A, Samsung Super Fast" },
      ],
      isFeatured: true,
      isNewArrival: true,
      rating: 4.8,
      reviewsCount: 114,
    });

    // 6. Simple Product (WITHOUT Variants): Smart Water Bottle
    const prodBottle = await Product.create({
      name: "HydroPure 750ml Smart Thermal Bottle with LED Temp Display",
      slug: "hydropure-750ml-smart-thermal-bottle",
      shortDescription: "Double-wall vacuum insulated 316 surgical stainless steel, 24h cold / 12h hot, touch temperature cap.",
      description: `
        <p>Stay hydrated intelligently. The HydroPure Smart Thermal Bottle keeps your favorite beverages at optimal temperatures while displaying real-time water temp with an intuitive touch OLED lid.</p>
      `,
      category: catAccessories._id,
      brand: "HydroPure",
      tags: ["bottle", "smart", "lifestyle", "fitness", "accessories"],
      images: [
        "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80",
      ],
      thumbnail: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80",
      hasVariants: false,
      price: 1199,
      mrp: 1999,
      discountType: "percentage",
      discountValue: 40,
      stock: 80,
      sku: "HP-BTL-750",
      specifications: [
        { key: "Material", value: "Grade 316 Medical Stainless Steel (BPA Free)" },
        { key: "Capacity", value: "750 ml (25.3 oz)" },
        { key: "Insulation", value: "24 Hours Cold / 12 Hours Hot" },
        { key: "Battery Life", value: "500 Days without charging (CR2450 replaceable)" },
      ],
      isFeatured: true,
      rating: 4.6,
      reviewsCount: 42,
    });

    // 7. Simple Product (WITHOUT Variants): Minimalist Leather Wallet
    const prodWallet = await Product.create({
      name: "Apex Vanguard RFID-Blocking Slim Leather Wallet",
      slug: "apex-vanguard-rfid-slim-leather-wallet",
      shortDescription: "Full-grain Italian cowhide, holds 10 cards + cash, RFID skimming protection.",
      description: `
        <p>Sleek, sophisticated, and built for modern everyday carry. Handcrafted from vegetable-tanned Italian leather with military-grade RFID signal blocking lining.</p>
      `,
      category: catAccessories._id,
      brand: "Vanguard",
      tags: ["wallet", "leather", "accessories", "rfid", "mens"],
      images: [
        "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80",
      ],
      thumbnail: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80",
      hasVariants: false,
      price: 899,
      mrp: 1599,
      discountType: "percentage",
      discountValue: 43,
      stock: 95,
      sku: "VG-WLT-SLM",
      specifications: [
        { key: "Leather Type", value: "100% Full-Grain Vegetable-Tanned Italian Leather" },
        { key: "Card Capacity", value: "Up to 10 cards + Quick-Access Pull Tab" },
        { key: "Security", value: "Certified 13.56 MHz RFID Shielding" },
      ],
      isBestSeller: true,
      rating: 4.9,
      reviewsCount: 78,
    });

    console.log("🎨 Seeding Banners...");
    await Banner.create([
      {
        title: "The Future of Tech is Here",
        subtitle: "Experience next-gen speed with Apex Phone 16 Pro Max",
        tag: "FLAGSHIP LAUNCH",
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&auto=format&fit=crop&q=80",
        link: `/product/${prodPhone.slug}`,
        buttonText: "Explore Flagship",
        type: "hero_slider",
        position: 1,
        isActive: true,
        badgeColor: "#6366f1",
      },
      {
        title: "Autumn Streetwear Collection",
        subtitle: "Premium 450 GSM Heavyweight Hoodies & Apparel",
        tag: "FRESH DROPS",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80",
        link: "/shop?category=fashion",
        buttonText: "Shop Collection",
        type: "hero_slider",
        position: 2,
        isActive: true,
        badgeColor: "#10b981",
      },
      {
        title: "Pro Sound. Zero Distractions.",
        subtitle: "Hybrid Active Noise Cancelling with 50-hour battery life",
        tag: "HOT DEAL",
        image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1600&auto=format&fit=crop&q=80",
        link: `/product/${prodHeadphones.slug}`,
        buttonText: "Get SoundPulse",
        type: "hero_slider",
        position: 3,
        isActive: true,
        badgeColor: "#f59e0b",
      },
    ]);

    console.log("🎟️ Seeding Coupons...");
    const coupon1 = await Coupon.create({
      code: "WELCOME15",
      description: "Get 15% OFF on your first purchase",
      discountType: "percentage",
      discountValue: 15,
      minOrderAmount: 499,
      maxDiscountAmount: 1500,
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      usageLimit: 5000,
      isActive: true,
    });

    const coupon2 = await Coupon.create({
      code: "FLAT500",
      description: "Flat ₹500 OFF on orders above ₹2,999",
      discountType: "fixed",
      discountValue: 500,
      minOrderAmount: 2999,
      expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      usageLimit: 1000,
      isActive: true,
    });

    console.log("⭐ Seeding Reviews...");
    await Review.create([
      {
        product: prodPhone._id,
        user: user._id,
        userName: "Aman Sharma",
        rating: 5,
        title: "Insane camera and battery life!",
        comment: "The titanium build feels so light and premium in hand. The 5x optical zoom is crisp even in low light.",
      },
      {
        product: prodHeadphones._id,
        user: user._id,
        userName: "Priya Patel",
        rating: 5,
        title: "Best ANC for the price point",
        comment: "Cancels out flight and office noise completely. Sound profile is rich with punchy bass.",
      },
      {
        product: prodHoodie._id,
        user: user._id,
        userName: "Vikram Mehta",
        rating: 5,
        title: "Super thick and structured fit",
        comment: "450 GSM is legit heavyweight. The hood holds its shape perfectly and it didn't shrink after wash.",
      },
    ]);

    console.log("📦 Seeding Sample Completed Order...");
    await Order.create({
      orderNumber: "ORD-982341-7891",
      invoiceNumber: "INV-982341-7891",
      user: user._id,
      customerInfo: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      items: [
        {
          product: prodHeadphones._id,
          variantId: prodHeadphones.variants[0]._id.toString(),
          variantTitle: "Matte Black",
          attributes: [{ name: "Color", value: "Matte Black" }],
          name: prodHeadphones.name,
          image: prodHeadphones.variants[0].image,
          price: 6999,
          mrp: 11999,
          quantity: 1,
          total: 6999,
        },
        {
          product: prodCharger._id,
          name: prodCharger.name,
          image: prodCharger.thumbnail,
          price: 1499,
          mrp: 2499,
          quantity: 1,
          total: 1499,
        },
      ],
      shippingAddress: user.addresses[0],
      paymentInfo: {
        method: "Online Payment",
        status: "Completed",
        transactionId: "TXN-DEMO-981249",
        paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      pricing: {
        subtotal: 8498,
        discount: 500,
        couponCode: "FLAT500",
        shippingFee: 0,
        tax: 400,
        totalAmount: 8398,
      },
      totalAmount: 8398,
      orderStatus: "Delivered",
      deliveryOption: "standard",
      tracking: {
        carrier: "BlueDart Express",
        trackingNumber: "BD-88931245",
        estDeliveryDate: new Date(),
        history: [
          { status: "Confirmed", note: "Order placed successfully", location: "Online Portal", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          { status: "Processing", note: "Packed at central warehouse", location: "Bangalore Hub", timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000) },
          { status: "Shipped", note: "In transit with BlueDart", location: "Bangalore Sorting Center", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
          { status: "Out for Delivery", note: "Out for delivery with courier agent", location: "Local Delivery Facility", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
          { status: "Delivered", note: "Package delivered to customer", location: "Customer Address", timestamp: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000) },
        ],
      },
    });

    console.log("✅ Seed completed successfully!");
    console.log("-----------------------------------------");
    console.log("Admin Login: admin@ecomstore.com / Admin@123456");
    console.log("User Login:  customer@ecomstore.com / Customer@123456");
    console.log("-----------------------------------------");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seed();
