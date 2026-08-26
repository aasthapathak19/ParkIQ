import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/hooks/useToast';
import { reportsApi } from '@/services/api';
import { ReportReason } from '@/types';

const reportSchema = z.object({
  reason: z.string().min(1, 'Please select a reason'),
  description: z.string().max(2000).optional(),
});

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  parkingId: string;
  parkingName: string;
}

export const ReportModal = ({ isOpen, onClose, parkingId, parkingName }: ReportModalProps) => {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: { reason: '', description: '' }
  });

  const onSubmit = async (data: any) => {
    try {
      await reportsApi.createReport(parkingId, data);
      toast({ title: 'Report Submitted', description: 'Thank you for keeping ParkIQ safe.' });
      reset();
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to submit report', variant: 'error' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Parking</DialogTitle>
          <DialogDescription>
            Are you experiencing an issue with "{parkingName}"? Please let us know.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div>
            <Label>Reason</Label>
            <Select {...register('reason')} className="mt-1">
              <option value="">Select a reason...</option>
              <option value="DOESNT_EXIST">Parking Does Not Exist</option>
              <option value="WRONG_LOCATION">Wrong Location</option>
              <option value="FAKE_LISTING">Fake/Fraudulent Listing</option>
              <option value="UNAUTHORIZED">Unauthorized Operator</option>
              <option value="WRONG_AVAILABILITY">Wrong Availability</option>
              <option value="FRAUD_PAYMENT">Payment Issue / Fraud</option>
              <option value="SAFETY_CONCERN">Safety Concern</option>
              <option value="OTHER">Other</option>
            </Select>
            {errors.reason && <span className="text-red-500 text-sm">{errors.reason.message as string}</span>}
          </div>
          <div>
            <Label>Description (Optional)</Label>
            <Textarea 
              {...register('description')} 
              placeholder="Please provide more details to help our admins investigate..."
              className="mt-1 h-24"
            />
            {errors.description && <span className="text-red-500 text-sm">{errors.description.message as string}</span>}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>Submit Report</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
