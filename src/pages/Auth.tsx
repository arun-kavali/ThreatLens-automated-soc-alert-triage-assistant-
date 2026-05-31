import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, AlertCircle, Mail, Lock, Users, Radio, UserCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type SignInMode = "analyst" | "alert_source";

// Strong password validation for SOC security application
const validatePassword = (password: string): { valid: boolean; message: string } => {
  const minLength = 12;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (password.length < minLength) {
    return { valid: false, message: `Password must be at least ${minLength} characters` };
  }

  const requirementsMet = [hasUpperCase, hasLowerCase, hasNumber, hasSpecial].filter(Boolean).length;
  if (requirementsMet < 3) {
    return { valid: false, message: "Password needs 3 of: uppercase, lowercase, number, special character" };
  }

  // Check against common passwords
  const commonPasswords = ['password', 'admin', 'welcome', 'test', '123456', 'qwerty', 'letmein'];
  const lowerPassword = password.toLowerCase();
  for (const common of commonPasswords) {
    if (lowerPassword.includes(common)) {
      return { valid: false, message: "Password contains common words or patterns" };
    }
  }

  return { valid: true, message: "" };
};

// Email validation
const validateEmail = (email: string): { valid: boolean; message: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: "Invalid email address" };
  }
  return { valid: true, message: "" };
};

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [signInMode, setSignInMode] = useState<SignInMode>("analyst");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; displayName?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, signUp, user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle redirect when already logged in
  useEffect(() => {
    if (user && role) {
      if (role === "alert_source") {
        navigate("/alert-source", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, role, navigate]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const emailResult = validateEmail(email);
    if (!emailResult.valid) {
      newErrors.email = emailResult.message;
    }

    // Only enforce strong password rules on signup, not login
    if (!isLogin) {
      const passwordResult = validatePassword(password);
      if (!passwordResult.valid) {
        newErrors.password = passwordResult.message;
      }
    } else if (password.length < 1) {
      newErrors.password = "Password is required";
    }

    if (!isLogin && !displayName.trim()) {
      newErrors.displayName = "Display name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error, role: userRole } = await signIn(email, password);
        if (error) {
          toast({
            variant: "destructive",
            title: "Sign in failed",
            description: error.message === "Failed to fetch"
              ? "Network error — please check your connection and try again."
              : error.message,
          });
        } else if (userRole) {
          if (userRole === "alert_source") {
            navigate("/alert-source", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        }
      } else {
        const selectedRole = signInMode === "alert_source" ? "alert_source" : "analyst";
        const { error } = await signUp(email, password, displayName, selectedRole);
        if (error) {
          toast({
            variant: "destructive",
            title: "Sign up failed",
            description: error.message === "Failed to fetch"
              ? "Network error — please check your connection and try again."
              : error.message,
          });
        } else {
          toast({
            title: "Account created",
            description: "Please check your email to verify your account.",
          });
        }
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: isLogin ? "Sign in failed" : "Sign up failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Green Gradient Branding with Wave Pattern */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, hsl(168, 76%, 42%) 0%, hsl(174, 72%, 40%) 50%, hsl(180, 65%, 35%) 100%)'
      }}>
        {/* Wave pattern overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23ffffff' fill-opacity='0.05' d='M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '100% 200px',
          opacity: 0.4,
        }} />
        
        {/* Radial wave pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="waves" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
                <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2"/>
                <circle cx="50" cy="50" r="20" fill="none" stroke="white" strokeWidth="0.5" opacity="0.1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#waves)"/>
          </svg>
        </div>

        {/* Animated concentric circles */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-30">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white/20"
              style={{
                width: `${(i + 1) * 120}px`,
                height: `${(i + 1) * 120}px`,
                top: `${-(i + 1) * 60}px`,
                left: `${-(i + 1) * 60}px`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-white" />
            <span className="text-xl font-semibold text-white">ThreatLens</span>
          </div>

          {/* Main Content */}
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              Protect your infrastructure,
              <br />
              anytime, anywhere.
            </h1>
            <p className="text-white/80 text-base leading-relaxed">
              AI-powered SOC alert triage that reduces noise and highlights real threats, helping your security team respond faster.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 text-white/70 text-sm">
            <Users className="h-5 w-5" />
            <span>AI-driven SOC triage simulation</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white min-h-screen">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Shield className="h-10 w-10 text-primary mr-2" />
            <span className="text-2xl font-bold text-gray-900">ThreatLens</span>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              {isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-gray-500 mt-2">
              {isLogin
                ? "Sign in to your account to continue"
                : "Sign up to get started"}
            </p>
          </div>

          {/* Sign-in Mode Toggle - Only show for SIGNUP */}
          {!isLogin && (
            <div className="space-y-3">
              <Label className="text-gray-700">Register as</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSignInMode("analyst")}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    signInMode === "analyst"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <UserCheck className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">SOC Analyst</div>
                    <div className="text-xs opacity-70">View & analyze</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSignInMode("alert_source")}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    signInMode === "alert_source"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Radio className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Alert Source</div>
                    <div className="text-xs opacity-70">Submit alerts</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Info - Only on Sign Up */}
            {!isLogin && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary/80">
                  {signInMode === "alert_source" ? (
                    <>You will be able to <span className="font-medium">submit security alerts</span> to the SOC for processing.</>
                  ) : (
                    <>You will be able to <span className="font-medium">view and analyze</span> security alerts and incidents.</>
                  )}
                </p>
              </div>
            )}

            {/* Display Name - Only on Sign Up */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-gray-700">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={`bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 h-12 ${errors.displayName ? "border-red-500" : ""}`}
                />
                {errors.displayName && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.displayName}
                  </p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 pl-10 h-12 ${errors.email ? "border-red-500" : ""}`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                {isLogin && (
                  <button
                    type="button"
                    className="text-sm text-gray-500 hover:text-primary transition-colors"
                    onClick={() => {
                      toast({
                        title: "Password Reset",
                        description: "Please contact your administrator to reset your password.",
                      });
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Strong password (12+ chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 pl-10 pr-10 h-12 ${errors.password ? "border-red-500" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}
              {!isLogin && (
                <p className="text-xs text-gray-500">
                  Min 12 chars with 3 of: uppercase, lowercase, number, special
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Please wait...
                </>
              ) : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-gray-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
                setDisplayName("");
              }}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
