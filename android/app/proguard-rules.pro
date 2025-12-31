# BAHB Android App ProGuard Rules

# DJI SDK
-keep class dji.** { *; }
-keepclassmembers class dji.** { *; }
-keep class com.dji.** { *; }
-keepclassmembers class com.dji.** { *; }

# Keep DJI UX SDK
-keep class dji.v5.ux.** { *; }

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# Gson
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.google.gson.** { *; }
-keep class com.bahb.model.** { *; }
-keepclassmembers class com.bahb.model.** { *; }

# Timber
-dontwarn org.jetbrains.annotations.**

# Coroutines
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}
-keepclassmembers class kotlin.coroutines.SafeContinuation {
    volatile <fields>;
}

# Keep R8 from stripping interface methods
-keep,allowobfuscation interface * extends java.io.Serializable
