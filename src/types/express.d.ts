import 'express';

declare module 'express-serve-static-core' {
    interface Request {
        // Optionally annotate types for registry-related headers
        headers: IncomingHttpHeaders & {
            'x-registration-key'?: string;
        };
    }
}
