
"use client";

import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { useState, type FormEvent } from "react";

const communityTypes = [
  "Company / Workplace",
  "Residential Society",
  "Educational Institution",
  "Gym / Fitness Centre",
  "Retail Store / Business",
  "Coaching Centre",
  "Other",
];

export default function CommunityRegisterPage() {
  const [applicantName, setApplicantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [communityName, setCommunityName] = useState("");
  const [communityType, setCommunityType] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const passwordCriteria = [
    {
      label: "At least 8 characters",
      valid: password.length >= 8,
    },
    {
      label: "One uppercase letter (A-Z)",
      valid: /[A-Z]/.test(password),
    },
    {
      label: "One lowercase letter (a-z)",
      valid: /[a-z]/.test(password),
    },
    {
      label: "One number (0-9)",
      valid: /[0-9]/.test(password),
    },
    {
      label: "One special character (@ $ ! % * ? &)",
      valid: /[@$!%*?&]/.test(password),
    },
  ];

  const isPasswordValid = passwordCriteria.every(
    (item) => item.valid
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!isPasswordValid) {
      setError("Please fulfil all password requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (description.trim().length < 20) {
      setError("Please provide at least 20 characters in the organisation description.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: applicantName.trim(),
              signup_type: "community",
              community_name: communityName.trim(),
              community_type: communityType,
              address: address.trim(),
              description: description.trim(),
            },
          },
        });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.user) {
        setError(
          "Account creation could not be completed. Please try again."
        );
        return;
      }

      setSuccess(
        "Your account has been created and your community application has been submitted. Please check your email for verification. Your application is awaiting Super Admin approval."
      );

      setApplicantName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setCommunityName("");
      setCommunityType("");
      setAddress("");
      setDescription("");
    } catch (err) {
      console.error("Community registration error:", err);

      setError(
        "Something went wrong while submitting your application. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto w-full max-w-2xl">

        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-slate-900">
          Akshep<span className="text-blue-600">.</span>
        </Link>

        {/* Registration Card */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <span className="text-sm font-semibold text-blue-600">
            COMMUNITY REGISTRATION
          </span>

          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Register your community
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Create an Akshep community for your organisation.
            Your application will be reviewed by an Akshep Super Admin
            before the community becomes active.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">

            {/* Applicant Details */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">
                1. Applicant details
              </h2>

              <div>
                <label
                  htmlFor="applicantName"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Full name
                </label>

                <input
                  id="applicantName"
                  type="text"
                  required
                  autoComplete="name"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pr-16 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <div className="mt-4 rounded-lg bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-semibold text-slate-700">
                    PASSWORD REQUIREMENTS
                  </p>

                  <div className="space-y-2">
                    {passwordCriteria.map((item) => (
                      <p
                        key={item.label}
                        className={`text-xs ${
                          item.valid
                            ? "text-green-700"
                            : "text-slate-700"
                        }`}
                      >
                        {item.valid ? "✓" : "○"} {item.label}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pr-16 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {confirmPassword.length > 0 && (
                  <p
                    className={`mt-2 text-xs ${
                      password === confirmPassword
                        ? "text-green-700"
                        : "text-red-600"
                    }`}
                  >
                    {password === confirmPassword
                      ? "✓ Passwords match"
                      : "Passwords do not match"}
                  </p>
                )}
              </div>
            </section>

            <div className="border-t border-slate-200" />

            {/* Community Details */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">
                2. Community details
              </h2>

              <div>
                <label
                  htmlFor="communityName"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Official organisation / community name
                </label>

                <input
                  id="communityName"
                  type="text"
                  required
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  placeholder="e.g. K2 Gym, ABC Residential Society"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="communityType"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Community type
                </label>

                <select
                  id="communityType"
                  required
                  value={communityType}
                  onChange={(e) => setCommunityType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select community type</option>

                  {communityTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Organisation address
                </label>

                <input
                  id="address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter city, state and address"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  About the organisation
                </label>

                <textarea
                  id="description"
                  required
                  minLength={20}
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe the organisation and its purpose."
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </section>

            {/* Approval Information */}
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <h3 className="font-semibold text-blue-900">
                Super Admin approval required
              </h3>

              <p className="mt-2 text-sm leading-6 text-blue-800">
                Your application will be submitted for review. The community
                will only become active after approval by an Akshep Super Admin.
                You will receive Community Owner privileges only after approval.
              </p>
            </div>

            {/* Error */}
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {/* Success */}
            {success && (
              <p
                role="status"
                className="rounded-lg bg-green-50 p-3 text-sm leading-6 text-green-800"
              >
                {success}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit application"}
            </button>
          </form>

          {/* Other Registration Options */}
          <div className="mt-6 space-y-3 text-center text-sm text-slate-500">
            <p>
              Want to join an existing community?{" "}
              <Link
                href="/register/member"
                className="font-semibold text-blue-600 hover:underline"
              >
                Register as a member
              </Link>
            </p>

            <p>
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Akshep
        </p>
      </div>
    </main>
  );
}
