import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Login payload. The tenant slug is required so the user is resolved within a
 * known tenant — this keeps the lookup tenant-scoped and avoids a global
 * cross-tenant email search.
 */
export class LoginDto {
  @IsString()
  @MinLength(2)
  @MaxLength(63)
  tenantSlug!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(256)
  password!: string;
}
