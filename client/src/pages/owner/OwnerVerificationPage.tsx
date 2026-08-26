import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/hooks/useToast';
import { verificationApi } from '@/services/api';
import { IParkingVerification, VerificationType } from '@/types';

const evidenceSchema = z.object({
  evidenceType: z.string().min(2, 'Required'),
  description: z.string(),
  fileKey: z.string().min(1, 'Please upload a file'),
  mimeType: z.string().min(1),
});

export const OwnerVerificationPage = () => {
  const { parkingId } = useParams<{ parkingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verification, setVerification] = useState<IParkingVerification | null>(null);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm({
    resolver: zodResolver(evidenceSchema),
    defaultValues: {
      evidenceType: '',
      description: '',
      fileKey: '',
      mimeType: '',
    }
  });

  useEffect(() => {
    if (parkingId) fetchVerification();
  }, [parkingId]);

  const fetchVerification = async () => {
    try {
      const res = await verificationApi.getVerificationStatus(parkingId!);
      setVerification(res.data.data);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to fetch verification status', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const onUpdateType = async (verificationType: VerificationType) => {
    try {
      await verificationApi.updateVerificationType(parkingId!, verificationType);
      toast({ title: 'Success', description: 'Verification type updated' });
      fetchVerification();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message, variant: 'error' });
    }
  };

  const onSubmitEvidence = async (data: any) => {
    try {
      await verificationApi.addEvidence(parkingId!, data);
      toast({ title: 'Evidence added', description: 'Your file has been added to the application' });
      setValue('evidenceType', '');
      setValue('description', '');
      setValue('fileKey', '');
      setValue('mimeType', '');
      fetchVerification();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message, variant: 'error' });
    }
  };

  const onSubmitVerification = async () => {
    try {
      await verificationApi.submitVerification(parkingId!);
      toast({ title: 'Success', description: 'Verification submitted for review' });
      navigate('/owner/dashboard');
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message, variant: 'error' });
    }
  };

  // Mock file upload for Phase 3
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, upload to storage and get key
      setValue('fileKey', `mock-key-${Date.now()}`);
      setValue('mimeType', file.type || 'application/octet-stream');
      toast({ title: 'File attached', description: file.name });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!verification) return <div>Verification record not found. Please contact support.</div>;

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Verify Your Parking</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current Status: {verification.status}</CardTitle>
          <CardDescription>
            {verification.status === 'DRAFT' && 'Please provide documentation to verify your listing.'}
            {verification.status === 'UNDER_REVIEW' && 'Your application is being reviewed by an admin.'}
            {verification.status === 'VERIFIED' && 'Your parking is successfully verified!'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verification.reviewReason && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
              <strong>Admin Feedback:</strong> {verification.reviewReason}
            </div>
          )}
          
          <div className="mb-4">
            <Label>Verification Type</Label>
            <Select 
              value={verification.verificationType}
              onChange={(e) => onUpdateType(e.target.value as VerificationType)}
              disabled={['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED'].includes(verification.status)}
              className="mt-1"
            >
              <option value="PROPERTY_OWNER">Property Owner</option>
              <option value="LEASE_HOLDER">Lease Holder</option>
              <option value="AUTHORIZED_OPERATOR">Authorized Operator</option>
              <option value="BUSINESS_OPERATOR">Business Operator</option>
              <option value="PROPERTY_MANAGER">Property Manager</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {['DRAFT', 'MORE_INFO_REQUIRED'].includes(verification.status) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Evidence</CardTitle>
            <CardDescription>Upload documents proving your authorization. Files are kept strictly private.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmitEvidence)} className="space-y-4">
              <div>
                <Label>Document Type</Label>
                <Input {...register('evidenceType')} placeholder="e.g. Property Deed, Lease Agreement, ID" />
                {errors.evidenceType && <span className="text-red-500 text-sm">{errors.evidenceType.message as string}</span>}
              </div>
              <div>
                <Label>Description (Optional)</Label>
                <Input {...register('description')} placeholder="Any helpful notes for the admin" />
              </div>
              <div>
                <Label>Upload File</Label>
                <Input type="file" onChange={handleFileUpload} />
                {errors.fileKey && <span className="text-red-500 text-sm">Please attach a file</span>}
              </div>
              <Button type="submit" disabled={isSubmitting}>Add Evidence</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {['DRAFT', 'MORE_INFO_REQUIRED'].includes(verification.status) && (
        <Button onClick={onSubmitVerification} className="w-full" size="lg">
          Submit Application for Review
        </Button>
      )}
    </div>
  );
};
