import type { Request, Response } from "express";
import { config } from "../config.js";
import { resetUsers } from "../db/queries/users.js";
import { Forbidden } from "./errors.js";

export async function handlerReset(_: Request, res: Response) {
  if (config.api.platform !== "dev") {
    console.log(config.api.platform);
    throw new Forbidden("Reset is only allowed in dev environment.");
  }
  config.api.fileServerHits = 0;
  await resetUsers();

  res.write("Hits reset to 0");
  res.end();
}

