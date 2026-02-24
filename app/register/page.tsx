"use client";

import Link from "next/link";
import { User, Mail, Lock, Eye, EyeOff, UserPlus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!acceptedTerms) {
      setError("Please accept terms and conditions");
      return;
    }

    setLoading(true);

    try {
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const registerJson = (await registerResponse.json()) as { error?: string };
      if (!registerResponse.ok) {
        throw new Error(registerJson.error || "Register failed");
      }

      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const loginJson = (await loginResponse.json()) as {
        error?: string;
        session?: { token: string; expiresAt: string };
        user?: { id: number; email: string; name: string | null; role: string };
      };

      if (!loginResponse.ok || !loginJson.session || !loginJson.user) {
        throw new Error(loginJson.error || "Auto login failed");
      }

      window.localStorage.setItem("rtn_session_token", loginJson.session.token);
      window.localStorage.setItem(
        "rtn_session_expires_at",
        loginJson.session.expiresAt,
      );
      window.localStorage.setItem("rtn_user", JSON.stringify(loginJson.user));

      router.replace("/");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Register failed",
      );
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
          <p className="text-sm text-muted-foreground mt-2">Create your account</p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sm:p-7">
          <div className="mb-6">
            <h1 className="text-xl tracking-tight font-medium text-foreground">
              Register
            </h1>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-sm font-medium text-foreground">Name</label>
              <div className="mt-2 relative">
                <User
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px]"
                  strokeWidth={1.5}
                />
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted border border-transparent rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                />
              </div>
            </div>

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
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
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

            <div>
              <label className="text-sm font-medium text-foreground">
                Confirm password
              </label>
              <div className="mt-2 relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px]"
                  strokeWidth={1.5}
                />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  required
                  className="w-full pl-10 pr-12 py-2.5 bg-muted border border-transparent rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-orange-600 transition-colors p-1"
                  aria-label="toggle confirm password">
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" strokeWidth={1.5} />
                  ) : (
                    <Eye className="w-5 h-5" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-muted-foreground select-none cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 accent-orange-500"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
              />
              <span>I accept terms and conditions</span>
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
              <UserPlus className="w-[18px] h-[18px]" strokeWidth={1.5} />
              {loading ? "Creating account..." : "Register"}
            </button>

            <p className="text-sm text-muted-foreground text-center pt-2">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-orange-600 hover:text-orange-700 font-medium">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

