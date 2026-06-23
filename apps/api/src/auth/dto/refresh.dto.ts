import { IsJWT, IsString } from 'class-validator';

/** Refresh / logout payload — carries the opaque refresh token (a signed JWT). */
export class RefreshDto {
  @IsString()
  @IsJWT()
  refreshToken!: string;
}
