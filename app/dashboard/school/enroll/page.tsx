'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, addDoc } from 'firebase/firestore';
import * as z from 'zod';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
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
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  studentId: z.string().min(1, {
    message: 'Student ID is required.',
  }),
  program: z.string().min(1, {
    message: 'Program is required.',
  }),
  enrollmentYear: z.string().refine((val) => {
    const year = parseInt(val);
    return !isNaN(year) && year > 1900 && year <= new Date().getFullYear();
  }, {
    message: 'Please enter a valid enrollment year.',
  }),
});

export default function EnrollStudent() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      studentId: '',
      program: '',
      enrollmentYear: new Date().getFullYear().toString(),
    },
  });

  useEffect(() => {
    if (!loading && (!user || userRole !== 'school')) {
      router.push('/');
    }
  }, [user, userRole, loading, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    
    try {
      await addDoc(collection(db, 'students'), {
        name: values.name,
        email: values.email,
        studentId: values.studentId,
        program: values.program,
        enrollmentYear: values.enrollmentYear,
        schoolId: user.uid,
        createdAt: new Date().toISOString(),
      });
      
      toast({
        title: 'Student enrolled successfully!',
        description: 'The student has been added to your institution.',
      });
      
      form.reset();
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast({
        title: 'Failed to enroll student',
        description: 'An error occurred while enrolling the student.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/school')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Enroll Student</h1>
            <p className="text-muted-foreground mt-1">
              Add a new student to your institution
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.smith@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student ID</FormLabel>
                      <FormControl>
                        <Input placeholder="S12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enrollmentYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enrollment Year</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="program"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program</FormLabel>
                    <FormControl>
                      <Input placeholder="Computer Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full gap-2">
                <UserPlus className="h-4 w-4" />
                Enroll Student
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </DashboardLayout>
  );
}