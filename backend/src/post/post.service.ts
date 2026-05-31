import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Post, PostLike, PostComment } from './post.entity';
import { Family, FamilyMember } from '../family/family.entity';
import { User } from '../auth/user.entity';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(PostLike)
    private readonly likeRepo: Repository<PostLike>,
    @InjectRepository(PostComment)
    private readonly commentRepo: Repository<PostComment>,
    @InjectRepository(Family)
    private readonly familyRepo: Repository<Family>,
    @InjectRepository(FamilyMember)
    private readonly memberRepo: Repository<FamilyMember>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private async assertFamilyMember(userId: string, familyId: string) {
    const m = await this.memberRepo.findOne({ where: { userId, familyId } });
    if (!m) throw new ForbiddenException('你不是该家庭成员');
    return m;
  }

  async create(userId: string, dto: CreatePostDto): Promise<Post> {
    if (!dto.content?.trim() && (!dto.imageUrls || dto.imageUrls.length === 0)) {
      throw new BadRequestException('动态不能为空');
    }
    await this.assertFamilyMember(userId, dto.familyId);
    return this.postRepo.save(
      this.postRepo.create({
        familyId: dto.familyId,
        authorId: userId,
        content: dto.content.trim(),
        imageUrls: dto.imageUrls && dto.imageUrls.length > 0 ? dto.imageUrls : null,
      }),
    );
  }

  async list(userId: string, opts: { familyId?: string; page?: number; limit?: number }) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;

    const myMemberships = await this.memberRepo.find({ where: { userId } });
    if (myMemberships.length === 0) return { posts: [], total: 0, page, limit };

    let familyIds = myMemberships.map((m) => m.familyId);
    if (opts.familyId) {
      if (!familyIds.includes(opts.familyId)) {
        throw new ForbiddenException('你不是该家庭成员');
      }
      familyIds = [opts.familyId];
    }

    const [posts, total] = await this.postRepo.findAndCount({
      where: { familyId: In(familyIds) },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      posts: await this.hydratePosts(posts, userId),
      total,
      page,
      limit,
    };
  }

  private async hydratePosts(posts: Post[], userId: string) {
    if (posts.length === 0) return [];

    const postIds = posts.map((p) => p.id);
    const authorIds = [...new Set(posts.map((p) => p.authorId))];
    const familyIds = [...new Set(posts.map((p) => p.familyId))];

    const [authors, families, allLikes, allComments] = await Promise.all([
      this.userRepo.find({ where: { id: In(authorIds) } }),
      this.familyRepo.find({ where: { id: In(familyIds) } }),
      this.likeRepo.find({ where: { postId: In(postIds) } }),
      this.commentRepo.find({
        where: { postId: In(postIds) },
        order: { createdAt: 'ASC' },
      }),
    ]);

    const commentUserIds = [...new Set(allComments.map((c) => c.userId))];
    const commentUsers = await this.userRepo.find({ where: { id: In(commentUserIds) } });

    const authorMap = new Map(authors.map((u) => [u.id, u]));
    const familyMap = new Map(families.map((f) => [f.id, f]));
    const commentUserMap = new Map(commentUsers.map((u) => [u.id, u]));

    const likesByPost = new Map<string, PostLike[]>();
    for (const l of allLikes) {
      const arr = likesByPost.get(l.postId) || [];
      arr.push(l);
      likesByPost.set(l.postId, arr);
    }

    const commentsByPost = new Map<string, PostComment[]>();
    for (const c of allComments) {
      const arr = commentsByPost.get(c.postId) || [];
      arr.push(c);
      commentsByPost.set(c.postId, arr);
    }

    return posts.map((p) => {
      const author = authorMap.get(p.authorId);
      const family = familyMap.get(p.familyId);
      const likes = likesByPost.get(p.id) || [];
      const comments = commentsByPost.get(p.id) || [];

      return {
        id: p.id,
        familyId: p.familyId,
        familyName: family?.name || '',
        author: {
          id: p.authorId,
          nickname: author?.nickname || '',
          avatar: author?.avatar || null,
        },
        content: p.content,
        imageUrls: p.imageUrls || [],
        likeCount: likes.length,
        likedByMe: likes.some((l) => l.userId === userId),
        commentCount: comments.length,
        comments: comments.map((c) => {
          const u = commentUserMap.get(c.userId);
          return {
            id: c.id,
            userId: c.userId,
            nickname: u?.nickname || '',
            avatar: u?.avatar || null,
            content: c.content,
            createdAt: c.createdAt,
            isMe: c.userId === userId,
          };
        }),
        isMine: p.authorId === userId,
        createdAt: p.createdAt,
      };
    });
  }

  async deletePost(userId: string, postId: string): Promise<void> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('动态不存在');
    if (post.authorId !== userId) throw new ForbiddenException('只能删除自己的动态');
    await this.commentRepo.delete({ postId });
    await this.likeRepo.delete({ postId });
    await this.postRepo.delete({ id: postId });
  }

  async like(userId: string, postId: string): Promise<{ liked: boolean }> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('动态不存在');
    await this.assertFamilyMember(userId, post.familyId);

    const existing = await this.likeRepo.findOne({ where: { postId, userId } });
    if (existing) return { liked: true };

    await this.likeRepo.save(this.likeRepo.create({ postId, userId }));
    return { liked: true };
  }

  async unlike(userId: string, postId: string): Promise<{ liked: boolean }> {
    await this.likeRepo.delete({ postId, userId });
    return { liked: false };
  }

  async addComment(userId: string, postId: string, content: string): Promise<any> {
    const text = content?.trim();
    if (!text) throw new BadRequestException('评论不能为空');
    if (text.length > 200) throw new BadRequestException('评论过长（200 字以内）');

    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('动态不存在');
    await this.assertFamilyMember(userId, post.familyId);

    const comment = await this.commentRepo.save(
      this.commentRepo.create({ postId, userId, content: text }),
    );
    const user = await this.userRepo.findOne({ where: { id: userId } });
    return {
      id: comment.id,
      userId,
      nickname: user?.nickname || '',
      avatar: user?.avatar || null,
      content: comment.content,
      createdAt: comment.createdAt,
      isMe: true,
    };
  }

  async deleteComment(userId: string, commentId: string): Promise<void> {
    const c = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!c) throw new NotFoundException('评论不存在');
    if (c.userId !== userId) throw new ForbiddenException('只能删除自己的评论');
    await this.commentRepo.delete({ id: commentId });
  }
}
