package com.novastore.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Message
import android.view.KeyEvent
import android.view.View
import android.webkit.*
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.novastore.app.databinding.ActivityMainBinding
import com.razorpay.Checkout
import com.razorpay.PaymentResultListener
import org.json.JSONObject

class MainActivity : AppCompatActivity(), PaymentResultListener {

    private lateinit var binding: ActivityMainBinding
    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var bottomNav: BottomNavigationView

    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private val FILE_CHOOSER_REQUEST = 1001

    // Primary brand color (Nova Store theme - deep purple/indigo)
    private val BRAND_COLOR = Color.parseColor("#4F46E5")
    private val BRAND_DARK  = Color.parseColor("#3730A3")

    companion object {
        const val STORE_URL = "https://nova-ecommerce-store-r5ez.onrender.com"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Edge-to-edge + status bar theming
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = BRAND_COLOR
        window.navigationBarColor = Color.WHITE
        val wic = WindowInsetsControllerCompat(window, window.decorView)
        wic.isAppearanceLightStatusBars = false   // white icons on coloured bar
        wic.isAppearanceLightNavigationBars = true // dark icons on white nav bar

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        webView      = binding.webView
        swipeRefresh = binding.swipeRefresh
        bottomNav    = binding.bottomNav

        setupSwipeRefresh()
        setupBottomNav()
        setupWebView()
        setupRazorpay()

        // Handle deep-link intent
        val deepUrl = intent?.data?.toString()
        webView.loadUrl(deepUrl ?: STORE_URL)
    }

    // ── Swipe-to-Refresh ──────────────────────────────────────────────
    private fun setupSwipeRefresh() {
        swipeRefresh.setColorSchemeColors(BRAND_COLOR, BRAND_DARK)
        swipeRefresh.setOnRefreshListener {
            webView.reload()
        }
    }

    // ── Bottom Navigation ─────────────────────────────────────────────
    private fun setupBottomNav() {
        bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home     -> navigate("/")
                R.id.nav_products -> navigate("/products")
                R.id.nav_cart     -> navigate("/cart")
                R.id.nav_orders   -> navigate("/orders")
                R.id.nav_profile  -> navigate("/profile")
            }
            true
        }
    }

    private fun navigate(path: String) {
        val currentUrl = webView.url ?: ""
        val target = STORE_URL + path
        if (!currentUrl.endsWith(path)) {
            webView.loadUrl(target)
        }
    }

    // ── WebView Setup ─────────────────────────────────────────────────
    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            setSupportMultipleWindows(true)
            javaScriptCanOpenWindowsAutomatically = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            userAgentString = userAgentString + " NovaStoreApp/1.0"
            cacheMode = WebSettings.LOAD_DEFAULT
            loadWithOverviewMode = true
            useWideViewPort = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
        }

        // Inject JS bridge for Razorpay + Share
        webView.addJavascriptInterface(WebAppInterface(), "Android")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                swipeRefresh.isRefreshing = true
                updateNavBarSelection(url)
                updateStatusBarColor(url)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                swipeRefresh.isRefreshing = false
                // Inject CSS to hide any existing bottom nav on the website if present
                webView.evaluateJavascript(
                    """
                    (function(){
                        var style = document.createElement('style');
                        style.textContent = 'body { padding-bottom: 60px !important; }';
                        document.head.appendChild(style);
                    })();
                    """.trimIndent(), null
                )
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                return when {
                    // Stay inside app for our domain
                    url.startsWith(STORE_URL) -> false
                    // Open share/mailto/tel in native apps
                    url.startsWith("mailto:") -> {
                        startActivity(Intent(Intent.ACTION_SENDTO, Uri.parse(url)))
                        true
                    }
                    url.startsWith("tel:") -> {
                        startActivity(Intent(Intent.ACTION_DIAL, Uri.parse(url)))
                        true
                    }
                    url.startsWith("whatsapp:") || url.startsWith("upi:") -> {
                        try { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) } catch (e: Exception) {}
                        true
                    }
                    // Open external links in browser
                    else -> {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                        true
                    }
                }
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                swipeRefresh.isRefreshing = false
                if (request?.isForMainFrame == true) {
                    showOfflinePage()
                }
            }
        }

        // File chooser for profile image upload etc.
        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback
                val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                    type = "*/*"
                }
                startActivityForResult(Intent.createChooser(intent, "Choose File"), FILE_CHOOSER_REQUEST)
                return true
            }

            // Multi-window support (e.g., payment popups)
            override fun onCreateWindow(view: WebView?, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message?): Boolean {
                val popup = WebView(this@MainActivity)
                popup.settings.javaScriptEnabled = true
                val transport = resultMsg?.obj as? WebView.WebViewTransport
                transport?.webView = popup
                resultMsg?.sendToTarget()
                return true
            }

            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress == 100) swipeRefresh.isRefreshing = false
            }
        }

        // CookieManager - accept third-party cookies for payment gateways
        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }
    }

    // ── Status bar color based on page ───────────────────────────────
    private fun updateStatusBarColor(url: String?) {
        val color = when {
            url == null || url.endsWith("/")         -> BRAND_COLOR
            url.contains("/products")                -> Color.parseColor("#7C3AED")
            url.contains("/cart")                    -> Color.parseColor("#059669")
            url.contains("/orders")                  -> Color.parseColor("#D97706")
            url.contains("/profile") || url.contains("/account") -> Color.parseColor("#1D4ED8")
            else -> BRAND_COLOR
        }
        window.statusBarColor = color
    }

    // ── Update bottom nav selection based on URL ──────────────────────
    private fun updateNavBarSelection(url: String?) {
        if (url == null) return
        val itemId = when {
            url.endsWith("/") || url == STORE_URL  -> R.id.nav_home
            url.contains("/products")              -> R.id.nav_products
            url.contains("/cart")                  -> R.id.nav_cart
            url.contains("/orders")                -> R.id.nav_orders
            url.contains("/profile") || url.contains("/account") -> R.id.nav_profile
            else -> R.id.nav_home
        }
        bottomNav.selectedItemId = itemId
    }

    // ── Offline Page ──────────────────────────────────────────────────
    private fun showOfflinePage() {
        webView.loadData("""
            <html><body style="display:flex;flex-direction:column;align-items:center;
            justify-content:center;height:100vh;font-family:sans-serif;background:#f9fafb;color:#374151;">
            <div style="font-size:64px;">📵</div>
            <h2>No Internet Connection</h2>
            <p>Please check your network and try again.</p>
            <button onclick="location.reload()" style="background:#4F46E5;color:white;
            border:none;padding:12px 32px;border-radius:8px;font-size:16px;cursor:pointer;">
            Retry</button></body></html>
        """.trimIndent(), "text/html", "utf-8")
    }

    // ── Razorpay ──────────────────────────────────────────────────────
    private fun setupRazorpay() {
        Checkout.preload(applicationContext)
    }

    fun startRazorpayPayment(amount: Int, orderId: String, name: String, email: String, phone: String) {
        val checkout = Checkout()
        checkout.setKeyID("YOUR_RAZORPAY_KEY_ID") // Replace with actual key
        val options = JSONObject().apply {
            put("name", "Nova Store")
            put("description", "Order #$orderId")
            put("amount", amount * 100) // paise
            put("currency", "INR")
            put("order_id", orderId)
            put("prefill", JSONObject().apply {
                put("name", name)
                put("email", email)
                put("contact", phone)
            })
            put("theme", JSONObject().apply {
                put("color", "#4F46E5")
            })
        }
        checkout.open(this, options)
    }

    override fun onPaymentSuccess(razorpayPaymentId: String?) {
        // Send result back to WebView JS
        webView.evaluateJavascript(
            "window.onRazorpaySuccess && window.onRazorpaySuccess('$razorpayPaymentId')", null
        )
        Toast.makeText(this, "✅ Payment Successful!", Toast.LENGTH_LONG).show()
    }

    override fun onPaymentError(code: Int, response: String?) {
        webView.evaluateJavascript(
            "window.onRazorpayError && window.onRazorpayError($code, '$response')", null
        )
        Toast.makeText(this, "❌ Payment Failed: $response", Toast.LENGTH_LONG).show()
    }

    // ── JS Bridge ─────────────────────────────────────────────────────
    inner class WebAppInterface {
        @JavascriptInterface
        fun shareText(title: String, text: String, url: String) {
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_SUBJECT, title)
                putExtra(Intent.EXTRA_TEXT, "$text\n$url")
            }
            startActivity(Intent.createChooser(intent, "Share via"))
        }

        @JavascriptInterface
        fun startPayment(amount: Int, orderId: String, name: String, email: String, phone: String) {
            runOnUiThread {
                startRazorpayPayment(amount, orderId, name, email, phone)
            }
        }

        @JavascriptInterface
        fun openDialer(phone: String) {
            startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone")))
        }

        @JavascriptInterface
        fun openWhatsApp(phone: String, message: String) {
            val url = "https://wa.me/$phone?text=${Uri.encode(message)}"
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        }

        @JavascriptInterface
        fun copyToClipboard(text: String) {
            val clipboard = getSystemService(CLIPBOARD_SERVICE) as android.content.ClipboardManager
            clipboard.setPrimaryClip(android.content.ClipData.newPlainText("Copied", text))
            runOnUiThread { Toast.makeText(this@MainActivity, "Copied!", Toast.LENGTH_SHORT).show() }
        }

        @JavascriptInterface
        fun vibrate() {
            val vibrator = getSystemService(VIBRATOR_SERVICE) as android.os.Vibrator
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(android.os.VibrationEffect.createOneShot(50, android.os.VibrationEffect.DEFAULT_AMPLITUDE))
            }
        }
    }

    // ── Back button ───────────────────────────────────────────────────
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    // ── File chooser result ───────────────────────────────────────────
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
        CookieManager.getInstance().flush()
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
