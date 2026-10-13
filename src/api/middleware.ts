import { Request, Response, NextFunction } from "express";
import { config } from "../config.js";
import { BadRequest, Forbidden, NotFoundError, Unauthorized } from "./errors.js";

export function middlewareLogResponses(request: Request, response: Response, next: NextFunction) {
  response.on("finish", () => {
    const status = response.statusCode;
    if (status >= 300) {
      console.log(`[NON-OK] ${request.method} ${request.url} - Status: ${response.statusCode}`)
    }
  });
  next();
}

export function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
  config.api.fileServerHits++;
  next();
}

export function errorMiddleWare(
  err: Error,
  _: Request,
  res: Response,
  __: NextFunction,
) {
  if (err instanceof BadRequest) {
    res.status(400).json({ error: err.message });
  } else if (err instanceof Unauthorized) {
    res.status(401).json({ error: err.message });
  } else if (err instanceof Forbidden) {
    res.status(403).json({ error: err.message });
  } else if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
  }
  // let statusCode = 500;
  // let message = "Something went wrong on our end";
  // console.log(err.message);
  // respondWithError(res, statusCode, message);
}
