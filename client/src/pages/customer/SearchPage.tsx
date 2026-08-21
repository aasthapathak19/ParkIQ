import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, SlidersHorizontal, Star, Car, Clock, IndianRupee, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton, Badge, statusVariant, EmptyState } from '@/components/ui/index';
import { parkingApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { IParkingLot } from '@/types';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
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
  });

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
                {pagination?.total ?? lots.length} lots found {isFetching && <span className="text-emerald-400">· Refreshing...</span>}
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

const ParkingLotCard: React.FC<{ lot: IParkingLot; index: number; onClick: () => void }> = ({
  lot, index, onClick
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.3 }}
    onClick={onClick}
    className="glass rounded-xl p-5 border border-white/5 card-hover cursor-pointer group"
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white text-sm truncate group-hover:text-emerald-400 transition-colors">{lot.name}</h3>
        <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{lot.address.city}, {lot.address.state}</span>
        </p>
      </div>
      <Badge variant={statusVariant(lot.status)}>{lot.status}</Badge>
    </div>

    {lot.rating && (
      <div className="flex items-center gap-1 mb-3">
        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
        <span className="text-xs text-amber-400 font-medium">{lot.rating.average.toFixed(1)}</span>
        <span className="text-xs text-neutral-500">({lot.rating.count})</span>
      </div>
    )}

    <div className="flex items-center gap-4 text-xs text-neutral-400 mb-4">
      <span className="flex items-center gap-1">
        <Car className="w-3 h-3" />
        {lot.capacity.available}/{lot.capacity.total} available
      </span>
      <span className="flex items-center gap-1">
        <IndianRupee className="w-3 h-3" />
        ₹{lot.pricing.baseRate}/{lot.pricing.billingUnit}
      </span>
    </div>

    {lot.distance && (
      <p className="text-xs text-emerald-400 mb-3">📍 {(lot.distance / 1000).toFixed(1)} km away</p>
    )}

    <div className="flex gap-2">
      {lot.amenities.slice(0, 3).map((a) => (
        <span key={a} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>{a}</span>
      ))}
    </div>
  </motion.div>
);

export default SearchPage;
