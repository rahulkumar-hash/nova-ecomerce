# Proguard rules for NovaStore

# Razorpay rules
-keep class com.razorpay.** {*;}
-dontwarn com.razorpay.**
-dontwarn com.google.android.gms.**

# WebView Javascript interface
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Material components
-keep class com.google.android.material.** {*;}
