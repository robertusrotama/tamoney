const MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Email atau password salah",
  "User already registered": "Email sudah terdaftar",
  "Email not confirmed": "Email belum diverifikasi. Cek kotak masuk Anda",
};

export function authErrorMessage(message: string): string {
  return MESSAGES[message] ?? "Terjadi kesalahan, coba lagi";
}

/** Only same-site paths: blocks open redirects like "//evil.com". */
export function safeNext(next: string | null): string {
  return next && /^\/(?![/\\])/.test(next) ? next : "/";
}
