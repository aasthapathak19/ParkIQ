import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { verificationApi } from '@/services/api';
import { IParkingVerification } from '@/types';
import { useToast } from '@/hooks/useToast';
import { Link } from 'react-router-dom';

export const AdminVerificationsPage = () => {
  const [verifications, setVerifications] = useState<IParkingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const res = await verificationApi.adminListAll();
      setVerifications(res.data.data.data);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Verification Queue</h1>
      
      {loading ? (
        <div>Loading...</div>
      ) : verifications.length === 0 ? (
        <div>No verifications found.</div>
      ) : (
        <div className="grid gap-4">
          {verifications.map((ver) => (
            <Card key={ver._id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">
                    {typeof ver.parkingId === 'object' ? ver.parkingId.name : 'Unknown Parking'}
                  </h3>
                  <div className="text-sm text-gray-500">
                    Owner: {typeof ver.ownerId === 'object' ? ver.ownerId.name : 'Unknown'}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={ver.status === 'VERIFIED' ? 'success' : ver.status === 'REJECTED' ? 'error' : 'warning'}>
                      {ver.status}
                    </Badge>
                    <Badge variant="outline">{ver.verificationType}</Badge>
                    {ver.duplicateWarnings?.length > 0 && (
                      <Badge variant="error">Duplicate Warning</Badge>
                    )}
                  </div>
                </div>
                <Button asChild>
                  <Link to={`/admin/verifications/${ver._id}`}>Review</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
