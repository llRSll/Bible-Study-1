"use client";

import LoginButton from "@/components/ui/login-button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { login } from "../../../lib/actions/auth";
import { ValidationError, validateLoginForm } from "../../../lib/utils/validations";
import { Eye, EyeOff } from "lucide-react";


export default function Login() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError>({});

  useEffect(() => {
    // Check for success message from URL query params (after signup)
    const message = searchParams.get("message");
    if (message) {
      setSuccess(message);
    }
  }, [searchParams]);

  const validateForm = (): boolean => {
    const errors = validateLoginForm(email, password);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  async function handleLogin(formData: FormData) {
    setError(null);
    setSuccess(null);
    
    // Frontend validation
    if (!validateForm()) {
      return;
    }
    
    const result = await login(formData);
    
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Login to your account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Or{" "}
            <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>
     
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">{success}</div>
              </div>
            </div>
          </div>
        )}
        
        <form action={handleLogin} className="mt-8 space-y-6" >
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationErrors.email) {
                    setValidationErrors({
                      ...validationErrors,
                      email: undefined
                    });
                  }
                }}
                className={`mt-1 block w-full rounded-md border ${
                  validationErrors.email ? "border-red-500" : "border-gray-300"
                } px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm`}
              />
              {validationErrors.email && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) {
                      setValidationErrors({
                        ...validationErrors,
                        password: undefined
                      });
                    }
                  }}
                  className={`block w-full rounded-md border ${
                    validationErrors.password ? "border-red-500" : "border-gray-300"
                  } pr-10 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-500" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p>
              )}
            </div>
          </div>

          <div>
            <LoginButton />
          </div>
        </form>
      </div>
    </div>
  );
} 