import { Repository } from '../../shared/default-repository';
import { UpdateCommentInput, CreateCommentInput, Comment } from '../entities/comment.entity';

export interface CommentRepository extends Repository<Comment, CreateCommentInput, UpdateCommentInput> { }
  