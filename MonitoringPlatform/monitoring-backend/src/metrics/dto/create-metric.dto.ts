import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { DiskMetricDto } from './disk-metric.dto';

export class CreateMetricDto {
  @IsString()
  @IsNotEmpty()
  machineName: string;

  @IsNumber()
  @Min(0)
  cpuUsagePercent: number;

  @IsNumber()
  @Min(0)
  ramUsagePercent: number;

  @IsNumber()
  @Min(0)
  ramTotalMb: number;

  @IsNumber()
  @Min(0)
  ramUsedMb: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiskMetricDto)
  disks: DiskMetricDto[];
}
