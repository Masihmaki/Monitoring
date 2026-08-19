import { IsNumber, IsString, Max, Min } from 'class-validator';

export class DiskMetricDto {
  @IsString()
  driveName: string;

  @IsNumber()
  @Min(0)
  totalGb: number;

  @IsNumber()
  @Min(0)
  freeGb: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  usedPercent: number;
}
