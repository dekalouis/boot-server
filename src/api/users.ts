
import type { Request, Response } from "express";
import { createUser } from "../db/queries/users.js";
import { respondWithJSON } from "./json.js";
import { BadRequest } from "./errors.js";

export async function handlerCreateUser(req: Request, res: Response): Promise<void> {
  type parameters = {
    email: string;
  };
  const params: parameters = req.body;
  if (!params.email) {
    throw new BadRequest("Missing required fields!");
  }

  const user = await createUser({ email: params.email });
  if (!user) {
    throw new Error("Could not create user");
  }

  respondWithJSON(res, 201, {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
}

