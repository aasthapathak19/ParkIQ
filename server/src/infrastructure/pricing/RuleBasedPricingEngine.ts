import { IPricingEngine, PricingContext, PriceBreakdown } from '../interfaces';

const TAX_RATE = 0.18; // 18% GST

/**
 * Phase 1 rule-based pricing strategy.
 * Phase 3: swap with MLPricingEngine in container.ts.
 * 
 * Pricing formula:
 * base = baseRate × (durationMinutes / 60)
 * peakSurcharge = base × (peakRate - 1) if within peak window
 * weekendSurcharge = base × (weekendMultiplier - 1) if weekend
 * tax = (base + surcharges) × TAX_RATE
 * total = base + surcharges + tax
 */
export class RuleBasedPricingEngine implements IPricingEngine {
  async calculatePrice(context: PricingContext): Promise<PriceBreakdown> {
    return this.compute(context);
  }

  async estimatePrice(context: PricingContext): Promise<PriceBreakdown> {
    return this.compute(context);
  }

  private compute(context: PricingContext): PriceBreakdown {
    const hours = context.durationMinutes / 60;
    const base = Math.round(context.baseRate * hours * 100) / 100;

    const isPeak = this.isInPeakHour(context.startTime, context.peakHours);
    const isWeekend = [0, 6].includes(context.startTime.getDay());

    const peakMultiplier = isPeak && context.peakHourRate ? context.peakHourRate / context.baseRate - 1 : 0;
    const weekendMultiplier = isWeekend && context.weekendMultiplier ? context.weekendMultiplier - 1 : 0;

    const peakSurcharge = Math.round(base * peakMultiplier * 100) / 100;
    const weekendSurcharge = Math.round(base * weekendMultiplier * 100) / 100;
    const subtotal = base + peakSurcharge + weekendSurcharge;
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    return {
      base,
      peakSurcharge: peakSurcharge + weekendSurcharge,
      tax,
      discount: 0,
      total,
      currency: context.currency,
      durationMinutes: context.durationMinutes,
      strategy: 'rule_based',
      rawBreakdown: { base, peakSurcharge, weekendSurcharge, tax },
    };
  }

  private isInPeakHour(
    time: Date,
    peakHours?: Array<{ dayOfWeek: number; startHour: number; endHour: number }>,
  ): boolean {
    if (!peakHours || peakHours.length === 0) return false;
    const day = time.getDay();
    const hour = time.getHours();
    return peakHours.some(
      (p) => p.dayOfWeek === day && hour >= p.startHour && hour < p.endHour,
    );
  }
}
