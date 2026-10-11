import { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

export function middlewareLogResponses(request: Request, response: Response, next: NextFunction) {
  response.on("finish", () => {
    const status = response.statusCode;
    if (status >= 300) {
      console.log(`[NON-OK] ${request.method} ${request.url} - Status: ${response.statusCode}`)
    }
  });
  next();
};

export function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
  config.fileServerHits++;
  next();
}
