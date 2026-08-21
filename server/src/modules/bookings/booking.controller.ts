import { Request, Response } from 'express';
import { bookingService } from './booking.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { parsePaginationParams } from '../../utils/pagination.utils';

export class BookingController {
  createBooking = asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingService.createBooking(req.user!.id, {
      ...req.body,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      source: 'web',
    });
    res.status(201).json(ApiResponse.success(booking, 'Booking confirmed', req.requestId));
  });

  getMyBookings = asyncHandler(async (req: Request, res: Response) => {
    const options = parsePaginationParams(req.query as Record<string, string>);
    const { status } = req.query as { status?: string };
    const result = await bookingService.getMyBookings(req.user!.id, { status }, options);
    res.status(200).json(ApiResponse.paginated(result.data, result.pagination, 'Bookings fetched', req.requestId));
  });

  getBookingById = asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingService.getBookingById(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.success(booking, 'Booking details', req.requestId));
  });

  cancelBooking = asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingService.cancelBooking(
      req.params.id,
      req.user!.id,
      req.body.reason ?? 'Cancelled by customer',
    );
    res.status(200).json(ApiResponse.success(booking, 'Booking cancelled', req.requestId));
  });

  getQRCode = asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingService.getBookingById(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.success({ qrCode: booking.qrCode }, 'QR code fetched', req.requestId));
  });

  getOwnerBookings = asyncHandler(async (req: Request, res: Response) => {
    const options = parsePaginationParams(req.query as Record<string, string>);
    const { lotId, status } = req.query as { lotId: string; status?: string };
    const result = await bookingService.getOwnerBookings(req.user!.id, lotId, { status }, options);
    res.status(200).json(ApiResponse.paginated(result.data, result.pagination, 'Bookings fetched', req.requestId));
  });

  checkIn = asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingService.checkIn(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.success(booking, 'Check-in successful', req.requestId));
  });

  checkOut = asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingService.checkOut(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.success(booking, 'Check-out successful', req.requestId));
  });

  getPriceEstimate = asyncHandler(async (req: Request, res: Response) => {
    const { lotId, startTime, endTime } = req.body;
    const estimate = await bookingService.getPriceEstimate(lotId, new Date(startTime), new Date(endTime));
    res.status(200).json(ApiResponse.success(estimate, 'Price estimate', req.requestId));
  });
}

export const bookingController = new BookingController();
