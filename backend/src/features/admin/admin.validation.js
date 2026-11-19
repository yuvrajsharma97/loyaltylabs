const { z } = require('zod');

const updateStoreStatusSchema = z.object({
  status: z.enum(['active', 'suspended'])
});

const reconcileSchema = z.object({
  confirm: z.boolean().optional()
});

const isoDate = (label) =>
  z
    .string({ error: `${label} is required` })
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be a date (YYYY-MM-DD)`)
    .refine((value) => {
      const parsed = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
    }, `${label} is not a real date`);

// GET /admin/reports/transactions query string.
const transactionReportQuerySchema = z
  .object({
    from: isoDate('from'),
    to: isoDate('to'),
    storeId: z.string().optional()
  })
  .refine(({ from, to }) => from <= to, { message: 'from must be on or before to', path: ['to'] });

module.exports = { updateStoreStatusSchema, reconcileSchema, transactionReportQuerySchema };
