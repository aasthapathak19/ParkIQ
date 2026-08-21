import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Car, Plus, Trash2, Star, Pencil, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge, EmptyState, Skeleton } from '@/components/ui/index';
import { vehiclesApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { IVehicle } from '@/types';
import { useToast } from '@/stores/uiStore';

const vehicleSchema = z.object({
  licensePlate: z.string().min(2, 'Enter a valid plate'),
  type: z.enum(['car', 'motorcycle', 'ev', 'truck', 'van']),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce.number().min(1980).max(new Date().getFullYear() + 1).optional(),
  color: z.string().optional(),
});

type VehicleForm = z.infer<typeof vehicleSchema>;

const VehiclesPage: React.FC = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [editVehicle, setEditVehicle] = useState<IVehicle | null>(null);
  const toast = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.vehicles,
    queryFn: () => vehiclesApi.getAll().then((r) => r.data.data),
  });

  const vehicles = data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { type: 'car' },
  });

  const { mutate: createVehicle, isPending: isCreating } = useMutation({
    mutationFn: (d: VehicleForm) => vehiclesApi.create(d).then((r) => r.data.data),
    onSuccess: () => {
      toast.success('Vehicle added!');
      qc.invalidateQueries({ queryKey: queryKeys.vehicles });
      setShowAdd(false);
      reset();
    },
    onError: () => toast.error('Could not add vehicle.'),
  });

  const { mutate: deleteVehicle } = useMutation({
    mutationFn: (id: string) => vehiclesApi.delete(id),
    onSuccess: () => { toast.success('Vehicle removed'); qc.invalidateQueries({ queryKey: queryKeys.vehicles }); },
    onError: () => toast.error('Could not remove vehicle.'),
  });

  const { mutate: setDefault } = useMutation({
    mutationFn: (id: string) => vehiclesApi.setDefault(id),
    onSuccess: () => { toast.success('Default vehicle updated'); qc.invalidateQueries({ queryKey: queryKeys.vehicles }); },
  });

  const typeIcon = { car: '🚗', motorcycle: '🏍️', ev: '⚡', truck: '🚛', van: '🚐' };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Vehicles</h1>
            <p className="text-sm text-neutral-400">Manage your registered vehicles</p>
          </div>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>Add Vehicle</Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : vehicles.length === 0 ? (
          <EmptyState icon={<Car className="w-16 h-16" />} title="No vehicles yet" description="Add your first vehicle to start booking parking spots." action={<Button onClick={() => setShowAdd(true)}>Add Vehicle</Button>} />
        ) : (
          <div className="space-y-3">
            {vehicles.map((v) => (
              <div key={v._id} className="glass rounded-xl p-5 border border-white/5 flex items-center gap-4">
                <div className="text-3xl">{typeIcon[v.type]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{v.brand} {v.model}</p>
                    {v.isDefault && <Badge variant="green">Default</Badge>}
                    {v.type === 'ev' && <Badge variant="blue">EV</Badge>}
                  </div>
                  <p className="text-sm text-neutral-400 font-mono">{v.licensePlate}</p>
                  {v.year && <p className="text-xs text-neutral-500">{v.year}{v.color ? ` · ${v.color}` : ''}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {!v.isDefault && (
                    <button title="Set as default" onClick={() => setDefault(v._id)} className="p-2 rounded-lg hover:bg-amber-500/10 text-neutral-500 hover:text-amber-400 transition-colors">
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button title="Delete" onClick={() => deleteVehicle(v._id)} className="p-2 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => { setShowAdd(false); reset(); }} title="Add Vehicle" size="md">
        <form onSubmit={handleSubmit((d) => createVehicle(d))} className="space-y-4">
          <Select
            label="Vehicle type"
            options={[
              { value: 'car', label: '🚗  Car' },
              { value: 'motorcycle', label: '🏍️  Motorcycle' },
              { value: 'ev', label: '⚡  Electric Vehicle' },
              { value: 'truck', label: '🚛  Truck' },
              { value: 'van', label: '🚐  Van' },
            ]}
            error={errors.type?.message}
            {...register('type')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Brand" placeholder="Toyota" error={errors.brand?.message} {...register('brand')} />
            <Input label="Model" placeholder="Camry" error={errors.model?.message} {...register('model')} />
          </div>
          <Input label="License plate" placeholder="MH 01 AB 1234" error={errors.licensePlate?.message} {...register('licensePlate')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Year (optional)" type="number" placeholder="2022" error={errors.year?.message} {...register('year')} />
            <Input label="Color (optional)" placeholder="White" error={errors.color?.message} {...register('color')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => { setShowAdd(false); reset(); }}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isCreating}>Add Vehicle</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default VehiclesPage;
