#pragma once
// Copy this file to secrets.h. Never commit secrets.h or put a real device key
// in a public Wokwi project.
#define KRISHI_GUARD_ENDPOINT "https://zimgkzfahqmenqlfzyqi.supabase.co/functions/v1/storage-guardian"
#define SUPABASE_PUBLISHABLE_KEY "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY"
#define KRISHI_GUARD_DEVICE_KEY "PASTE_THE_ONE_TIME_DEVICE_KEY"
#define KRISHI_GUARD_WIFI_SSID "YOUR_WIFI_NAME"
#define KRISHI_GUARD_WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Keep 0 for offline simulation. Set to 1 only after registering a device
// in Krishi Connect 360 and securely provisioning its one-time key.
#define KRISHI_GUARD_ENABLE_TELEMETRY 0
