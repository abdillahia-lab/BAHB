// BAHB Android Companion App Settings

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://developer.dji.com/maven") }
    }
}

rootProject.name = "BAHB-Companion"
include(":app")
