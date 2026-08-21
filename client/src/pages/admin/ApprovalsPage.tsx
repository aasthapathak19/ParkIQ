import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Check, X, MapPin, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge, Skeleton, EmptyState } from '@/components/ui/index';
import { parkingApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/stores/uiStore';
import { IParkingLot } from '@/types';

const ApprovalsPage: React.FC = () => {
  const toast = useToast();
  const qc = useQueryClient();
  const [rejectReason, setRejectReason] = useState<{ id: string; reason: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.adminParkingApprovals({ status: 'pending' }),
    queryFn: () => parkingApi.search({ page: 1, limit: 20 }).then((r) => r.data.data),
  });

  const { mutate: approve, isPending: isApproving } = useMutation({
    mutationFn: (id: string) => parkingApi.approveLot(id),
    onSuccess: () => { toast.success('Lot approved!'); qc.invalidateQueries({ queryKey: ['admin', 'parking-approvals'] }); },
    onError: () => toast.error('Could not approve lot.'),
  });

  const { mutate: reject } = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => parkingApi.rejectLot(id, reason),
    onSuccess: () => { toast.success('Lot rejected.'); qc.invalidateQueries({ queryKey: ['admin', 'parking-approvals'] }); setRejectReason(null); },
    onError: () => toast.error('Could not reject lot.'),
  });

  const pendingLots = ((data as { data: IParkingLot[] } | undefined)?.data ?? []).filter((l) => l.status === 'pending');

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Parking Lot Approvals</h1>
          <p className="text-sm text-neutral-400">Review and approve/reject submitted parking lots</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}</div>
        ) : pendingLots.length === 0 ? (
          <EmptyState icon={<ShieldCheck className="w-16 h-16" />} title="All clear!" description="No pending parking lots require approval." />
        ) : (
          <div className="space-y-3">
            {pendingLots.map((lot, i) => (
              <motion.div
                key={lot._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass rounded-xl p-5 border border-amber-500/15"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{lot.name}</h3>
                      <Badge variant="yellow">pending</Badge>
                    </div>
                    <p className="text-sm text-neutral-400 flex items-center gap-1 mb-2">
                      <MapPin className="w-3.5 h-3.5" />
                      {lot.address.formattedAddress ?? `${lot.address.street}, ${lot.address.city}, ${lot.address.state}`}
                    </p>
                    {lot.description && <p className="text-xs text-neutral-500 mb-2 line-clamp-2">{lot.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                      <span>Total slots: {lot.capacity.total}</span>
                      <span>₹{lot.pricing.baseRate}/{lot.pricing.billingUnit}</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />Owner ID: {lot.owner.toString().slice(-8)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                      loading={isApproving}
                      onClick={() => approve(lot._id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<X className="w-3.5 h-3.5" />}
                      onClick={() => setRejectReason({ id: lot._id, reason: '' })}
                    >
                      Reject
                    </Button>
                  </div>
                </div>

                {rejectReason?.id === lot._id && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                    <textarea
                      value={rejectReason.reason}
                      onChange={(e) => setRejectReason({ ...rejectReason, reason: e.target.value })}
                      placeholder="Reason for rejection (required)"
                      rows={2}
                      className="input-field w-full resize-none"
                    />
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setRejectReason(null)}>Cancel</Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={!rejectReason.reason.trim()}
                        onClick={() => reject({ id: rejectReason.id, reason: rejectReason.reason })}
                      >
                        Confirm Rejection
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ApprovalsPage;
