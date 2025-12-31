// BAHB Android Companion App
// Target: DJI RC Plus 2 Enterprise (7" 1920x1200, Android)
// MSDK Version: 5.17.0 (Latest as of December 2025)

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
}

android {
    namespace = "com.bahb.companion"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.bahb.companion"
        minSdk = 26  // Android 8.0+ for RC Plus 2
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        // Manifold 3 connection defaults
        buildConfigField("String", "MANIFOLD_HOST", "\"192.168.42.3\"")
        buildConfigField("int", "MANIFOLD_WS_PORT", "8080")
        buildConfigField("int", "MANIFOLD_REST_PORT", "8081")

        ndk {
            abiFilters += listOf("arm64-v8a")  // RC Plus 2 is ARM64
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
            // DJI SDK exclusions
            pickFirsts += listOf(
                "lib/arm64-v8a/libc++_shared.so",
                "lib/arm64-v8a/libffmpeg.so"
            )
        }
    }
}

// DJI MSDK V5.17.0 Version
val djiSdkVersion = "5.17.0"

dependencies {
    // DJI Mobile SDK V5.17.0 - Aircraft package for Matrice/Enterprise drones
    implementation("com.dji:dji-sdk-v5-aircraft:$djiSdkVersion")
    compileOnly("com.dji:dji-sdk-v5-aircraft-provided:$djiSdkVersion")

    // DJI SDK Network (for 4G connectivity)
    implementation("com.dji:dji-sdk-v5-networkImp:$djiSdkVersion")

    // Kotlin & Android Core
    implementation("org.jetbrains.kotlin:kotlin-stdlib:1.9.21")
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.activity:activity-ktx:1.8.2")
    implementation("androidx.fragment:fragment-ktx:1.6.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")

    // Material Design 3
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")

    // Coroutines for async operations
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // WebSocket for Manifold 3 connection
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    // JSON parsing for BAHB protocol
    implementation("com.google.code.gson:gson:2.10.1")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")

    // Image loading for thermal overlays
    implementation("io.coil-kt:coil:2.5.0")

    // Logging
    implementation("com.jakewharton.timber:timber:5.0.1")
}
