plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.novastore.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.novastore.app"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
        // Razorpay requires this
        manifestPlaceholders["razorpay_key_id"] = "YOUR_RAZORPAY_KEY_ID"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    buildFeatures {
        viewBinding = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.swiperefreshlayout)
    implementation(libs.razorpay.checkout)
}
