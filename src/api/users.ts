
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

export async function handlerWebhook(req: Request, res: Response): Promise<void> {
  const suppliedKey = getAPIKey(req);
  if (suppliedKey !== config.api.polkaKey) {
    throw new Unauthorized("no supplied key");
  }
  const { event, data } = req.body;
  // 1. If event is NOT "user.upgraded", send 204 and return
  if (event !== "user.upgraded") {
    res.status(204).send();
    return;
  }
  // 2. Call your upgrade function using data.userId
  const user = await updateChirpyRed(data.userId);
  // 3. If no user found, what status code should you send?
  if (!user) {
    // send error status code here
    throw new NotFoundError("no users found")
  }
  // 4. If successful, send 204
  // res.status(204).send();
  respondWithJSON(res, 204, {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isChirpyRed: user.isChirpyRed,
  } satisfies UserResponse);
}

