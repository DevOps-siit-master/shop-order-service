import { Type } from "class-transformer";
import { IsString, IsNotEmpty, IsNumberString, IsInt, Min, IsArray, ArrayNotEmpty, ValidateNested } from "class-validator";

export class OrderItemDto {
    @IsString() @IsNotEmpty()
    productId!: string;

    @IsString() @IsNotEmpty()
    name!: string;

    @IsNumberString()
    price!: string;

    @IsInt() @Min(1)
    quantity!: number;
}

export class CreateOrderDto {
    @IsArray() @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items!: OrderItemDto[];
}