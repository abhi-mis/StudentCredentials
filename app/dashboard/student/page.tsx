'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Scroll, FileText, ExternalLink, Clock, Hash } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Certificate {
  id: string;
  name: string;
  issueDate: string;
  uploadDate: string;
  fileURL: string;
  fileName: string;
  fileType: string;
  schoolId: string;
  fileHash: string;
}

export default function StudentDashboard() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || userRole !== 'student')) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      if (!user) return;

      try {
        // Find the student document for this user
        const studentsQuery = query(
          collection(db, 'students'),
          where('email', '==', user.email)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        
        if (studentsSnapshot.empty) {
          setIsLoading(false);
          return;
        }
        
        const studentId = studentsSnapshot.docs[0].id;
        
        // Get certificates for this student
        const certificatesQuery = query(
          collection(db, 'certificates'),
          where('studentId', '==', studentId)
        );
        const certificatesSnapshot = await getDocs(certificatesQuery);
        
        const certificatesData = certificatesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Certificate[];
        
        setCertificates(certificatesData);
        
        // Get pending access requests
        const accessRequestsQuery = query(
          collection(db, 'accessRequests'),
          where('studentId', '==', studentId),
          where('status', '==', 'pending')
        );
        const accessRequestsSnapshot = await getDocs(accessRequestsQuery);
        
        setPendingRequests(accessRequestsSnapshot.size);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };

    if (user && userRole === 'student') {
      fetchData();
    }
  }, [user, userRole, loading, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const truncateHash = (hash: string) => {
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
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
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Certificates</h1>
            <p className="text-muted-foreground mt-1">
              View and manage your certificates
            </p>
          </div>
          {pendingRequests > 0 && (
            <Button 
              onClick={() => router.push('/dashboard/student/requests')}
              variant="outline"
              className="gap-2"
            >
              <Clock className="h-4 w-4" />
              {pendingRequests} Pending Request{pendingRequests !== 1 && 's'}
            </Button>
          )}
        </div>

        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((certificate) => (
              <div key={certificate.id} className="bg-white rounded-lg shadow border overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-br from-primary/5 to-primary/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-semibold truncate">{certificate.name}</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Issued on {formatDate(certificate.issueDate)}
                      </p>
                    </div>
                    <div className="bg-white rounded-full p-2 shadow">
                      <Scroll className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <FileText className="h-4 w-4 mr-2" />
                    {certificate.fileName}
                  </div>
                  {certificate.fileHash && (
                    <div className="flex items-center text-sm text-muted-foreground mb-4">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center cursor-help">
                              <Hash className="h-4 w-4 mr-2" />
                              <span className="font-mono">{truncateHash(certificate.fileHash)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-mono">{certificate.fileHash}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                  <Button 
                    onClick={() => window.open(certificate.fileURL, '_blank')}
                    className="w-full gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Certificate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow border p-12 flex flex-col items-center justify-center text-center">
            <Scroll className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">No certificates found</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              You don't have any certificates yet. Contact your institution if you believe this is an error.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}