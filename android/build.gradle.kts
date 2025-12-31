// BAHB Android Companion App - Root Build Configuration
// For DJI RC Plus 2 Enterprise with MSDK V5.17.0

buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.2.0")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.21")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
        // DJI SDK Repository
        maven { url = uri("https://developer.dji.com/maven") }
    }
}

tasks.register("clean", Delete::class) {
    delete(rootProject.buildDir)
}
