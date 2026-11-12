
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateAppDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  
}
