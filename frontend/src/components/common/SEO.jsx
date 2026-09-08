import { useEffect } from "react";

/**
 * Enterprise SEO & Structured Data Manager
 * Updates document.title, meta tags, and injects Schema.org JSON-LD dynamically.
 */
export default function SEO({
  title,
  description,
  image,
  url,
  type = "website",
  product = null,
  breadcrumbs = null,
  noIndex = false,
}) {
  const defaultTitle = "NovaStore | Premium Multi-Category Shopping";
  const defaultDescription =
    "Discover premium electronics, modern fashion, footwear, and lifestyle essentials with lightning-fast delivery and verified security.";
  const defaultImage =
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=630&fit=crop";
  const siteUrl = "https://novastore.com";

  const fullTitle = title ? `${title} | NovaStore` : defaultTitle;
  const metaDesc = description || defaultDescription;
  const metaImage = image || defaultImage;
  const canonicalUrl = url ? (url.startsWith("http") ? url : `${siteUrl}${url}`) : window.location.href;

  useEffect(() => {
    // 1. Update Title
    document.title = fullTitle;

    // 2. Helper to set meta attribute
    const setMeta = (attr, key, val) => {
      let elem = document.querySelector(`meta[${attr}="${key}"]`);
      if (!elem) {
        elem = document.createElement("meta");
        elem.setAttribute(attr, key);
        document.head.appendChild(elem);
      }
      elem.setAttribute("content", val);
    };

    setMeta("name", "description", metaDesc);
    setMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large");
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", metaDesc);
    setMeta("property", "og:image", metaImage);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:type", type);
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", metaDesc);
    setMeta("name", "twitter:image", metaImage);

    // 3. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);

    // 4. Schema.org JSON-LD injection
    const scriptId = "dynamic-seo-jsonld";
    let scriptElem = document.getElementById(scriptId);

    const schemaItems = [];

    // Product Schema
    if (product) {
      schemaItems.push({
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        image: Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.thumbnail || metaImage],
        description: product.description || metaDesc,
        sku: product.sku || `SKU-${product._id}`,
        brand: {
          "@type": "Brand",
          name: product.brand || "NovaStore",
        },
        offers: {
          "@type": "Offer",
          url: canonicalUrl,
          priceCurrency: "INR",
          price: product.price,
          priceValidUntil: "2027-12-31",
          availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: product.rating || "4.8",
          reviewCount: product.numReviews || 12,
        },
      });
    }

    // Breadcrumbs Schema
    if (breadcrumbs && Array.isArray(breadcrumbs)) {
      schemaItems.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((b, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: b.name,
          item: b.url.startsWith("http") ? b.url : `${siteUrl}${b.url}`,
        })),
      });
    }

    if (schemaItems.length > 0) {
      if (!scriptElem) {
        scriptElem = document.createElement("script");
        scriptElem.id = scriptId;
        scriptElem.type = "application/ld+json";
        document.head.appendChild(scriptElem);
      }
      scriptElem.textContent = JSON.stringify(schemaItems.length === 1 ? schemaItems[0] : schemaItems);
    } else if (scriptElem) {
      scriptElem.remove();
    }

    return () => {
      // Clean up script on unmount
      const s = document.getElementById(scriptId);
      if (s) s.remove();
    };
  }, [fullTitle, metaDesc, metaImage, canonicalUrl, type, product, breadcrumbs, noIndex]);

  return null;
}
