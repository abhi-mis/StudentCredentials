'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Shield, GraduationCap, Building2, Loader2, Users, Sparkles, X, Award, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

const roleVariants = {
  student: {
    icon: GraduationCap,
    bg: 'from-blue-500 to-blue-600',
    text: 'text-blue-600',
  },
  school: {
    icon: Shield,
    bg: 'from-purple-500 to-purple-600',
    text: 'text-purple-600',
  },
  company: {
    icon: Building2,
    bg: 'from-emerald-500 to-emerald-600',
    text: 'text-emerald-600',
  },
};

const contributors = [
  {
    name: "Mr. Soham Goswami",
    role: "Assistant Professor",
    description: "Project Mentor & Guide",
    color: "text-purple-600",
    bg: "bg-purple-100",
    border: "border-purple-200",
    icon: Award,
    delay: 0.1
  },
  {
    name: "Nishka Shrimali",
    role: "Group Member",
    description: "Developer",
    color: "text-blue-600",
    bg: "bg-blue-100",
    border: "border-blue-200",
    icon: Code,
    delay: 0.4
  },
  {
    name: "Chaity Agarwal",
    role: "Group Member",
    description: "Developer",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    border: "border-emerald-200",
    icon: Code,
    delay: 0.8
  },
  {
    name: "Rupali Jain",
    role: "Group Member",
    description: "Developer",
    color: "text-rose-600",
    bg: "bg-rose-100",
    border: "border-rose-200",
    icon: Code,
    delay: 1.2
  },
];

export default function Home() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<'school' | 'student' | 'company'>('student');
  const [error, setError] = useState('');
  const [showTeam, setShowTeam] = useState(false);
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="rounded-full h-12 w-12 border-b-2 border-primary flex items-center justify-center"
        >
          <Loader2 className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8 lg:p-12 relative">
      {/* Floating Team Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowTeam(true)}
        className="fixed bottom-6 right-6 z-20"
      >
        <Button className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
          <Users className="h-6 w-6 text-white" />
        </Button>
      </motion.div>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center min-h-[calc(100vh-2rem)]"
      >
        <div className="max-w-md w-full mx-auto">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden p-8 sm:p-10"
          >
            <div className="text-center mb-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`inline-flex items-center justify-center p-3 rounded-full mb-4 bg-gradient-to-br ${roleVariants[selectedRole].bg}`}
              >
                <Shield className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br bg-clip-text text-transparent from-gray-900 to-gray-600">
                Certificate Verification
              </h1>
              <p className="text-muted-foreground mt-2">
                {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-destructive/10 text-destructive p-3 rounded-md mb-6 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Email</FormLabel>
                      <FormControl>
                        <motion.div whileHover={{ scale: 1.01 }}>
                          <Input
                            placeholder="you@example.com"
                            className="py-5 px-4 rounded-lg"
                            {...field}
                          />
                        </motion.div>
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
                      <FormLabel className="font-medium">Password</FormLabel>
                      <FormControl>
                        <motion.div whileHover={{ scale: 1.01 }}>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="py-5 px-4 rounded-lg"
                            {...field}
                          />
                        </motion.div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <AnimatePresence>
                  {mode === 'register' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <FormLabel className="font-medium">Account Type</FormLabel>
                      <div className="grid grid-cols-3 gap-3">
                        {(['school', 'student', 'company'] as const).map((role) => {
                          const Icon = roleVariants[role].icon;
                          return (
                            <motion.div
                              key={role}
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button
                                type="button"
                                variant={selectedRole === role ? 'default' : 'outline'}
                                className={`flex flex-col items-center justify-center h-auto py-3 gap-2 w-full ${
                                  selectedRole === role
                                    ? `bg-gradient-to-br ${roleVariants[role].bg} text-white`
                                    : ''
                                }`}
                                onClick={() => setSelectedRole(role)}
                              >
                                <Icon className="h-5 w-5" />
                                <span className="capitalize">{role}</span>
                              </Button>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className={`w-full py-6 rounded-lg text-lg font-medium ${
                      mode === 'register' ? `bg-gradient-to-br ${roleVariants[selectedRole].bg}` : ''
                    }`}
                  >
                    {mode === 'login' ? 'Sign In' : 'Register'}
                  </Button>
                </motion.div>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              {mode === 'login' ? (
                <motion.p whileHover={{ scale: 1.02 }}>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('register')}
                    className={`font-medium hover:underline ${roleVariants[selectedRole].text}`}
                  >
                    Register
                  </button>
                </motion.p>
              ) : (
                <motion.p whileHover={{ scale: 1.02 }}>
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className={`font-medium hover:underline ${roleVariants[selectedRole].text}`}
                  >
                    Sign In
                  </button>
                </motion.p>
              )}
            </div>
          </motion.div>
        </div>
      </motion.main>

      {/* Team Overlay */}
      <AnimatePresence>
        {showTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 flex items-center justify-center p-4"
            onClick={() => setShowTeam(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring' }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowTeam(false)}
                className="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>

              <div className="p-8">
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center justify-center p-3 rounded-full mb-4 bg-gradient-to-br from-purple-500 to-blue-500"
                  >
                    <Users className="w-8 h-8 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-800">Project Team</h2>
                  
                </div>

                <div className="space-y-6">
                  {contributors.map((person, index) => (
                    <motion.div
                      key={person.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: person.delay }}
                      whileHover={{ scale: 1.02 }}
                      className={`${person.bg} ${person.border} border rounded-xl p-5 flex items-start gap-4 transition-all`}
                    >
                      <div className={`${person.color} bg-white p-3 rounded-full`}>
                        <person.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className={`${person.color} font-bold`}>{person.name}</h3>
                        <p className="text-sm text-gray-600">{person.role}</p>
                        <p className="text-xs text-gray-500 mt-1">{person.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-8 pt-6 border-t border-gray-100 text-center"
                >
                  <p className="text-sm text-gray-500">Thanks for checking out our team!</p>
                  <div className="flex justify-center mt-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}