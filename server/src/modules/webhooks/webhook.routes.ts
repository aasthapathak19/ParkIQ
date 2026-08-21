import { Router } from 'express';
import express from 'express';
import { handleStripeWebhook } from './webhook.controller';

const router = Router();

// Stripe requires the raw body to construct the event and verify the signature
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;
