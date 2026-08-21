import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ParkingSquare, MapPin, Pencil, Trash2, Eye, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant, Skeleton, EmptyState } from '@/components/ui/index';
import { parkingApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/stores/uiStore';

const ParkingManagePage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.myLots,
    queryFn: () => parkingApi.getMyLots().then((r) => r.data.data),
  });

  const { mutate: deleteLot } = useMutation({
    mutationFn: (id: string) => parkingApi.delete(id),
    onSuccess: () => { toast.success('Lot removed.'); qc.invalidateQueries({ queryKey: queryKeys.myLots }); },
    onError: () => toast.error('Could not delete lot.'),
  });

  const lots = data ?? [];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Parking Lots</h1>
            <p className="text-sm text-neutral-400">Manage your parking properties</p>
          </div>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate('/owner/lots/create')}>Add Lot</Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
        ) : lots.length === 0 ? (
          <EmptyState
            icon={<ParkingSquare className="w-16 h-16" />}
            title="No parking lots yet"
            description="Add your first parking lot and start earning."
            action={<Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate('/owner/lots/create')}>Add Parking Lot</Button>}
          />
        ) : (
          <div className="space-y-3">
            {lots.map((lot, i) => (
              <motion.div
                key={lot._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass rounded-xl p-5 border border-white/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{lot.name}</h3>
                      <Badge variant={statusVariant(lot.status)}>{lot.status}</Badge>
                    </div>
                    <p className="text-sm text-neutral-400 flex items-center gap-1 mb-2">
                      <MapPin className="w-3.5 h-3.5" />{lot.address.city}, {lot.address.state}
                    </p>
                    <div className="flex items-center gap-5 text-xs text-neutral-500">
                      <span>{lot.capacity.available}/{lot.capacity.total} slots available</span>
                      <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />₹{lot.pricing.baseRate}/{lot.pricing.billingUnit}</span>
                      {lot.rating && <span>⭐ {lot.rating.average.toFixed(1)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => navigate(`/parking/${lot._id}`)}
                      className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                      title="View public page"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/owner/lots/${lot._id}/edit`)}
                      className="p-2 rounded-lg hover:bg-indigo-500/10 text-neutral-400 hover:text-indigo-400 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/owner/slots?lotId=${lot._id}`)}
                      className="p-2 rounded-lg hover:bg-amber-500/10 text-neutral-400 hover:text-amber-400 transition-colors"
                      title="Manage slots"
                    >
                      <ParkingSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm('Delete this lot?')) deleteLot(lot._id); }}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ParkingManagePage;
