export type AppLanguage = "en" | "kn";

function extractMessage(error: unknown): string {
  if (typeof error === "string") return error.trim();
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "").trim();
  }
  return "";
}

export function friendlyErrorMessage(
  error: unknown,
  language: AppLanguage,
  fallback = "The action could not be completed.",
): string {
  const raw = extractMessage(error);
  if (language === "en") return raw || fallback;
  if (/[\u0C80-\u0CFF]/.test(raw)) return raw;

  const message = raw.toLowerCase();
  if (/row-level security|permission denied|not allowed|unauthorized|forbidden/.test(message)) {
    return "ಈ ಖಾತೆಗೆ ಈ ಕಾರ್ಯಕ್ಕೆ ಅನುಮತಿ ಇಲ್ಲ. ಖಾತೆಯ ಪಾತ್ರ ಮತ್ತು ಪರಿಶೀಲನಾ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.";
  }
  if (/overlap|already has an overlapping booking|already booked/.test(message)) {
    return "ಈ ಸಮಯದಲ್ಲಿ ಈ ಸೇವಾ ಪೂರೈಕೆದಾರರಿಗೆ ಈಗಾಗಲೇ ಮತ್ತೊಂದು ಬುಕಿಂಗ್ ಇದೆ. ಬೇರೆ ಸಮಯ ಆಯ್ಕೆಮಾಡಿ.";
  }
  if (/complete your participant profile|profile is incomplete|profile completion/.test(message)) {
    return "ಮುಂದುವರಿಯುವ ಮೊದಲು ನಿಮ್ಮ ಭಾಗವಹಿಸುವವರ ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ.";
  }
  if (/invalid login credentials|invalid email or password/.test(message)) {
    return "ಲಾಗಿನ್ ವಿವರಗಳು ಸರಿಯಾಗಿಲ್ಲ. ಇಮೇಲ್ ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಹೊಸ ಲಾಗಿನ್ ಲಿಂಕ್ ವಿನಂತಿಸಿ.";
  }
  if (/email not confirmed|email address.*confirm/.test(message)) {
    return "ಮುಂದುವರಿಯುವ ಮೊದಲು ನಿಮ್ಮ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ದೃಢೀಕರಿಸಿ.";
  }
  if (/rate limit|too many requests/.test(message)) {
    return "ಹಲವಾರು ವಿನಂತಿಗಳು ಕಳುಹಿಸಲಾಗಿದೆ. ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.";
  }
  if (/duplicate key|already exists|unique constraint/.test(message)) {
    return "ಈ ವಿವರ ಈಗಾಗಲೇ ಇದೆ. ಬೇರೆ ವಿವರ ಬಳಸಿ.";
  }
  if (/not found|no rows/.test(message)) {
    return "ಕೋರಿದ ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ ಅಥವಾ ಇನ್ನು ಲಭ್ಯವಿಲ್ಲ.";
  }
  if (/network|fetch|timeout|connection/.test(message)) {
    return "ಸಂಪರ್ಕ ಸಮಸ್ಯೆಯಾಗಿದೆ. ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.";
  }
  if (/device key|device registration|device revoked/.test(message)) {
    return "ಸಾಧನದ ಕೀ ಮಾನ್ಯವಿಲ್ಲ ಅಥವಾ ಹಿಂಪಡೆಯಲಾಗಿದೆ. ಸಾಧನದ ನೋಂದಣಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.";
  }
  if (/check constraint|invalid input|violates/.test(message)) {
    return "ನಮೂದಿಸಿದ ವಿವರಗಳು ಮಾನ್ಯವಲ್ಲ. ಎಲ್ಲಾ ಕ್ಷೇತ್ರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.";
  }
  return "ಕಾರ್ಯ ಪೂರ್ಣಗೊಳ್ಳಲಿಲ್ಲ. ನಮೂದಿಸಿದ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.";
}
