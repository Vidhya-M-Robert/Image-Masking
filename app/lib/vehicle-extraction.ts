import z from "zod";

export const vehicleDetailsExtractionSchema = z.object({
  make: z.string().nullable(),
  model: z.string().nullable(),
  registrationNumber: z.string().nullable(),
  engineCapacityCc: z.number().int().nullable(),
  yearOfManufacture: z.number().int().nullable(),
  maxPowerOutput: z.number().int().nullable(),
});

export const numberPlateSchema = z.object({
  numberPlateBoxes: z.array(
    z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }),
  ),
});
