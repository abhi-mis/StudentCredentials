'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Shield, GraduationCap, Building2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

export default function Home() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<'school' | 'student' | 'company'>('student');
  const [error, setError] = useState('');
  const { user, userRole, signIn, signUp, loading } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setError('');
    try {
      if (mode === 'login') {
        await signIn(values.email, values.password);
      } else {
        await signUp(values.email, values.password, selectedRole);
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during authentication');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Certificate Verification Platform</h1>
          <p className="text-muted-foreground mt-2">
            {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'register' && (
              <div className="space-y-3">
                <FormLabel>Account Type</FormLabel>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant={selectedRole === 'school' ? 'default' : 'outline'}
                    className="flex flex-col items-center justify-center h-auto py-3 gap-2"
                    onClick={() => setSelectedRole('school')}
                  >
                    <Shield className="h-5 w-5" />
                    <span>School</span>
                  </Button>
                  <Button
                    type="button"
                    variant={selectedRole === 'student' ? 'default' : 'outline'}
                    className="flex flex-col items-center justify-center h-auto py-3 gap-2"
                    onClick={() => setSelectedRole('student')}
                  >
                    <GraduationCap className="h-5 w-5" />
                    <span>Student</span>
                  </Button>
                  <Button
                    type="button"
                    variant={selectedRole === 'company' ? 'default' : 'outline'}
                    className="flex flex-col items-center justify-center h-auto py-3 gap-2"
                    onClick={() => setSelectedRole('company')}
                  >
                    <Building2 className="h-5 w-5" />
                    <span>Company</span>
                  </Button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full">
              {mode === 'login' ? 'Sign In' : 'Register'}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                onClick={() => setMode('register')}
                className="text-primary font-medium hover:underline"
              >
                Register
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-primary font-medium hover:underline"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}