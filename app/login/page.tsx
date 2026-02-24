"use client";

import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState("/");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectTo(params.get("redirect") || "/");
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = (await response.json()) as {
        error?: string;
        session?: { token: string; expiresAt: string };
        user?: { id: number; email: string; name: string | null; role: string };
      };

      if (!response.ok || !json.session || !json.user) {
        throw new Error(json.error || "Login failed");
      }

      const storage = rememberMe ? window.localStorage : window.sessionStorage;
      storage.setItem("rtn_session_token", json.session.token);
      storage.setItem("rtn_session_expires_at", json.session.expiresAt);
      storage.setItem("rtn_user", JSON.stringify(json.user));

      router.replace(redirectTo || "/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl tracking-tighter font-medium text-orange-600">
              RTN
            </span>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">Login to continue</p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sm:p-7">
          <div className="mb-6">
            <h1 className="text-xl tracking-tight font-medium text-foreground">
              Login
            </h1>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="mt-2 relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px]"
                  strokeWidth={1.5}
                />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-muted border border-transparent rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="mt-2 relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px]"
                  strokeWidth={1.5}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-2.5 bg-muted border border-transparent rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-orange-600 transition-colors p-1"
                  aria-label="toggle password">
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" strokeWidth={1.5} />
                  ) : (
                    <Eye className="w-5 h-5" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground select-none cursor-pointer">
              <input
                type="checkbox"
                className="accent-orange-500"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              Remember me
            </label>

            {error ? (
              <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-70">
              <LogIn className="w-[18px] h-[18px]" strokeWidth={1.5} />
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="text-sm text-muted-foreground text-center pt-2">
              No account?{" "}
              <Link
                href="/register"
                className="text-orange-600 hover:text-orange-700 font-medium">
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

