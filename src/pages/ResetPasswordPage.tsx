import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ------------------ Validation -------------------
const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// ------------------ Component -------------------
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { exitRecoveryMode } = useAuth();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // ------------------ Handle recovery session -------------------
  useEffect(() => {
    const url = new URL(window.location.href);

    // Case 1: Supabase v2 (query param ?code=...&type=recovery)
    const code = url.searchParams.get("code");
    const type = url.searchParams.get("type");

    if (code && type === "recovery") {
      console.log("[ResetPassword] Recovery code detected via query params");
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) {
          console.error("[ResetPassword] Error exchanging code:", error);
          setError("Invalid or expired reset link.");
        } else {
          console.log(
            "[ResetPassword] Recovery session established:",
            data.session?.user?.id,
          );
          setError(null);
        }
      });
      return;
    }

    // Case 2: Supabase legacy (hash fragment #access_token=...)
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.replace("#", ""));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const hashType = params.get("type");

      if (accessToken && refreshToken && hashType === "recovery") {
        console.log("[ResetPassword] Recovery tokens detected via hash");
        supabase.auth
          .setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          .then(({ data, error }) => {
            if (error) {
              console.error(
                "[ResetPassword] Error setting recovery session:",
                error,
              );
              setError("Invalid or expired reset link.");
            } else {
              console.log(
                "[ResetPassword] Recovery session established:",
                data.session?.user?.id,
              );
              setError(null);
            }
          });
        return;
      }
    }

    // Jika tidak ada token sama sekali
    setError(
      "Warning: Please ensure you accessed this page from a valid reset link. Or this link has expired, please request new update password",
    );
  }, []);

  // ------------------ Handle form submit -------------------
  const handleSubmit = async (values: ResetPasswordFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setMessage(null);
      console.log("[ResetPassword] Attempting to update password...");

      // Update password (session already set in useEffect)
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        console.error("[ResetPassword] Password update error:", error);
        setError(error.message);
        return;
      }

      console.log("[ResetPassword] Password updated successfully");
      setMessage("Password has been successfully updated!");

      // CRITICAL: Exit recovery mode BEFORE signing out
      console.log("[ResetPassword] Exiting recovery mode...");
      exitRecoveryMode?.();

      // Clear recovery mode from sessionStorage
      sessionStorage.removeItem("passwordRecoveryMode");

      // Wait a bit to ensure recovery mode is cleared
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Sign out and redirect
      setTimeout(async () => {
        console.log("[ResetPassword] Signing out and redirecting...");
        await supabase.auth.signOut();
        navigate("/");
      }, 1500);
    } catch (err) {
      console.error("Reset password error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------ Render UI -------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-3 pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Reset Password
            </CardTitle>
            <CardDescription className="text-center text-base">
              Enter your new password below to secure your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-5"
              >
                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">
                        New Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            className="pr-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            className="pr-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            {showConfirmPassword ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Alerts */}
                {error && (
                  <Alert
                    variant="destructive"
                    className="border-red-200 bg-red-50"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                {message && (
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="ml-2">
                      {message}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </Form>

            {/* Back to Sign In */}
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate("/")}
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                ← Back to Sign In
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
