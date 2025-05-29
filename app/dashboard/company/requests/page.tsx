'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { GraduationCap, Clock, Check, X, ExternalLink, Hash } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';

interface AccessRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  requestDate: string;
  responseDate?: string;
  status: 'pending' | 'approved' | 'denied';
  message?: string;
}

interface Certificate {
  id: string;
  name: string;
  issueDate: string;
  fileURL: string;
  fileName: string;
  fileHash: string;
}

export default function CompanyRequests() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [certificates, setCertificates] = useState<{ [studentId: string]: Certificate[] }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || userRole !== 'company')) {
      router.push('/');
      return;
    }

    const fetchRequests = async () => {
      if (!user) return;

      try {
        // Get access requests created by this company
        const requestsQuery = query(
          collection(db, 'accessRequests'),
          where('companyId', '==', user.uid)
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        
        const requestsData = requestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as AccessRequest[];
        
        // Sort requests: pending first, then approved, then denied
        const sortedRequests = requestsData.sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          if (a.status === 'approved' && b.status !== 'approved') return -1;
          if (a.status !== 'approved' && b.status === 'approved') return 1;
          return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
        });
        
        setRequests(sortedRequests);
        
        // For approved requests, fetch certificates
        const certificatesData: { [studentId: string]: Certificate[] } = {};
        
        for (const request of sortedRequests) {
          if (request.status === 'approved') {
            const certificatesQuery = query(
              collection(db, 'certificates'),
              where('studentId', '==', request.studentId)
            );
            const certificatesSnapshot = await getDocs(certificatesQuery);
            
            certificatesData[request.studentId] = certificatesSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            })) as Certificate[];
          }
        }
        
        setCertificates(certificatesData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching requests:', error);
        setIsLoading(false);
      }
    };

    if (user && userRole === 'company') {
      fetchRequests();
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
            <h1 className="text-2xl font-bold tracking-tight">Access Requests</h1>
            <p className="text-muted-foreground mt-1">
              Track the status of your certificate access requests
            </p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/company')}
            variant="outline"
          >
            Request New Access
          </Button>
        </div>

        {requests.length > 0 ? (
          <div className="space-y-8">
            {requests.map((request) => (
              <div 
                key={request.id} 
                className={`bg-white rounded-lg shadow border overflow-hidden ${
                  request.status === 'pending' ? 'ring-2 ring-primary/20' : ''
                }`}
              >
                <div className="p-6 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-semibold">{request.studentName}</h2>
                        <p className="text-sm text-muted-foreground">
                          {request.studentEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {request.status === 'pending' ? (
                        <div className="flex items-center text-amber-500 bg-amber-50 px-2 py-1 rounded text-xs font-medium">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </div>
                      ) : request.status === 'approved' ? (
                        <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-medium">
                          <Check className="h-3 w-3 mr-1" />
                          Approved
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-medium">
                          <X className="h-3 w-3 mr-1" />
                          Denied
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">Requested:</span>{' '}
                        {formatDate(request.requestDate)}
                      </p>
                      
                      {request.responseDate && (
                        <p>
                          <span className="font-medium text-foreground">Response:</span>{' '}
                          {formatDate(request.responseDate)}
                        </p>
                      )}
                    </div>
                    
                    {request.message && (
                      <div className="mt-3">
                        <p className="text-sm font-medium">Your message:</p>
                        <p className="text-sm mt-1 bg-muted/50 p-3 rounded">{request.message}</p>
                      </div>
                    )}
                  </div>
                  
                  {request.status === 'pending' ? (
                    <p className="text-sm text-muted-foreground italic">
                      Waiting for the student to respond to your request.
                    </p>
                  ) : request.status === 'denied' ? (
                    <p className="text-sm text-muted-foreground italic">
                      The student has denied your request to view their certificates.
                    </p>
                  ) : (
                    <div>
                      <h3 className="text-sm font-medium mb-3">Certificates</h3>
                      
                      {certificates[request.studentId]?.length > 0 ? (
                        <div className="space-y-3">
                          {certificates[request.studentId].map((cert) => (
                            <div key={cert.id} className="flex justify-between items-start p-3 bg-muted/50 rounded border">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">{cert.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Issued on {formatDate(cert.issueDate)}
                                </p>
                                {cert.fileHash && (
                                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center cursor-help">
                                            <Hash className="h-3 w-3 mr-1" />
                                            <span className="font-mono">{truncateHash(cert.fileHash)}</span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="font-mono">{cert.fileHash}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                )}
                              </div>
                              <Link href={cert.fileURL} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No certificates found for this student.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow border p-12 flex flex-col items-center justify-center text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">No access requests</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              You haven't requested access to any student certificates yet.
            </p>
            <Button
              onClick={() => router.push('/dashboard/company')}
              className="mt-6"
            >
              Request Access
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}