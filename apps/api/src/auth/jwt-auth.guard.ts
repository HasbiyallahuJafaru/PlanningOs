import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that requires a valid access token. Delegates to the 'jwt' passport
 * strategy (JwtStrategy), which validates the token and attaches the
 * AuthenticatedUser to the request. A missing/invalid token yields 401.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
