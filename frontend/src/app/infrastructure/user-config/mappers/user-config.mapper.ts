import { UserConfigResponseDto } from '../dto/user-config.dto';
import { UserConfigSnapshot } from '../../../domain/users/entities/user-config.entity';

export class UserConfigMapper {
  static toSnapshot(dto: UserConfigResponseDto): UserConfigSnapshot {
    return {
      id: dto.id,
      userId: dto.userId,
      darkMode: dto.darkMode,
      defaultTaskLimit: dto.defaultTaskLimit,
      startupColumns: dto.startupColumns.map((sc) => ({
        id: sc.id,
        title: sc.title,
        position: sc.position,
        type: sc.type ?? 'NORMAL',
      })),
      customTags: dto.customTags.map((ct) => ({
        id: ct.id,
        name: ct.name,
        color: ct.color,
        position: ct.position,
      })),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }
}
