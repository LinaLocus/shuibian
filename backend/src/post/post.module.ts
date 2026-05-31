import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post, PostLike, PostComment } from './post.entity';
import { Family, FamilyMember } from '../family/family.entity';
import { User } from '../auth/user.entity';
import { PostService } from './post.service';
import { PostController } from './post.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostLike, PostComment, Family, FamilyMember, User]),
  ],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
