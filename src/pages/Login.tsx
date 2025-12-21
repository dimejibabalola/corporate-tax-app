import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/');
      }
      if (event === 'AuthApiError') {
         setErrorMessage("Authentication error. Please try again.");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-neutral-950 p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white dark:bg-neutral-900 p-8 shadow-lg border border-gray-100 dark:border-neutral-800">
        <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Welcome to TaxPrep</h1>
            <p className="text-sm text-muted-foreground">Sign in to track your individual progress</p>
        </div>
        
        {errorMessage && (
            <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
        )}

        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
                default: {
                    colors: {
                        brand: 'hsl(var(--primary))',
                        brandAccent: 'hsl(var(--primary))',
                    }
                }
            }
          }}
          theme="light"
          providers={[]}
        />
      </div>
    </div>
  );
};

export default Login;