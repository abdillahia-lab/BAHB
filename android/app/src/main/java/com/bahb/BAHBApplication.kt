package com.bahb

import android.app.Application
import android.content.Context
import dji.v5.common.error.IDJIError
import dji.v5.common.register.DJISDKInitEvent
import dji.v5.manager.SDKManager
import dji.v5.manager.interfaces.SDKManagerCallback
import timber.log.Timber

/**
 * BAHB Companion Application
 *
 * Initializes DJI MSDK V5.17.0 for RC Plus 2 Enterprise integration.
 */
class BAHBApplication : Application() {

    companion object {
        lateinit var instance: BAHBApplication
            private set
    }

    var isDJIRegistered = false
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        // Initialize logging
        Timber.plant(Timber.DebugTree())
        Timber.i("BAHB Companion starting...")

        // Initialize DJI SDK
        initDJISDK()
    }

    private fun initDJISDK() {
        SDKManager.getInstance().init(this, object : SDKManagerCallback {
            override fun onRegisterSuccess() {
                Timber.i("DJI SDK registered successfully")
                isDJIRegistered = true
            }

            override fun onRegisterFailure(error: IDJIError?) {
                Timber.e("DJI SDK registration failed: ${error?.description()}")
                isDJIRegistered = false
            }

            override fun onProductDisconnect(productId: Int) {
                Timber.w("Product disconnected: $productId")
            }

            override fun onProductConnect(productId: Int) {
                Timber.i("Product connected: $productId")
            }

            override fun onProductChanged(productId: Int) {
                Timber.i("Product changed: $productId")
            }

            override fun onInitProcess(event: DJISDKInitEvent?, totalProcess: Int) {
                Timber.d("DJI SDK init: $event ($totalProcess%)")
            }

            override fun onDatabaseDownloadProgress(current: Long, total: Long) {
                Timber.d("Database download: $current / $total")
            }
        })
    }
}
