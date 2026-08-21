import { Request, Response } from 'express';
import { slotService } from './slot.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export class SlotController {
  createSlots = asyncHandler(async (req: Request, res: Response) => {
    const slots = Array.isArray(req.body) ? req.body : [req.body];
    const created = await slotService.createSlots(req.params.parkingId, req.user!.id, slots);
    res.status(201).json(ApiResponse.success(created, `${created.length} slot(s) created`, req.requestId));
  });

  getSlotsByLot = asyncHandler(async (req: Request, res: Response) => {
    const { status, type, floor } = req.query as Record<string, string>;
    const slots = await slotService.getSlotsByLot(req.params.parkingId, {
      status,
      type,
      floor: floor ? Number(floor) : undefined,
    });
    res.status(200).json(ApiResponse.success(slots, 'Slots fetched', req.requestId));
  });

  updateSlot = asyncHandler(async (req: Request, res: Response) => {
    const slot = await slotService.updateSlot(
      req.params.slotId,
      req.user!.id,
      req.params.parkingId,
      req.body,
    );
    res.status(200).json(ApiResponse.success(slot, 'Slot updated', req.requestId));
  });

  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const slot = await slotService.updateSlotStatus(
      req.params.slotId,
      req.body.status,
      req.user!.id,
      req.params.parkingId,
    );
    res.status(200).json(ApiResponse.success(slot, 'Slot status updated', req.requestId));
  });

  deleteSlot = asyncHandler(async (req: Request, res: Response) => {
    await slotService.deleteSlot(req.params.slotId, req.user!.id, req.params.parkingId);
    res.status(200).json(ApiResponse.success(null, 'Slot deleted', req.requestId));
  });
}

export const slotController = new SlotController();
