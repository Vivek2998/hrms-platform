import type { FastifyInstance } from 'fastify';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env.js';
import { ok, fail } from '../../lib/response.js';

const ALLOWED_FOLDERS = ['avatars', 'documents'] as const;
type UploadFolder = (typeof ALLOWED_FOLDERS)[number];

// SEC-07: Strict MIME allowlist — never accept executables, HTML, SVG, or scripts.
// SVG is excluded intentionally: it can carry embedded JavaScript (stored XSS).
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const AVATAR_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

// Per-folder size caps
const MAX_SIZES: Record<UploadFolder, number> = {
  avatars: 2 * 1024 * 1024,    // 2 MB
  documents: 10 * 1024 * 1024, // 10 MB
};

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

    const folderParam = (req.query as Record<string, string>)['folder'] ?? 'documents';
    const folder: UploadFolder = ALLOWED_FOLDERS.includes(folderParam as UploadFolder)
      ? (folderParam as UploadFolder)
      : 'documents';

    // Read with the folder-specific size cap
    const data = await req.file({ limits: { fileSize: MAX_SIZES[folder] } });
    if (!data) throw fail('No file provided', 400);

    // SEC-07: MIME type validation — must be in the global allowlist
    if (!ALLOWED_MIME_TYPES.has(data.mimetype)) {
      throw fail(
        `File type '${data.mimetype}' is not allowed. ` +
          `Permitted types: JPEG, PNG, WEBP, GIF, PDF, DOC, DOCX, XLS, XLSX`,
        400,
      );
    }

    // Avatars must be images — reject PDFs or documents uploaded to the avatar folder
    if (folder === 'avatars' && !AVATAR_MIME_TYPES.has(data.mimetype)) {
      throw fail('Avatar uploads must be image files (JPEG, PNG, WEBP, GIF)', 400);
    }

    const buffer = await data.toBuffer();

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `hrms/${folder}`,
            // Use explicit resource type — not 'auto' which accepts anything
            resource_type: folder === 'avatars' ? 'image' : 'raw',
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
