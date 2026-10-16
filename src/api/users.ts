
import type { Request, Response } from "express";
import { createUser, updateChirpyRed, updateUser } from "../db/queries/users.js";
import { respondWithJSON } from "./json.js";
import { BadRequest, NotFoundError, Unauthorized } from "./errors.js";
import { getAPIKey, getBearerToken, hashPassword, validateJWT } from "../auth.js";
import { NewUser } from "../db/schema.js";
import { config } from "../config.js";

export type UserResponse = Omit<NewUser, "hashedPassword">;

export async function handlerCreateUser(req: Request, res: Response): Promise<void> {
  type parameters = {
    email: string;
    password: string;
  };
  const params: parameters = req.body;
  if (!params.email || !params.password) {
    throw new BadRequest("Missing required fields!");
  }
  const hashedPassword = await hashPassword(params.password);

  const user = await createUser({
    email: params.email,
    hashedPassword,
  } satisfies NewUser);

  if (!user) {
    throw new Error("Could not create user");
  }

  respondWithJSON(res, 201, {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isChirpyRed: user.isChirpyRed,
  } satisfies UserResponse);
}

export async function handlerUpdateUser(req: Request, res: Response): Promise<void> {
  type parameters = {
    email: string;
    password: string;
  };
  const params: parameters = req.body;
  if (!params.email || !params.password) {
    throw new BadRequest("Missing required fields!");
  }

  const token = getBearerToken(req);
  const userId = validateJWT(token, config.jwt.secret);

  const hashedPassword = await hashPassword(params.password);

  const user = await updateUser(
    userId, params.email, hashedPassword
  );

  if (!user) {
    throw new Error("Could not create user");
  }

  respondWithJSON(res, 200, {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  } satisfies UserResponse);
}

