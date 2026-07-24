import { IsNotEmpty, IsNumber, IsString, IsArray } from 'class-validator';

export class CreateMetricDto {
  @IsString()
  @IsNotEmpty()
  machineName: string;

  @IsNumber()
  cpuUsagePercent: number;

  @IsNumber()
  ramUsagePercent: number;

  @IsNumber()
  ramTotalMb: number;

  @IsNumber()
  ramUsedMb: number;

  @IsArray()
  disks: any[];
}