import winston from "winston";

const isProduction = process.env.NODE_ENV === "production";

export const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  defaultMeta: { service: "hangeulvision" },
  format: isProduction
    ? winston.format.combine(winston.format.timestamp(), winston.format.json())
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message, ...rest }) => {
          const extra = Object.keys(rest).length > 1 ? ` ${JSON.stringify(rest)}` : "";
          return `${timestamp} ${level}: ${message}${extra}`;
        }),
      ),
  transports: [new winston.transports.Console()],
});
