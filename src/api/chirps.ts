import type { Request, Response } from "express";
import { respondWithJSON } from "./json.js";
import { BadRequest, NotFoundError } from "./errors.js";
import { createChirp, getChirpById, getChirps } from "../db/queries/chirps.js";

export async function handlerCreateChirp(req: Request, res: Response): Promise<void> {
  type parameters = {
    body: string;
    userId: string;
  };

  const params: parameters = req.body;
  if (!params.body || !params.userId) {
    throw new BadRequest("Missing required fields!");
  }

  function validateChirp(body: string) {
    const maxChirpLength = 140;
    if (params.body.length > maxChirpLength) {
      throw new BadRequest(
        `Chirp is too long. Max length is ${maxChirpLength}`
      );
    }
    const chirp = params.body;
    const forbidden = [
      "kerfuffle",
      "sharbert",
      "fornax",
    ];

    const cleanedChirp = chirp
      .split(" ")
      .map((word) => {
        const lowerWord = word.toLowerCase();

        if (forbidden.includes(lowerWord)) {
          return "****";
        }
        return word;
      }).join(" ");
    return cleanedChirp;
  }
  const cleaned = validateChirp(params.body)

  const chirp = await createChirp({ body: cleaned, userId: params.userId });

  if (!chirp) {
    throw new Error("Could not create chirp");
  }

  respondWithJSON(res, 201, chirp);
}

export async function handlerGetChirps(req: Request, res: Response): Promise<void> {
  const chirpList = await getChirps();
  respondWithJSON(res, 200, chirpList);
}

export async function handlerGetChirpById(req: Request, res: Response): Promise<void> {
  const { chirpId } = req.params;
  if (typeof chirpId !== "string") {
    throw new BadRequest("Invalid chirp ID");
  }

  const chirp = await getChirpById(chirpId);
  if (!chirp) {
    throw new NotFoundError("Chirp not found");
  }
  respondWithJSON(res, 200, chirp);
}
