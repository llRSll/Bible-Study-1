"use client";

import SignupButton from "@/components/ui/signup-button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { signup } from "../../../lib/actions/auth";
import { ValidationError, validateSignupForm } from "../../../lib/utils/validations";



export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError>({});
  const [signupSuccess, setSignupSuccess] = useState(false);

  const validateForm = (): boolean => {
    const errors = validateSignupForm(email, password);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  async function handleSignup(formData: FormData) {
    setError(null);
    
    // Frontend validation
    if (!validateForm()) {
      return;
    }
    
    const result = await signup(formData);
    
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSignupSuccess(true);
      // The redirect will happen after a delay to show the verification message
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 15000);
    }
  }

  if (signupSuccess) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-bold text-gray-900">Account Created Successfully!</h1>
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-blue-800 mb-2">
              A verification email has been sent to <span className="font-semibold">{email}</span>
            </p>
            <p className="text-sm text-blue-800">
              Please check your inbox and click the verification link to activate your account.
            </p>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-4">You will be redirected to the login page in a few seconds...</p>
            <Link 
              href="/auth/login" 
              className="inline-block rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Create an account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Or{" "}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your account
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
        
        <form action={handleSignup} className="mt-8 space-y-6">
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
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
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
                className={`mt-1 block w-full rounded-md border ${
                  validationErrors.password ? "border-red-500" : "border-gray-300"
                } px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm`}
              />
              {validationErrors.password && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p>
              )}
              {!validationErrors.password && (
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 6 characters long, contain uppercase and lowercase letters, 
                  numbers, and at least one special character.
                </p>
              )}
            </div>
          </div>

          <div>
            <SignupButton />
          </div>
        </form>
      </div>
    </div>
  );
} 