/**
 * Pincode delivery estimation & COD checker service
 */

const METRO_PREFIXES = ["11", "12", "20", "40", "41", "56", "60", "70", "50", "38"];

export function checkPincodeDelivery(pincode) {
  const cleanPin = String(pincode || "").trim();
  if (!/^\d{6}$/.test(cleanPin)) {
    return {
      valid: false,
      message: "Please enter a valid 6-digit Indian PIN code",
    };
  }

  const prefix = cleanPin.slice(0, 2);
  const isMetro = METRO_PREFIXES.includes(prefix);
  const daysToAdd = isMetro ? 2 : 4;

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);

  // If lands on Sunday, add 1 day
  if (deliveryDate.getDay() === 0) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
  }

  const options = { weekday: "short", day: "numeric", month: "short" };
  const formattedDate = deliveryDate.toLocaleDateString("en-IN", options);

  // Save in localStorage for persistence across pages
  try {
    localStorage.setItem("novastore_saved_pincode", cleanPin);
  } catch (e) {}

  return {
    valid: true,
    pincode: cleanPin,
    isMetro,
    estimatedDate: formattedDate,
    days: daysToAdd,
    codAvailable: true,
    freeDelivery: true,
    message: `Fast Delivery by ${formattedDate}`,
  };
}

export function getSavedPincode() {
  try {
    return localStorage.getItem("novastore_saved_pincode") || "";
  } catch {
    return "";
  }
}
