package com.novastore.app

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.ColorStateList
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.*
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.novastore.app.databinding.ActivityMainBinding
import org.json.JSONObject
import java.net.URISyntaxException

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var webView: WebView
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private val FILE_CHOOSER_REQUEST = 1001

    private var backPressedTime: Long = 0
    private var currentPrimaryColor = Color.parseColor("#6366F1")
    private var isDarkMode = false

    companion object {
        const val BASE_URL = "https://nova-ecommerce-store-r5ez.onrender.com"
        const val URL_HOME = "$BASE_URL/"
        const val URL_SHOP = "$BASE_URL/shop"
        const val URL_WISHLIST = "$BASE_URL/wishlist"
        const val URL_CART = "$BASE_URL/cart"
        const val URL_PROFILE = "$BASE_URL/profile"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        webView = binding.webView

        // System bars configuration: fitsSystemWindows ensures bottom nav is always fully visible
        WindowCompat.setDecorFitsSystemWindows(window, true)

        updateSystemBars(
            isDark = false,
            statusBarColor = Color.WHITE,
            navBarColor = Color.WHITE
        )

        setupBottomNav()
        setupSwipeRefresh()
        setupWebView()

        // Handle initial intent or deep link
        val targetUrl = intent?.data?.toString() ?: BASE_URL
        webView.loadUrl(targetUrl)
    }

    // ── Bottom Navigation ─────────────────────────────────────────────
    private fun setupBottomNav() {
        binding.bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home     -> navigateTo(URL_HOME)
                R.id.nav_shop     -> navigateTo(URL_SHOP)
                R.id.nav_wishlist -> navigateTo(URL_WISHLIST)
                R.id.nav_cart     -> navigateTo(URL_CART)
                R.id.nav_profile  -> navigateTo(URL_PROFILE)
            }
            true
        }
    }

    private fun navigateTo(url: String) {
        val current = webView.url ?: ""
        if (current != url) {
            webView.loadUrl(url)
        }
    }

    private fun syncBottomNavSelection(url: String?) {
        if (url == null) return
        val cleanUrl = url.split("?")[0].trimEnd('/')
        val baseClean = BASE_URL.trimEnd('/')

        val targetId = when {
            cleanUrl.endsWith("/shop") || cleanUrl.contains("/product/") -> R.id.nav_shop
            cleanUrl.endsWith("/wishlist") -> R.id.nav_wishlist
            cleanUrl.endsWith("/cart") || cleanUrl.endsWith("/checkout") -> R.id.nav_cart
            cleanUrl.endsWith("/profile") || cleanUrl.contains("/order") -> R.id.nav_profile
            cleanUrl == baseClean || cleanUrl.isEmpty() -> R.id.nav_home
            else -> null
        }

        if (targetId != null && binding.bottomNav.selectedItemId != targetId) {
            binding.bottomNav.menu.findItem(targetId)?.isChecked = true
        }
    }

    // ── Swipe-to-Refresh ──────────────────────────────────────────────
    private fun setupSwipeRefresh() {
        binding.swipeRefresh.setColorSchemeColors(currentPrimaryColor)
        binding.swipeRefresh.setOnRefreshListener {
            webView.reload()
        }
    }

    // ── WebView Configuration ─────────────────────────────────────────
    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            useWideViewPort = true
            loadWithOverviewMode = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            userAgentString = "$userAgentString NovaStoreAndroidApp/1.0"
            cacheMode = WebSettings.LOAD_DEFAULT
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false

            // IMPORTANT for Razorpay: Keep popups in the same window so 3D Secure doesn't break
            setSupportMultipleWindows(false)
            javaScriptCanOpenWindowsAutomatically = true
        }

        // Enable Cookies including third-party for Payment Gateways
        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }

        // JS Bridge for Native Features and Theme Synchronization
        webView.addJavascriptInterface(AndroidBridge(), "Android")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                binding.swipeRefresh.isRefreshing = true
                syncBottomNavSelection(url)
                checkThemeFromDOM()
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                binding.swipeRefresh.isRefreshing = false
                injectThemeObserver()
                injectBottomNavSpacing()
                checkThemeFromDOM()
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val uri = request?.url ?: return false
                val url = uri.toString()

                // 1. UPI Payment Links (Google Pay, PhonePe, Paytm, BHIM, Cred, etc.)
                if (url.startsWith("upi:") || url.startsWith("tez:") ||
                    url.startsWith("phonepe:") || url.startsWith("paytmmp:") ||
                    url.startsWith("credpay:") || url.startsWith("bhim:")) {
                    return launchExternalUri(uri)
                }

                // 2. Android Intent URIs (Razorpay UPI fallback intents)
                if (url.startsWith("intent:")) {
                    try {
                        val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                        if (intent != null) {
                            if (packageManager.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY) != null) {
                                startActivity(intent)
                                return true
                            }
                            val fallbackUrl = intent.getStringExtra("browser_fallback_url")
                            if (fallbackUrl != null) {
                                view?.loadUrl(fallbackUrl)
                                return true
                            }
                        }
                    } catch (e: URISyntaxException) {
                        e.printStackTrace()
                    }
                    return true
                }

                // 3. Tel, Mailto, WhatsApp
                if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("whatsapp:")) {
                    return launchExternalUri(uri)
                }

                // 4. Payment Gateway and Bank Verification Domains - ALWAYS load inside WebView!
                if (isPaymentOrBankUrl(url)) {
                    return false
                }

                // 5. Internal Store URLs - stay inside WebView
                if (url.startsWith(BASE_URL) || url.contains("nova-ecommerce")) {
                    return false
                }

                // 6. External non-store links - open in browser
                return launchExternalUri(uri)
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                binding.swipeRefresh.isRefreshing = false
                if (request?.isForMainFrame == true) {
                    showOfflinePage()
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress >= 70) {
                    checkThemeFromDOM()
                }
                if (newProgress >= 90) {
                    binding.swipeRefresh.isRefreshing = false
                }
            }

            // File chooser for image uploads (profile picture, review photos, etc.)
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback
                val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                    type = "image/*"
                }
                try {
                    startActivityForResult(Intent.createChooser(intent, "Choose Picture"), FILE_CHOOSER_REQUEST)
                } catch (e: Exception) {
                    this@MainActivity.filePathCallback = null
                    return false
                }
                return true
            }
        }
    }

    private fun isPaymentOrBankUrl(url: String): Boolean {
        val lower = url.lowercase()
        return lower.contains("razorpay.com") ||
               lower.contains("cashfree.com") ||
               lower.contains("payu.in") ||
               lower.contains("billdesk.com") ||
               lower.contains("bank") ||
               lower.contains("gateway") ||
               lower.contains("checkout") ||
               lower.contains("card") ||
               lower.contains("otp") ||
               lower.contains("secure") ||
               lower.contains("payment")
    }

    private fun launchExternalUri(uri: Uri): Boolean {
        return try {
            val intent = Intent(Intent.ACTION_VIEW, uri)
            startActivity(intent)
            true
        } catch (e: Exception) {
            Toast.makeText(this, "No supported app found for this action.", Toast.LENGTH_SHORT).show()
            false
        }
    }

    // ── Dynamic Theme Synchronization ────────────────────────────────
    private fun checkThemeFromDOM() {
        val script = """
            (function() {
                try {
                    var isDark = document.documentElement.classList.contains('dark') || 
                                 document.body.classList.contains('dark') || 
                                 localStorage.getItem('themeMode') === 'dark';
                    var primary = window.getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#6366F1';
                    return JSON.stringify({ isDark: isDark, primary: primary });
                } catch(e) {
                    return JSON.stringify({ isDark: false, primary: '#6366F1' });
                }
            })()
        """.trimIndent()

        webView.evaluateJavascript(script) { result ->
            if (!result.isNullOrBlank() && result != "null") {
                try {
                    val cleanJson = if (result.startsWith("\"") && result.endsWith("\"")) {
                        result.substring(1, result.length - 1).replace("\\\"", "\"")
                    } else result
                    val json = JSONObject(cleanJson)
                    val isDark = json.optBoolean("isDark", false)
                    val primary = json.optString("primary", "#6366F1")
                    applyDynamicTheme(isDark, primary)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    private fun injectThemeObserver() {
        val js = """
            (function() {
                function syncTheme() {
                    try {
                        var isDark = document.documentElement.classList.contains('dark') || 
                                     document.body.classList.contains('dark') || 
                                     localStorage.getItem('themeMode') === 'dark';
                        var primary = window.getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#6366F1';
                        
                        if (window.Android && window.Android.onThemeChanged) {
                            window.Android.onThemeChanged(isDark, primary);
                        }
                    } catch(e) {}
                }
                
                syncTheme();
                
                // Observe class changes on <html> and <body> for instant dark/light mode toggling
                if (!window.__themeObserverAttached) {
                    window.__themeObserverAttached = true;
                    var observer = new MutationObserver(function() {
                        syncTheme();
                    });
                    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
                    if (document.body) {
                        observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
                    }
                }
            })();
        """.trimIndent()
        webView.evaluateJavascript(js, null)
    }

    private fun injectBottomNavSpacing() {
        // Prevents webpage content from being obscured by bottom nav
        val js = """
            (function() {
                var style = document.getElementById('android-nav-spacing');
                if (!style) {
                    style = document.createElement('style');
                    style.id = 'android-nav-spacing';
                    style.textContent = 'body { padding-bottom: 72px !important; }';
                    document.head.appendChild(style);
                }
            })();
        """.trimIndent()
        webView.evaluateJavascript(js, null)
    }

    private fun applyDynamicTheme(isDark: Boolean, primaryHex: String) {
        runOnUiThread {
            try {
                isDarkMode = isDark
                val primaryColor = parseColorSafely(primaryHex, Color.parseColor("#6366F1"))
                currentPrimaryColor = primaryColor

                // In Light Mode: Status bar is pure WHITE (#FFFFFF) with dark/black icons
                // In Dark Mode: Status bar is deep dark (#0B0F19) matching Spezx header with white icons
                val statusBarColor = if (isDark) Color.parseColor("#0B0F19") else Color.WHITE
                val navBarBg = if (isDark) Color.parseColor("#0F172A") else Color.WHITE

                updateSystemBars(isDark, statusBarColor, navBarBg)

            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    @Suppress("DEPRECATION")
    private fun updateSystemBars(isDark: Boolean, statusBarColor: Int, navBarColor: Int) {
        try {
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS)
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION)
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)

            window.statusBarColor = statusBarColor
            window.navigationBarColor = navBarColor

            // 1. AndroidX WindowInsetsControllerCompat
            val insetsController = WindowInsetsControllerCompat(window, window.decorView)
            insetsController.isAppearanceLightStatusBars = !isDark
            insetsController.isAppearanceLightNavigationBars = !isDark

            // 2. SYSTEM_UI_FLAG for Realme UI / ColorOS
            var flags = window.decorView.systemUiVisibility
            flags = if (!isDark) {
                flags or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
            } else {
                flags and View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR.inv()
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                flags = if (!isDark) {
                    flags or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
                } else {
                    flags and View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR.inv()
                }
            }
            window.decorView.systemUiVisibility = flags

            // 3. Update view backgrounds and bottom nav colors
            binding.rootLayout.setBackgroundColor(statusBarColor)
            binding.bottomNavContainer.setBackgroundColor(navBarColor)
            binding.bottomNav.setBackgroundColor(navBarColor)
            val navDividerColor = if (isDark) Color.parseColor("#1E293B") else Color.parseColor("#E2E8F0")
            binding.bottomNavDivider.setBackgroundColor(navDividerColor)

            // Update bottom nav active and inactive icon & label colors
            val inactiveColor = if (isDark) Color.parseColor("#94A3B8") else Color.parseColor("#64748B")
            val states = arrayOf(
                intArrayOf(android.R.attr.state_checked),
                intArrayOf(-android.R.attr.state_checked)
            )
            val colors = intArrayOf(currentPrimaryColor, inactiveColor)
            val colorStateList = ColorStateList(states, colors)

            binding.bottomNav.itemIconTintList = colorStateList
            binding.bottomNav.itemTextColor = colorStateList
            binding.swipeRefresh.setColorSchemeColors(currentPrimaryColor)

        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun parseColorSafely(colorStr: String?, defaultColor: Int): Int {
        if (colorStr.isNullOrBlank()) return defaultColor
        return try {
            if (colorStr.startsWith("#")) {
                Color.parseColor(colorStr)
            } else if (colorStr.startsWith("rgb")) {
                val nums = colorStr.replace("rgb(", "").replace("rgba(", "").replace(")", "").split(",")
                if (nums.size >= 3) {
                    val r = nums[0].trim().toInt()
                    val g = nums[1].trim().toInt()
                    val b = nums[2].trim().toInt()
                    Color.rgb(r, g, b)
                } else defaultColor
            } else {
                defaultColor
            }
        } catch (e: Exception) {
            defaultColor
        }
    }

    private fun showOfflinePage() {
        val offlineHtml = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex; flex-direction: column; align-items: center; justify-content: center;
                        height: 90vh; margin: 0; background: #0b0f19; color: #f8fafc; text-align: center; padding: 24px;
                    }
                    .icon { font-size: 56px; margin-bottom: 16px; }
                    h2 { margin: 0 0 8px; font-size: 22px; font-weight: 700; }
                    p { color: #94a3b8; font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
                    button {
                        background: #6366f1; color: white; border: none; padding: 12px 32px;
                        border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer;
                        box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
                    }
                </style>
            </head>
            <body>
                <div class="icon">📶</div>
                <h2>No Internet Connection</h2>
                <p>Please check your mobile data or Wi-Fi network and try again.</p>
                <button onclick="location.reload()">Retry Connection</button>
            </body>
            </html>
        """.trimIndent()
        webView.loadDataWithBaseURL(null, offlineHtml, "text/html", "UTF-8", null)
    }

    // ── JavaScript Interface Bridge ───────────────────────────────────
    inner class AndroidBridge {

        @JavascriptInterface
        fun onThemeChanged(isDark: Boolean, primaryHex: String) {
            applyDynamicTheme(isDark, primaryHex)
        }

        @JavascriptInterface
        fun share(title: String, text: String, url: String) {
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_SUBJECT, title)
                putExtra(Intent.EXTRA_TEXT, "$text\n$url".trim())
            }
            startActivity(Intent.createChooser(intent, "Share via"))
        }

        @JavascriptInterface
        fun copyToClipboard(text: String) {
            val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            clipboard.setPrimaryClip(ClipData.newPlainText("NovaStore", text))
            runOnUiThread {
                Toast.makeText(this@MainActivity, "Copied to clipboard", Toast.LENGTH_SHORT).show()
            }
        }

        @JavascriptInterface
        fun vibrate(milliseconds: Long) {
            val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createOneShot(milliseconds.coerceAtLeast(40), VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(milliseconds.coerceAtLeast(40))
            }
        }
    }

    // ── Navigation & Back Key ─────────────────────────────────────────
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            if (webView.canGoBack()) {
                webView.goBack()
                return true
            } else {
                if (System.currentTimeMillis() - backPressedTime < 2000) {
                    finish()
                } else {
                    backPressedTime = System.currentTimeMillis()
                    Toast.makeText(this, "Press back again to exit", Toast.LENGTH_SHORT).show()
                }
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == FILE_CHOOSER_REQUEST) {
            filePathCallback?.onReceiveValue(
                if (resultCode == Activity.RESULT_OK) {
                    WebChromeClient.FileChooserParams.parseResult(resultCode, data)
                } else null
            )
            filePathCallback = null
        }
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        checkThemeFromDOM()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
