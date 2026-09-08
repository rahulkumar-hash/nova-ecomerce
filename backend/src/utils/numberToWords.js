const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function convertBelowThousand(num) {
  let str = "";
  if (num >= 100) {
    str += ones[Math.floor(num / 100)] + " Hundred ";
    num %= 100;
  }
  if (num >= 20) {
    str += tens[Math.floor(num / 10)] + " ";
    num %= 10;
  }
  if (num > 0) {
    str += ones[num] + " ";
  }
  return str.trim();
}

/**
 * Converts a positive number to Indian Currency Words
 * e.g., 3499 -> "Rupees Three Thousand Four Hundred Ninety Nine Only"
 */
export function numberToWordsIndian(num) {
  const integerPart = Math.floor(Math.abs(Number(num) || 0));
  if (integerPart === 0) return "Rupees Zero Only";

  const crore = Math.floor(integerPart / 10000000);
  const lakh = Math.floor((integerPart % 10000000) / 100000);
  const thousand = Math.floor((integerPart % 100000) / 1000);
  const remainder = integerPart % 1000;

  let result = "";

  if (crore > 0) {
    result += convertBelowThousand(crore) + " Crore ";
  }
  if (lakh > 0) {
    result += convertBelowThousand(lakh) + " Lakh ";
  }
  if (thousand > 0) {
    result += convertBelowThousand(thousand) + " Thousand ";
  }
  if (remainder > 0) {
    result += convertBelowThousand(remainder) + " ";
  }

  return `Rupees ${result.trim()} Only`;
}
