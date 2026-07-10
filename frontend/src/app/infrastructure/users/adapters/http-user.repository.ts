import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';

import {
  CreateUserInput,
  UpdateUserInput,
  User,
  UserRepository,
} from '../../../domain/users';
import { API_BASE_URL } from '../../config/api.config';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserMapper } from '../mappers/user.mapper';

@Injectable({
  providedIn: 'root',
})
export class HttpUserRepository implements UserRepository {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  public findAll(): Promise<User[]> {
    return firstValueFrom(
      this.httpClient
        .get<UserResponseDto[]>(`${this.apiBaseUrl}/users`)
        .pipe(map((users) => users.map((user) => UserMapper.toDomain(user)))),
    );
  }

  public findById(id: number): Promise<User> {
    return firstValueFrom(
      this.httpClient
        .get<UserResponseDto>(`${this.apiBaseUrl}/users/${id}`)
        .pipe(map((user) => UserMapper.toDomain(user))),
    );
  }

  public create(input: CreateUserInput): Promise<User> {
    const command = User.toCommand(input);

    return firstValueFrom(
      this.httpClient
        .post<UserResponseDto>(`${this.apiBaseUrl}/users`, UserMapper.toRequestDto(command))
        .pipe(map((user) => UserMapper.toDomain(user))),
    );
  }

  public update(id: number, input: UpdateUserInput): Promise<User> {
    const command = User.toCommand(input);

    return firstValueFrom(
      this.httpClient
        .put<UserResponseDto>(
          `${this.apiBaseUrl}/users/${id}`,
          UserMapper.toRequestDto(command),
        )
        .pipe(map((user) => UserMapper.toDomain(user))),
    );
  }

  public delete(id: number): Promise<void> {
    return firstValueFrom(this.httpClient.delete<void>(`${this.apiBaseUrl}/users/${id}`));
  }
}
