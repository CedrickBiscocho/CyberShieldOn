import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Shield, ArrowLeft, CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameWarning, setUsernameWarning] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user, checkUsernameAvailable, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for password reset redirect
  useEffect(() => {
    if (searchParams.get('reset') === 'true') {
      toast({
        title: 'Password reset',
        description: 'You can now sign in with your new password.',
      });
    }
  }, [searchParams, toast]);

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  const validateUsername = (value: string): string => {
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username must be less than 20 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Only letters, numbers, and underscores allowed';
    return '';
  };

  useEffect(() => {
    if (!isSignUp || !username) {
      setUsernameAvailable(null);
      setUsernameError('');
      setUsernameWarning('');
      return;
    }

    const error = validateUsername(username);
    if (error) {
      setUsernameError(error);
      setUsernameWarning('');
      setUsernameAvailable(null);
      return;
    }

    setUsernameError('');
    setUsernameWarning('');
    const timeoutId = setTimeout(async () => {
      setCheckingUsername(true);
      const result = await checkUsernameAvailable(username);
      
      if (result.error) {
        setUsernameWarning(result.error);
        setUsernameAvailable(true);
        setUsernameError('');
      } else if (!result.available) {
        setUsernameError('Username is already taken');
        setUsernameAvailable(false);
      } else {
        setUsernameAvailable(true);
        setUsernameError('');
      }
      setCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, isSignUp, checkUsernameAvailable]);

  const handleBack = () => {
    if (forgotPasswordMode) {
      setForgotPasswordMode(false);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Reset link sent',
          description: 'Check your email for a password reset link',
        });
        setForgotPasswordMode(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const usernameValidation = validateUsername(username);
        if (usernameValidation) {
          toast({
            title: 'Invalid username',
            description: usernameValidation,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        if (!usernameWarning) {
          const result = await checkUsernameAvailable(username);
          if (!result.error && !result.available) {
            toast({
              title: 'Username taken',
              description: 'Please choose a different username',
              variant: 'destructive',
            });
            setLoading(false);
            return;
          }
        }

        const { error } = await signUp(email, password, username);
        if (error) {
          toast({
            title: 'Sign up failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Account created!',
            description: 'You can now sign in.',
          });
          setIsSignUp(false);
          setPassword('');
          setUsername('');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Sign in failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Mode UI
  if (forgotPasswordMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="absolute top-4 left-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex flex-col items-center mb-6 mt-8">
            <Shield className="h-12 w-12 text-primary mb-4" />
            <h1 className="text-3xl font-bold text-gradient mb-2">
              Reset Password
            </h1>
            <p className="text-muted-foreground text-center">
              Enter your email to receive a reset link
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setForgotPasswordMode(false)}
              className="text-sm text-primary hover:underline"
            >
              Back to sign in
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="absolute top-4 left-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex flex-col items-center mb-6 mt-8">
          <Shield className="h-12 w-12 text-primary mb-4" />
          <h1 className="text-3xl font-bold text-gradient mb-2">
            CyberShieldOn
          </h1>
          <p className="text-muted-foreground text-center">
            {isSignUp ? 'Create your account' : 'Sign in to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={isSignUp}
                  className={usernameError ? 'border-destructive pr-10' : usernameAvailable ? 'border-green-500 pr-10' : 'pr-10'}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingUsername && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {!checkingUsername && usernameAvailable === true && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {!checkingUsername && usernameError && <XCircle className="h-4 w-4 text-destructive" />}
                </div>
              </div>
              {usernameError && (
                <p className="text-sm text-destructive">{usernameError}</p>
              )}
              {usernameWarning && !usernameError && (
                <p className="text-sm text-yellow-500">{usernameWarning}</p>
              )}
              {usernameAvailable && !usernameError && !usernameWarning && (
                <p className="text-sm text-green-500">Username is available</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="pr-10 [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            {!isSignUp && (
              <button
                type="button"
                onClick={() => setForgotPasswordMode(true)}
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || (isSignUp && (!!usernameError || checkingUsername || !usernameAvailable))}
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setPassword('');
              setUsername('');
              setUsernameError('');
              setUsernameWarning('');
              setUsernameAvailable(null);
              setShowPassword(false);
            }}
            className="text-sm text-primary hover:underline"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
