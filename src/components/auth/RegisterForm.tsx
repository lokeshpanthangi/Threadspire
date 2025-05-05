
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const RegisterForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!name.trim()) return "Name is required";
    if (!email.trim()) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Email is invalid";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError("");
    setIsSubmitting(true);

    try {
      await register(name, email, password);
      navigate("/"); // Redirect to home page after successful registration
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 p-6 bg-card rounded-lg shadow-sm border border-border">
      <div className="text-center">
        <h1 className="text-2xl font-semibold font-playfair">Create Account</h1>
        <p className="text-muted-foreground mt-2">Join ThreadSpire today</p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-threadspire-gold/50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-threadspire-gold/50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-threadspire-gold/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Password must be at least 8 characters
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm-password" className="text-sm font-medium">
            Confirm Password
          </label>
          <input
            id="confirm-password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-threadspire-gold/50"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-threadspire-navy hover:bg-threadspire-navy/90 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-threadspire-navy"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <div className="text-center text-sm">
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-threadspire-gold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
