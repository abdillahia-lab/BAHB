/**
 * BAHB PSDK Wrapper - Minimal PSDK application that launches Python app
 * This wrapper initializes DJI PSDK and then executes the BAHB Python application
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <signal.h>
#include <pthread.h>
#include <sys/wait.h>

#include "dji_platform.h"
#include "dji_core.h"
#include "dji_logger.h"
#include "dji_aircraft_info.h"

/* User credentials - MUST BE FILLED WITH YOUR DJI DEVELOPER CREDENTIALS */
#include "dji_sdk_app_info.h"

/* OSAL handlers */
#include "osal.h"
#include "osal_fs.h"
#include "osal_socket.h"
#include "hal_usb_bulk.h"

#define BAHB_PYTHON_APP "/data/bahb/bahb_app/run.sh"
#define LOG_PATH "data/logs"

static volatile int s_running = 1;
static pid_t s_python_pid = 0;

static void signal_handler(int sig) {
    s_running = 0;
    if (s_python_pid > 0) {
        kill(s_python_pid, SIGTERM);
    }
}

static T_DjiReturnCode console_print(const uint8_t *data, uint16_t len) {
    printf("%s", data);
    return DJI_ERROR_SYSTEM_MODULE_CODE_SUCCESS;
}

static T_DjiReturnCode setup_platform(void) {
    T_DjiReturnCode ret;

    T_DjiOsalHandler osalHandler = {
        .TaskCreate = Osal_TaskCreate,
        .TaskDestroy = Osal_TaskDestroy,
        .TaskSleepMs = Osal_TaskSleepMs,
        .MutexCreate = Osal_MutexCreate,
        .MutexDestroy = Osal_MutexDestroy,
        .MutexLock = Osal_MutexLock,
        .MutexUnlock = Osal_MutexUnlock,
        .SemaphoreCreate = Osal_SemaphoreCreate,
        .SemaphoreDestroy = Osal_SemaphoreDestroy,
        .SemaphoreWait = Osal_SemaphoreWait,
        .SemaphoreTimedWait = Osal_SemaphoreTimedWait,
        .SemaphorePost = Osal_SemaphorePost,
        .Malloc = Osal_Malloc,
        .Free = Osal_Free,
        .GetRandomNum = Osal_GetRandomNum,
        .GetTimeMs = Osal_GetTimeMs,
        .GetTimeUs = Osal_GetTimeUs,
    };

    T_DjiLoggerConsole console = {
        .func = console_print,
        .consoleLevel = DJI_LOGGER_CONSOLE_LOG_LEVEL_INFO,
        .isSupportColor = true,
    };

    T_DjiHalUsbBulkHandler usbHandler = {
        .UsbBulkInit = HalUsbBulk_Init,
        .UsbBulkDeInit = HalUsbBulk_DeInit,
        .UsbBulkWriteData = HalUsbBulk_WriteData,
        .UsbBulkReadData = HalUsbBulk_ReadData,
        .UsbBulkGetDeviceInfo = HalUsbBulk_GetDeviceInfo,
    };

    T_DjiFileSystemHandler fsHandler = {
        .FileOpen = Osal_FileOpen,
        .FileClose = Osal_FileClose,
        .FileWrite = Osal_FileWrite,
        .FileRead = Osal_FileRead,
        .FileSync = Osal_FileSync,
        .FileSeek = Osal_FileSeek,
        .DirOpen = Osal_DirOpen,
        .DirClose = Osal_DirClose,
        .DirRead = Osal_DirRead,
        .Mkdir = Osal_Mkdir,
        .Unlink = Osal_Unlink,
        .Rename = Osal_Rename,
        .Stat = Osal_Stat,
    };

    T_DjiSocketHandler socketHandler = {
        .Socket = Osal_Socket,
        .Bind = Osal_Bind,
        .Close = Osal_Close,
        .UdpSendData = Osal_UdpSendData,
        .UdpRecvData = Osal_UdpRecvData,
        .TcpListen = Osal_TcpListen,
        .TcpAccept = Osal_TcpAccept,
        .TcpConnect = Osal_TcpConnect,
        .TcpSendData = Osal_TcpSendData,
        .TcpRecvData = Osal_TcpRecvData,
    };

    ret = DjiPlatform_RegOsalHandler(&osalHandler);
    if (ret != DJI_ERROR_SYSTEM_MODULE_CODE_SUCCESS) {
        printf("Failed to register OSAL handler\n");
        return ret;
    }

    ret = DjiLogger_AddConsole(&console);
    if (ret != DJI_ERROR_SYSTEM_MODULE_CODE_SUCCESS) {
        printf("Failed to add console\n");
        return ret;
    }

    ret = DjiPlatform_RegHalUsbBulkHandler(&usbHandler);
    if (ret != DJI_ERROR_SYSTEM_MODULE_CODE_SUCCESS) {
        printf("Failed to register USB handler\n");
        return ret;
    }

    ret = DjiPlatform_RegFileSystemHandler(&fsHandler);
    if (ret != DJI_ERROR_SYSTEM_MODULE_CODE_SUCCESS) {
        printf("Failed to register filesystem handler\n");
        return ret;
    }

    ret = DjiPlatform_RegSocketHandler(&socketHandler);
    if (ret != DJI_ERROR_SYSTEM_MODULE_CODE_SUCCESS) {
        printf("Failed to register socket handler\n");
        return ret;
    }

    return DJI_ERROR_SYSTEM_MODULE_CODE_SUCCESS;
}

static void launch_python_app(void) {
    printf("Launching BAHB Python application...\n");

    s_python_pid = fork();
    if (s_python_pid == 0) {
        /* Child process - run Python app */
        execl("/bin/bash", "bash", BAHB_PYTHON_APP, NULL);
        /* If exec fails */
        perror("Failed to launch Python app");
        exit(1);
    } else if (s_python_pid < 0) {
        printf("Failed to fork process\n");
    } else {
        printf("BAHB Python app launched with PID %d\n", s_python_pid);
    }
}

int main(int argc, char **argv) {
    T_DjiReturnCode ret;
    T_DjiUserInfo userInfo;
    T_DjiFirmwareVersion fwVersion = {1, 0, 0, 0};

    (void)argc;
    (void)argv;

    printf("===========================================\n");
    printf("  BAHB Infrastructure Inspector v1.0.0\n");
    printf("  PSDK Wrapper for Manifold 3\n");
    printf("===========================================\n");

    signal(SIGTERM, signal_handler);
    signal(SIGINT, signal_handler);

    /* Setup platform */
    ret = setup_platform();
    if (ret != DJI_ERROR_SYSTEM_MODULE_CODE_SUCCESS) {
        printf("Platform setup failed: %d\n", ret);
        return -1;
    }

    /* Fill user info */
    memset(&userInfo, 0, sizeof(userInfo));
    strncpy(userInfo.appName, USER_APP_NAME, sizeof(userInfo.appName) - 1);
    memcpy(userInfo.appId, USER_APP_ID, strlen(USER_APP_ID));
    memcpy(userInfo.appKey, USER_APP_KEY, strlen(USER_APP_KEY));
    memcpy(userInfo.appLicense, USER_APP_LICENSE, strlen(USER_APP_LICENSE));
    strncpy(userInfo.developerAccount, USER_DEVELOPER_ACCOUNT, sizeof(userInfo.developerAccount) - 1);
    strncpy(userInfo.baudRate, USER_BAUD_RATE, sizeof(userInfo.baudRate) - 1);

    /* Initialize PSDK Core */
    printf("Initializing DJI PSDK Core...\n");
    ret = DjiCore_Init(&userInfo);
    if (ret != DJI_ERROR_SYSTEM_MODULE_CODE_SUCCESS) {
        printf("DJI Core init failed: %d\n", ret);
        printf("Please check your DJI credentials in dji_sdk_app_info.h\n");
        return -1;
    }
    printf("DJI PSDK Core initialized successfully\n");

    /* Set firmware version */
    ret = DjiCore_SetFirmwareVersion(fwVersion);
    if (ret != DJI_ERROR_SYSTEM_MODULE_CODE_SUCCESS) {
        printf("Set firmware version failed\n");
    }

    /* Set alias */
    ret = DjiCore_SetAlias("BAHB-Inspector");
    if (ret != DJI_ERROR_SYSTEM_MODULE_CODE_SUCCESS) {
        printf("Set alias failed\n");
    }

    /* Start application */
    ret = DjiCore_ApplicationStart();
    if (ret != DJI_ERROR_SYSTEM_MODULE_CODE_SUCCESS) {
        printf("Application start failed: %d\n", ret);
        return -1;
    }
    printf("PSDK Application started\n");

    /* Launch Python application */
    launch_python_app();

    /* Main loop - keep PSDK alive */
    printf("BAHB running. Press Ctrl+C to stop.\n");
    while (s_running) {
        sleep(1);

        /* Check if Python app is still running */
        if (s_python_pid > 0) {
            int status;
            pid_t result = waitpid(s_python_pid, &status, WNOHANG);
            if (result == s_python_pid) {
                printf("Python app exited, restarting...\n");
                launch_python_app();
            }
        }
    }

    printf("Shutting down...\n");
    if (s_python_pid > 0) {
        kill(s_python_pid, SIGTERM);
        waitpid(s_python_pid, NULL, 0);
    }

    return 0;
}
