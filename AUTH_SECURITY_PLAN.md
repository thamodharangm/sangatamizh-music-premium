# Authentication & Security Plan

**Goal**: standard, secure JWT authentication with role-based access control (RBAC) and automated content validation.

## 1. JWT Strategy

We use a **Double Token System**:

1.  **Access Token**: Short-lived (15m), signed JWT. Used for API Authorization. Sent in `Authorization: Bearer <token>` header (or memory).
2.  **Refresh Token**: Long-lived (7d), opaque (or signed). Used to obtain new Access Tokens. Sent in **HttpOnly, Secure, SameSite=Strict** Cookie.

### Auth Flow

1.  **Login**: `POST /auth/login` -> Validate creds -> Set `refresh_token` cookie -> Return `{ accessToken }` JSON.
2.  **Access**: `GET /api/resource` -> Header `Authorization: Bearer <accessToken>` -> Verify JWT -> Serve.
3.  **Refresh**: 401 Unauthorized -> Client calls `POST /auth/refresh` (Cookie sent automatically) -> Server validates cookie & DB -> Rotates Refresh Token (Security best practice) -> Returns new `{ accessToken }`.
4.  **Logout**: `POST /auth/logout` -> Clear Cookie -> Remove token from DB.

## 2. Middleware Code (Express/TypeScript)

### `src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: "user" | "admin" | "moderator";
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or Expired Token" });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient Permissions" });
    }
    next();
  };
};
```

### `src/middleware/validation.ts` (File Uploads)

```typescript
import multer from "multer";

const allowedMimes = ["audio/mpeg", "audio/wav", "audio/flac", "audio/mp4"];

export const uploadAudio = multer({
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB Cap
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only MP3, WAV, FLAC allowed."));
    }
  },
});
```

## 3. Database Schema Changes

We need to track sessions and moderation status.

```sql
-- 1. Sessions (For Refresh Token Management & Revocation)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);

-- 2. Song Moderation Fields
ALTER TABLE songs
ADD COLUMN moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN is_explicit BOOLEAN DEFAULT FALSE,
ADD COLUMN audio_fingerprint VARCHAR(255), -- output from chromaprint/fpcalc
ADD COLUMN rejection_reason TEXT;

-- 3. Blocked Users (optional)
CREATE TABLE blocked_users (
    user_id UUID REFERENCES users(id),
    blocked_by UUID REFERENCES users(id), -- Admin who blocked
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id)
);
```

## 4. Admin Moderation Flow

1.  **Queue**: Admins view a list of songs where `status='ready'` AND `moderation_status='pending'`.
2.  **Review**: Admin listens to the `preview` stream.
3.  **Action**:
    - **Approve**: `UPDATE songs SET moderation_status='approved'` -> Song becomes visible to public search.
    - **Reject**: `UPDATE songs SET moderation_status='rejected', rejection_reason='Copyright/Quality'` -> User notified, song hidden.
    - **Flag Explicit**: `UPDATE songs SET is_explicit=TRUE`.

## 5. Automated Content Checks (Worker Integration)

Integrate these checks into the `transcode.worker.ts`:

1.  **Silence Detection**:

    ```bash
    ffmpeg -i input.mp3 -af silencedetect=noise=-50dB:d=2 -f null -
    ```

    - _Logic_: If silence > 50% of duration, flag as "Low Quality" or Reject.

2.  **Duplicate Detection**:

    - Use `fpcalc` (Chromaprint CLI) to generate a fingerprint.
    - Compare fingerprint against DB `audio_fingerprint` index.
    - _Logic_: If match found, mark as `duplicate` (link to original or reject).

3.  **Loudness Check**:
    - Use `ffmpeg -af loudnorm=print_format=json`.
    - _Logic_: If Integrated Loudness < -25 LUFS (too quiet) or True Peak > 0 dBTP (clipping), flag for warning.

## 6. Implementation Plan (Next Steps)

1.  **Setup Auth Service**: Implement `login`, `register`, `refresh` logic using `bcrypt` and `jsonwebtoken`.
2.  **Update DB**: Run migrations for `sessions` and `songs` columns.
3.  **Update Worker**: Add `fpcalc` step and `silencedetect` parsing.
