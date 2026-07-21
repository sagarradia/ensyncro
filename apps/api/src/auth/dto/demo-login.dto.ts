import { IsIn } from 'class-validator';

export const DEMO_ROLES = ['ADMIN', 'FOUNDER', 'INVESTOR'] as const;

export class DemoLoginDto {
  @IsIn(DEMO_ROLES as unknown as string[])
  role!: (typeof DEMO_ROLES)[number];
}
