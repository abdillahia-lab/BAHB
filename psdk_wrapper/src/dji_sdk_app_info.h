/**
 * DJI SDK Application Info - User must fill in their credentials from DJI Developer Portal
 *
 * To get these credentials:
 * 1. Go to https://developer.dji.com/user/apps
 * 2. Create a new Payload SDK application
 * 3. Copy the App ID, App Key, and App License here
 */

#ifndef DJI_SDK_APP_INFO_H
#define DJI_SDK_APP_INFO_H

#ifdef __cplusplus
extern "C" {
#endif

/* TODO: Replace these with your actual DJI Developer credentials */
#define USER_APP_NAME               "BAHB-Inspect"
#define USER_APP_ID                 "YOUR_APP_ID"
#define USER_APP_KEY                "7053382160ece36ce4294e75"
#define USER_APP_LICENSE            "YOUR_APP_LICENSE"
#define USER_DEVELOPER_ACCOUNT      "YOUR_EMAIL"
#define USER_BAUD_RATE              "460800"

#ifdef __cplusplus
}
#endif

#endif /* DJI_SDK_APP_INFO_H */
