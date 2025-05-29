'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { UserPlus, FileUp, Scroll } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  certificateCount: number;
}

export default function SchoolDashboard() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        
        const studentsData: Student[] = [];
        
        for (const doc of studentsSnapshot.docs) {
          const studentData = doc.data();
          
          // Get certificate count
          const certificatesQuery = query(
            collection(db, 'certificates'),
            where('studentId', '==', doc.id)
          );
          const certificatesSnapshot = await getDocs(certificatesQuery);
          
          studentsData.push({
            id: doc.id,
            name: studentData.name,
            email: studentData.email,
            studentId: studentData.studentId,
            certificateCount: certificatesSnapshot.size
          });
        }
        
        setStudents(studentsData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching students:', error);
        setIsLoading(false);
      }
    };

    if (user && userRole === 'school') {
      fetchStudents();
    }
  }, [user, userRole, loading, router]);

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
            <h1 className="text-2xl font-bold tracking-tight">School Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your students and certificates
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => router.push('/dashboard/school/enroll')} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Enroll Student
            </Button>
            <Button onClick={() => router.push('/dashboard/school/upload')} className="gap-2">
              <FileUp className="h-4 w-4" />
              Upload Certificate
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Students</h2>
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold mt-2">{students.length}</p>
            <p className="text-muted-foreground text-sm mt-1">Total enrolled students</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Certificates</h2>
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Scroll className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold mt-2">
              {students.reduce((total, student) => total + student.certificateCount, 0)}
            </p>
            <p className="text-muted-foreground text-sm mt-1">Total issued certificates</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Enrolled Students</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your enrolled students and their certificates
            </p>
          </div>
          
          {students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Student ID</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Certificates</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-t hover:bg-muted/50">
                      <td className="py-4 px-6">{student.name}</td>
                      <td className="py-4 px-6">{student.studentId}</td>
                      <td className="py-4 px-6">{student.email}</td>
                      <td className="py-4 px-6">{student.certificateCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No students enrolled yet</h3>
              <p className="text-muted-foreground text-center mt-1 max-w-md">
                Start by enrolling students to issue certificates to them
              </p>
              <Button
                onClick={() => router.push('/dashboard/school/enroll')}
                className="mt-6 gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Enroll Student
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}