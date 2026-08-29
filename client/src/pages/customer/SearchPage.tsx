import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, MapPin, SlidersHorizontal, Star, Car, Clock, IndianRupee, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton, Badge, statusVariant, EmptyState } from '@/components/ui/index';
import { parkingApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { IParkingLot } from '@/types';
import { useSocket } from '@/contexts/SocketContext';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { socket } = useSocket();
  const [search, setSearch] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const params = {
    search: search || undefined,
    vehicleType: vehicleType || undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    page,
    limit: 12,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.parkingLots(params),
    queryFn: () => parkingApi.search(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    staleTime: 10000,
  });

  useEffect(() => {
    if (!socket) return;
    const handleSlotUpdate = () => {
      qc.invalidateQueries({ queryKey: queryKeys.parkingLots(params) });
    };
    socket.on('slot:updated', handleSlotUpdate);
    return () => {
      socket.off('slot:updated', handleSlotUpdate);
    };
  }, [socket, qc, params]);

  const lots = data?.data ?? [];
  const pagination = data?.pagination;

  const handleClear = () => {
    setSearch('');
    setVehicleType('');
    setMaxPrice('');
    setPage(1);
  };

  const hasFilters = !!(search || vehicleType || maxPrice);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Find Parking</h1>
          <p className="text-sm text-neutral-400">Search across thousands of lots near you</p>
        </div>

        {/* Search Bar */}
        <div className="glass rounded-xl p-4 border border-white/5 space-y-3">
          <div className="flex gap-3">
            <Input
              placeholder="Search by location, landmark or lot name..."
              leftIcon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1"
            />
            <Button variant="secondary" leftIcon={<SlidersHorizontal className="w-4 h-4" />} onClick={() => setShowFilters((v) => !v)}>
              Filters {hasFilters && <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1 inline-block" />}
            </Button>
            {hasFilters && (
              <Button variant="ghost" leftIcon={<X className="w-4 h-4" />} onClick={handleClear} className="!bg-red-500/10 !text-red-400 !border-red-500/20">
                Clear
              </Button>
            )}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                  <Select
                    label="Vehicle type"
                    options={[
                      { value: '', label: 'All types' },
                      { value: 'car', label: '🚗  Car' },
                      { value: 'motorcycle', label: '🏍️  Motorcycle' },
                      { value: 'ev', label: '⚡  Electric Vehicle' },
                      { value: 'truck', label: '🚛  Truck' },
                    ]}
                    value={vehicleType}
                    onChange={(e) => { setVehicleType(e.target.value); setPage(1); }}
                  />
                  <Input
                    label="Max price (₹/hr)"
                    type="number"
                    placeholder="e.g. 50"
                    leftIcon={<IndianRupee className="w-4 h-4" />}
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-xl p-5 border border-white/5 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 w-20 rounded-lg" />
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : lots.length === 0 ? (
          <EmptyState
            icon={<MapPin className="w-16 h-16" />}
            title="No parking lots found"
            description="Try adjusting your search or filters. New lots are added daily!"
            action={hasFilters ? <Button onClick={handleClear}>Clear Filters</Button> : undefined}
          />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400">
                {pagination?.total ?? lots.length} lots found 
                {isFetching && <span className="ml-2 inline-flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live</span>}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lots.map((lot, i) => (
                <ParkingLotCard key={lot._id} lot={lot} index={i} onClick={() => navigate(`/parking/${lot._id}`)} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button variant="secondary" disabled={!pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <span className="text-sm text-neutral-400">Page {pagination.page} of {pagination.totalPages}</span>
                <Button variant="secondary" disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

const ParkingLotCard: React.FC<{ lot: IParkingLot; index: number; onClick: () => void }> = ({ lot, index, onClick }) => {
  const availabilityPercent = Math.min(100, Math.max(0, (lot.capacity.available / lot.capacity.total) * 100));
  const barColor = availabilityPercent > 50 ? 'bg-emerald-500' : availabilityPercent > 20 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onClick}
      className="glass rounded-2xl p-5 border border-white/5 card-hover cursor-pointer group flex flex-col h-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-semibold text-white text-base truncate group-hover:text-emerald-400 transition-colors">{lot.name}</h3>
          <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{lot.address.city}, {lot.address.state}</span>
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-emerald-400">₹{lot.pricing.baseRate}</p>
          <p className="text-[10px] text-neutral-500 uppercase font-medium tracking-wider">per {lot.pricing.billingUnit}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Badge variant={statusVariant(lot.status)}>{lot.status}</Badge>
        {lot.rating && (
          <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-xs text-amber-400 font-medium">{lot.rating.average.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Availability Bar */}
      <div className="mt-auto mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-neutral-400 flex items-center gap-1.5"><Car className="w-3.5 h-3.5" /> Availability</span>
          <span className="font-medium text-white">{lot.capacity.available} <span className="text-neutral-500">/ {lot.capacity.total}</span></span>
        </div>
        <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${availabilityPercent}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex gap-1.5 overflow-hidden">
          {lot.amenities.slice(0, 3).map((a) => (
            <span key={a} className="text-[10px] px-2 py-1 rounded border border-white/10 bg-white/5 text-neutral-300 capitalize whitespace-nowrap">
              {a.replace('_', ' ')}
            </span>
          ))}
          {lot.amenities.length > 3 && <span className="text-[10px] px-2 py-1 text-neutral-500">+{lot.amenities.length - 3}</span>}
        </div>
        {lot.distance && (
          <span className="text-xs font-medium text-indigo-400 whitespace-nowrap ml-2">{(lot.distance / 1000).toFixed(1)} km</span>
        )}
      </div>
    </motion.div>
  );
};

export default SearchPage;
