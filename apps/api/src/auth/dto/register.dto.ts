import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Registration payload — creates a new tenant and its first (admin) user.
 * The slug is lowercase alphanumeric + hyphens (used as the tenant identifier
 * at login).
 */
export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  tenantName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(63)
  @Matches(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, {
    message:
      'tenantSlug must be lowercase alphanumeric and hyphens (no leading/trailing hyphen)',
  })
  tenantSlug!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(12, { message: 'password must be at least 12 characters' })
  @MaxLength(256)
  password!: string;
}
