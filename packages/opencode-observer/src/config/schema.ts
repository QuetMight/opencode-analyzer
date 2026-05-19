import {z} from "zod";

const generalLoggerConfigSchema = z.object({
    enabled: z.boolean().default(true),
    logFilePath: z.string().default(""),
    logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type GeneralLoggerConfig = z.infer<typeof generalLoggerConfigSchema>;

const openCodeObserverConfigSchema = z.object({
    generalLogger: generalLoggerConfigSchema.default({}),
});

export type OpenCodeObserverConfig = z.infer<typeof openCodeObserverConfigSchema>;
