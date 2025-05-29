'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, FileUp, Upload } from 'lucide-react';
import { db, storage } from '@/lib/firebase';
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
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Student {
  id: string;
  name: string;
  studentId: string;
  email: string;
}

const formSchema = z.object({
  studentId: z.string().min(1, {
    message: 'Please select a student.',
  }),
  certificateName: z.string().min(2, {
    message: 'Certificate name must be at least 2 characters.',
  }),
  issueDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, {
    message: 'Please enter a valid date.',
  }),
  certificateFile: z.instanceof(FileList).refine(
    (files) => files.length > 0,
    {
      message: 'Certificate file is required.',
    }
  ),
});

// Function to generate SHA-256 hash
async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export default function UploadCertificate() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: '',
      certificateName: '',
      issueDate: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (!loading && (!user || userRole !== 'school')) {
      router.push('/');
      return;
    }

    const fetchStudents = async () => {
      if (!user) return;

      try {
        const studentsQuery = query(
          collection(db, 'students'),
          where('schoolId', '==', user.uid)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        
        const studentsData = studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          studentId: doc.data().studentId,
          email: doc.data().email,
        }));
        
        setStudents(studentsData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to fetch students');
        setIsLoading(false);
      }
    };

    if (user && userRole === 'school') {
      fetchStudents();
    }
  }, [user, userRole, loading, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || students.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const file = values.certificateFile[0];
      const fileExtension = file.name.split('.').pop();
      const fileName = `certificates/${user.uid}/${values.studentId}/${uuidv4()}.${fileExtension}`;
      const storageRef = ref(storage, fileName);
      
      // Generate file hash
      const fileHash = await generateFileHash(file);
      
      // Upload file
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Get student details
      const student = students.find(s => s.id === values.studentId);
      
      if (!student) {
        throw new Error('Student not found');
      }
      
      // Add certificate to Firestore
      await addDoc(collection(db, 'certificates'), {
        name: values.certificateName,
        issueDate: values.issueDate,
        uploadDate: new Date().toISOString(),
        fileURL: downloadURL,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileHash: fileHash, // Storing the generated hash
        schoolId: user.uid,
        studentId: values.studentId,
        studentName: student.name,
        studentEmail: student.email,
      });
      
      toast.success(`Certificate has been issued to ${student.name}. Hash: ${fileHash.substring(0, 8)}...`);
      
      form.reset({
        studentId: '',
        certificateName: '',
        issueDate: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Error uploading certificate:', error);
      toast.error('Failed to upload certificate');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading || isLoading) {
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
        <ToastContainer position="top-right" autoClose={5000} />
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/school')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Upload Certificate</h1>
            <p className="text-muted-foreground mt-1">
              Issue a new certificate to a student
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border">
          {students.length > 0 ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <option value="" disabled>
                            Select a student
                          </option>
                          {students.map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.name} ({student.studentId})
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certificateName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certificate Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Bachelor of Science in Computer Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certificateFile"
                  render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>Certificate File (PDF or Image)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => onChange(e.target.files)}
                          {...rest}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full gap-2" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Certificate
                    </>
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <FileUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No students enrolled yet</h3>
              <p className="text-muted-foreground mt-1 max-w-md">
                You need to enroll students before you can issue certificates to them
              </p>
              <Button
                onClick={() => router.push('/dashboard/school/enroll')}
                className="mt-6 gap-2"
              >
                <FileUp className="h-4 w-4" />
                Enroll Student First
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}