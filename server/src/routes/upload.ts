import { FastifyInstance } from "fastify";
import axios from "axios";
import { z } from "zod";
import { prisma } from "../lib/primsa";
import { randomUUID } from "node:crypto";
import { extname, resolve } from "node:path";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream";
import { promisify } from "node:util";

const pump = promisify(pipeline) 

export async function uploadRoutes(app: FastifyInstance) {
  app.post("/upload", async (request, reply) => {
    const upload = await request.file({
        limits: {
            fileSize: 5242880, // 5mb
        }
    })

    if(!upload) {
        return reply.status(400).send()
    }

    const mimetypeRegex = /^(image|video)\/[a-zA-z]+/
    const isValidFileFormat = mimetypeRegex.test(upload.mimetype)


    if(!isValidFileFormat) {
        return reply.status(400).send()
    }

    const fileId = randomUUID()
    const extension = extname(upload.filename)

    const filename = fileId.concat(extension)

    const writeStream = createWriteStream(resolve(__dirname, ".." ,"..", "uploads", filename))

    await pump(upload.file, writeStream)

    const fullUrl = request.protocol.concat("://").concat(request.hostname)
    const fileUrl = new URL(`/uploads/${filename}`, fullUrl).toString()

    return {fileUrl}
  })
}
