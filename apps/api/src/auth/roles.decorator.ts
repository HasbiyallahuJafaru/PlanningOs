import { Reflector } from '@nestjs/core';
import type { UserRole } from './auth.types';

/**
 * Marks a route as requiring one of the given roles. Enforced by RolesGuard.
 * Usage:  `@Roles('admin')`  or  `@Roles('admin', 'consultant')`.
 */
export const Roles = Reflector.createDecorator<UserRole[]>();
