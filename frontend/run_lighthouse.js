import { execSync } from "child_process";
import fs from "fs";

process.env.CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function runAudits() {
  console.log("=== 1. Running Lighthouse Desktop Audit on http://localhost:4173 ===");
  try {
    const desktopCmd = `npx lighthouse http://localhost:4173 --output=json --output-path=lighthouse-desktop.json --chrome-flags="--headless=new --no-sandbox" --preset=desktop --quiet`;
    execSync(desktopCmd, { stdio: "inherit", env: process.env });
    console.log("Desktop audit finished! Reading scores...");
    if (fs.existsSync("lighthouse-desktop.json")) {
      const report = JSON.parse(fs.readFileSync("lighthouse-desktop.json", "utf8"));
      const categories = report.categories || {};
      console.log("DESKTOP SCORES:");
      console.log("Performance:", (categories.performance?.score * 100).toFixed(0));
      console.log("Accessibility:", (categories.accessibility?.score * 100).toFixed(0));
      console.log("Best Practices:", (categories["best-practices"]?.score * 100).toFixed(0));
      console.log("SEO:", (categories.seo?.score * 100).toFixed(0));
    }
  } catch (err) {
    console.error("Desktop audit error:", err.message);
  }

  console.log("\n=== 2. Running Lighthouse Mobile Audit on http://localhost:4173 ===");
  try {
    const mobileCmd = `npx lighthouse http://localhost:4173 --output=json --output-path=lighthouse-mobile.json --chrome-flags="--headless=new --no-sandbox" --form-factor=mobile --screenEmulation.mobile=true --quiet`;
    execSync(mobileCmd, { stdio: "inherit", env: process.env });
    console.log("Mobile audit finished! Reading scores...");
    if (fs.existsSync("lighthouse-mobile.json")) {
      const report = JSON.parse(fs.readFileSync("lighthouse-mobile.json", "utf8"));
      const categories = report.categories || {};
      console.log("MOBILE SCORES:");
      console.log("Performance:", (categories.performance?.score * 100).toFixed(0));
      console.log("Accessibility:", (categories.accessibility?.score * 100).toFixed(0));
      console.log("Best Practices:", (categories["best-practices"]?.score * 100).toFixed(0));
      console.log("SEO:", (categories.seo?.score * 100).toFixed(0));
    }
  } catch (err) {
    console.error("Mobile audit error:", err.message);
  }
}

runAudits();
