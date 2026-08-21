import { Transform } from 'class-transformer';
import { IsDefined, Matches, ValidateIf } from 'class-validator';

export class UpdateTelegramDto {
  @IsDefined({ message: 'chatId is required' })
  @Transform(({ value }) => (value === '' ? null : value))
  @ValidateIf((_, value) => value !== null)
  @Matches(/^-?\d{5,20}$/, {
    message: 'Chat ID must be a numeric Telegram id',
  })
  chatId!: string | null;
}
