'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Check, X, Building2, Shield, ShieldOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AccessRequest {
  id: string;
  companyId: string;
  companyName: string;
  companyEmail: string;
  studentId: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'denied' | 'revoked';
  message?: string;
  responseDate?: string;
}

export default function StudentRequests() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || userRole !== 'student')) {
      router.push('/');
      return;
    }

    const fetchRequests = async () => {
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
        
        // Get access requests for this student
        const requestsQuery = query(
          collection(db, 'accessRequests'),
          where('studentId', '==', studentId)
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        
        const requestsData = requestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as AccessRequest[];
        
        // Sort requests: pending first, then approved, then others by date
        const sortedRequests = requestsData.sort((a, b) => {
          // Priority order: pending > approved > denied/revoked
          const statusPriority = { pending: 0, approved: 1, denied: 2, revoked: 2 };
          const aPriority = statusPriority[a.status] ?? 3;
          const bPriority = statusPriority[b.status] ?? 3;
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          
          return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
        });
        
        setRequests(sortedRequests);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching requests:', error);
        setIsLoading(false);
      }
    };

    if (user && userRole === 'student') {
      fetchRequests();
    }
  }, [user, userRole, loading, router]);

  const handleRequestResponse = async (requestId: string, status: 'approved' | 'denied') => {
    try {
      await updateDoc(doc(db, 'accessRequests', requestId), {
        status,
        responseDate: new Date().toISOString(),
      });
      
      // Update the local state
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status, responseDate: new Date().toISOString() } : req
      ));
      
      toast({
        title: `Request ${status === 'approved' ? 'approved' : 'denied'}`,
        description: `You have ${status === 'approved' ? 'granted' : 'denied'} access to your certificates.`,
      });
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: 'Failed to update request',
        description: 'An error occurred while processing your response.',
        variant: 'destructive',
      });
    }
  };

  const handleRevokeAccess = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'accessRequests', requestId), {
        status: 'revoked',
        revokedDate: new Date().toISOString(),
      });
      
      // Update the local state
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: 'revoked' as const } : req
      ));
      
      toast({
        title: 'Access revoked',
        description: 'You have successfully revoked access to your certificates.',
      });
    } catch (error) {
      console.error('Error revoking access:', error);
      toast({
        title: 'Failed to revoke access',
        description: 'An error occurred while revoking access.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const getStatusBadge = (status: AccessRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center text-amber-500 bg-amber-50 px-2 py-1 rounded text-xs font-medium">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </div>
        );
      case 'approved':
        return (
          <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-medium">
            <Check className="h-3 w-3 mr-1" />
            Approved
          </div>
        );
      case 'denied':
        return (
          <div className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-medium">
            <X className="h-3 w-3 mr-1" />
            Denied
          </div>
        );
      case 'revoked':
        return (
          <div className="flex items-center text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs font-medium">
            <ShieldOff className="h-3 w-3 mr-1" />
            Revoked
          </div>
        );
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
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/student')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Access Requests</h1>
            <p className="text-muted-foreground mt-1">
              Manage requests from companies to view your certificates
            </p>
          </div>
        </div>

        {requests.length > 0 ? (
          <div className="space-y-6">
            {requests.map((request) => (
              <div 
                key={request.id} 
                className={`bg-white rounded-lg shadow border overflow-hidden ${
                  request.status === 'pending' ? 'ring-2 ring-primary/20' : ''
                } ${
                  request.status === 'approved' ? 'ring-2 ring-green-200' : ''
                }`}
              >
                <div className="p-6 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-semibold">{request.companyName}</h2>
                        <p className="text-sm text-muted-foreground">
                          {request.companyEmail}
                        </p>
                        {request.status === 'approved' && (
                          <div className="flex items-center gap-1 mt-1">
                            <Shield className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">
                              Currently has access
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Request Date:</span>{' '}
                      {formatDate(request.requestDate)}
                    </p>
                    
                    {request.responseDate && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium text-foreground">Response Date:</span>{' '}
                        {formatDate(request.responseDate)}
                      </p>
                    )}
                    
                    {request.message && (
                      <div className="mt-3">
                        <p className="text-sm font-medium">Message:</p>
                        <p className="text-sm mt-1 bg-muted/50 p-3 rounded">{request.message}</p>
                      </div>
                    )}
                  </div>
                  
                  {request.status === 'pending' ? (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleRequestResponse(request.id, 'approved')}
                        className="flex-1 gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRequestResponse(request.id, 'denied')}
                        variant="outline"
                        className="flex-1 gap-2"
                      >
                        <X className="h-4 w-4" />
                        Deny
                      </Button>
                    </div>
                  ) : request.status === 'approved' ? (
                    <div className="space-y-3">
                      <p className="text-sm text-green-600 italic">
                        ✓ You approved this request - Company can access your certificates
                      </p>
                      <Button
                        onClick={() => handleRevokeAccess(request.id)}
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                      >
                        <ShieldOff className="h-4 w-4" />
                        Revoke Access
                      </Button>
                    </div>
                  ) : request.status === 'denied' ? (
                    <p className="text-sm text-red-600 italic">
                      ✗ You denied this request
                    </p>
                  ) : request.status === 'revoked' ? (
                    <p className="text-sm text-orange-600 italic">
                      ⚠ You revoked access for this request
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow border p-12 flex flex-col items-center justify-center text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">No access requests</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              You don't have any access requests from companies yet.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}