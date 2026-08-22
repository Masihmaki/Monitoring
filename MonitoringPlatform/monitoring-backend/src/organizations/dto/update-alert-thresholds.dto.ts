import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateAlertThresholdsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  cpuThreshold!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  ramThreshold!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  diskThreshold!: number;
}
