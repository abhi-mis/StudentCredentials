'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import * as z from 'zod';
import { Search, GraduationCap, User, Mail, Building2, FileText, Hash } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  program: string;
  enrollmentYear: string;
}

interface Certificate {
  id: string;
  name: string;
  fileHash: string;
  fileURL: string;
  issueDate: string;
}

const formSchema = z.object({
  searchQuery: z.string().min(1, {
    message: 'Please enter a student ID or email to search.',
  }),
});

const requestFormSchema = z.object({
  message: z.string().optional(),
});

export default function CompanyDashboard() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentCertificates, setStudentCertificates] = useState<Certificate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isFetchingCertificates, setIsFetchingCertificates] = useState(false);

  const searchForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      searchQuery: '',
    },
  });

  const requestForm = useForm<z.infer<typeof requestFormSchema>>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      message: '',
    },
  });

  useEffect(() => {
    if (!loading && (!user || userRole !== 'company')) {
      router.push('/');
    }
  }, [user, userRole, loading, router]);

  const onSearch = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    
    setIsSearching(true);
    setSearchResults([]);
    setSelectedStudent(null);
    setStudentCertificates([]);
    
    try {
      const queryTerm = values.searchQuery.trim();
      
      // Search by email
      let studentsQuery = query(
        collection(db, 'students'),
        where('email', '==', queryTerm)
      );
      let studentsSnapshot = await getDocs(studentsQuery);
      
      // If no results, search by student ID
      if (studentsSnapshot.empty) {
        studentsQuery = query(
          collection(db, 'students'),
          where('studentId', '==', queryTerm)
        );
        studentsSnapshot = await getDocs(studentsQuery);
      }
      
      const studentsData = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];
      
      setSearchResults(studentsData);
    } catch (error) {
      console.error('Error searching for students:', error);
      toast({
        title: 'Search failed',
        description: 'An error occurred while searching for students.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const onSelectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setIsFetchingCertificates(true);
    
    try {
      // Get student's certificates
      const certificatesQuery = query(
        collection(db, 'certificates'),
        where('studentId', '==', student.id)
      );
      const certificatesSnapshot = await getDocs(certificatesQuery);
      
      const certificatesData = certificatesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        fileHash: doc.data().fileHash,
        fileURL: doc.data().fileURL,
        issueDate: doc.data().issueDate,
      })) as Certificate[];
      
      setStudentCertificates(certificatesData);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast({
        title: 'Failed to load certificates',
        description: 'Could not fetch student certificates.',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingCertificates(false);
    }
  };

  const truncateHash = (hash: string) => {
    if (!hash) return 'No hash available';
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  const onSendRequest = async (values: z.infer<typeof requestFormSchema>) => {
    if (!user || !selectedStudent) return;
    
    setIsRequesting(true);
    
    try {
      // Check for existing request
      const existingRequestQuery = query(
        collection(db, 'accessRequests'),
        where('companyId', '==', user.uid),
        where('studentId', '==', selectedStudent.id),
        where('status', '==', 'pending')
      );
      const existingRequestSnapshot = await getDocs(existingRequestQuery);
      
      if (!existingRequestSnapshot.empty) {
        toast({
          title: 'Request already exists',
          description: 'You already have a pending request for this student.',
          variant: 'destructive',
        });
        setIsRequesting(false);
        return;
      }
      
      // Get company details
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('email', '==', user.email)
      ));
      
      // Create access request
      await addDoc(collection(db, 'accessRequests'), {
        companyId: user.uid,
        companyName: userDoc.docs[0]?.data()?.companyName || 'Unknown Company',
        companyEmail: user.email,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        studentEmail: selectedStudent.email,
        message: values.message || '',
        requestDate: new Date().toISOString(),
        status: 'pending',
      });
      
      toast({
        title: 'Request sent successfully',
        description: `Your request has been sent to ${selectedStudent.name}.`,
      });
      
      // Reset forms and state
      setSelectedStudent(null);
      setSearchResults([]);
      setStudentCertificates([]);
      searchForm.reset();
      requestForm.reset();
    } catch (error) {
      console.error('Error sending request:', error);
      toast({
        title: 'Request failed',
        description: 'An error occurred while sending your request.',
        variant: 'destructive',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
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
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Verify Certificates</h1>
          <p className="text-muted-foreground mt-1">
            Search for students and request access to their certificates
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border">
          <h2 className="text-lg font-semibold mb-4">Search for a Student</h2>
          
          <Form {...searchForm}>
            <form onSubmit={searchForm.handleSubmit(onSearch)} className="space-y-4">
              <FormField
                control={searchForm.control}
                name="searchQuery"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student ID or Email</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="Enter student ID or email" {...field} />
                        <Button type="submit" disabled={isSearching}>
                          {isSearching ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          {searchResults.length > 0 && !selectedStudent && (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium">Search Results</h3>
              
              {searchResults.map((student) => (
                <div 
                  key={student.id}
                  className="bg-muted/50 p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{student.name}</h4>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          ID: {student.studentId}
                        </div>
                        <div className="hidden sm:block">•</div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {student.email}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => onSelectStudent(student)}
                    variant="outline"
                    size="sm"
                    className="sm:flex-shrink-0"
                  >
                    View Certificates
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {selectedStudent && (
            <div className="mt-6 space-y-6">
              <div className="border rounded-lg overflow-hidden">
                <div className="p-4 bg-muted/50 border-b">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{selectedStudent.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedStudent.program} • {selectedStudent.enrollmentYear}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="text-sm font-medium mb-3">Request Certificate Access</h3>
                  
                  <Form {...requestForm}>
                    <form onSubmit={requestForm.handleSubmit(onSendRequest)} className="space-y-4">
                      <FormField
                        control={requestForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message (Optional)</FormLabel>
                            <FormControl>
                              <textarea 
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Explain why you need access to this student's certificates"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex gap-3">
                        <Button type="submit" className="gap-2" disabled={isRequesting}>
                          <Building2 className="h-4 w-4" />
                          {isRequesting ? 'Sending Request...' : 'Send Access Request'}
                        </Button>
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => setSelectedStudent(null)}
                        >
                          Back to Search
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>

              {/* Certificate List */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Available Certificates</h3>
                
                {isFetchingCertificates ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : studentCertificates.length > 0 ? (
                  <div className="space-y-3">
                    {studentCertificates.map((certificate) => (
                      <div key={certificate.id} className="bg-muted/10 p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <h4 className="font-medium">{certificate.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Issued: {formatDate(certificate.issueDate)}
                              </p>
                            </div>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground cursor-help">
                                  <Hash className="h-4 w-4" />
                                  <span className="font-mono">{truncateHash(certificate.fileHash)}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono max-w-xs break-all">{certificate.fileHash}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/10 p-6 rounded-lg text-center border">
                    <FileText className="h-8 w-8 text-muted-foreground mb-2 mx-auto" />
                    <h3 className="text-lg font-medium">No certificates found</h3>
                    <p className="text-muted-foreground mt-1">
                      This student doesn't have any certificates yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {searchResults.length === 0 && searchForm.formState.isSubmitted && !isSearching && (
            <div className="mt-6 bg-muted/50 p-6 rounded-lg text-center border">
              <Search className="h-8 w-8 text-muted-foreground mb-2 mx-auto" />
              <h3 className="text-lg font-medium">No students found</h3>
              <p className="text-muted-foreground mt-1">
                We couldn't find any students matching your search criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}