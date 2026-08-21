import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MapPin, Car, IndianRupee, HeartOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant, Skeleton, EmptyState } from '@/components/ui/index';
import { parkingApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/stores/uiStore';

const FavouritesPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.favourites,
    queryFn: () => parkingApi.getFavourites().then((r) => r.data.data),
  });

  const { mutate: removeFav } = useMutation({
    mutationFn: (id: string) => parkingApi.removeFavourite(id),
    onSuccess: () => { toast.success('Removed from favourites'); qc.invalidateQueries({ queryKey: queryKeys.favourites }); },
  });

  const lots = data ?? [];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Favourites</h1>
          <p className="text-sm text-neutral-400">Your saved parking spots</p>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
        ) : lots.length === 0 ? (
          <EmptyState
            icon={<Heart className="w-16 h-16" />}
            title="No favourites yet"
            description="Tap the heart icon on any parking lot to save it here."
            action={<Button onClick={() => navigate('/search')}>Browse Parking</Button>}
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {lots.map((lot, i) => (
              <motion.div
                key={lot._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass rounded-xl p-5 border border-white/5 group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => navigate(`/parking/${lot._id}`)}
                      className="font-semibold text-white text-sm truncate hover:text-emerald-400 transition-colors text-left w-full"
                    >
                      {lot.name}
                    </button>
                    <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />{lot.address.city}, {lot.address.state}
                    </p>
                  </div>
                  <button onClick={() => removeFav(lot._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-colors shrink-0">
                    <HeartOff className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs text-neutral-400 mb-3">
                  <span className="flex items-center gap-1"><Car className="w-3 h-3" />{lot.capacity.available} available</span>
                  <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />₹{lot.pricing.baseRate}/{lot.pricing.billingUnit}</span>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant={statusVariant(lot.status)}>{lot.status}</Badge>
                  <Button size="sm" onClick={() => navigate(`/parking/${lot._id}`)}>Book Now</Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FavouritesPage;
