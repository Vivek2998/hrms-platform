import type { FastifyInstance } from 'fastify';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env.js';
import { ok, fail } from '../../lib/response.js';

const ALLOWED_FOLDERS = ['avatars', 'documents'] as const;
type UploadFolder = (typeof ALLOWED_FOLDERS)[number];

function initCloudinary() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw fail('File upload is not configured on this server', 503);
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export function uploadRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // POST /upload?folder=avatars|documents
  app.post('/upload', auth, async (req, reply) => {
    initCloudinary();

    const data = await req.file({ limits: { fileSize: 10 * 1024 * 1024 } });
    if (!data) throw fail('No file provided', 400);

    const folderParam = (req.query as Record<string, string>)['folder'] ?? 'documents';
    const folder: UploadFolder = ALLOWED_FOLDERS.includes(folderParam as UploadFolder)
      ? (folderParam as UploadFolder)
      : 'documents';

    const buffer = await data.toBuffer();

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `hrms/${folder}`,
            resource_type: 'auto',
            ...(folder === 'avatars' && {
              transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
            }),
          },
          (error, res) => {
            if (error || !res) reject(error ?? new Error('Cloudinary upload failed'));
            else resolve(res);
          },
        );
        stream.end(buffer);
      },
    );

    return reply.send(ok({ url: result.secure_url, publicId: result.public_id }));
  });
}
