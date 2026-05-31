import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PostService } from './post.service';
import { CreatePostDto, CreateCommentDto } from './dto/create-post.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  list(
    @Req() req: any,
    @Query('familyId') familyId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postService.list(req.user.id, {
      familyId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreatePostDto) {
    return this.postService.create(req.user.id, dto);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.postService.deletePost(req.user.id, id);
    return { success: true };
  }

  @Post(':id/like')
  like(@Req() req: any, @Param('id') id: string) {
    return this.postService.like(req.user.id, id);
  }

  @Delete(':id/like')
  unlike(@Req() req: any, @Param('id') id: string) {
    return this.postService.unlike(req.user.id, id);
  }

  @Post(':id/comments')
  addComment(@Req() req: any, @Param('id') id: string, @Body() dto: CreateCommentDto) {
    return this.postService.addComment(req.user.id, id, dto.content);
  }

  @Delete(':id/comments/:commentId')
  async deleteComment(
    @Req() req: any,
    @Param('commentId') commentId: string,
  ) {
    await this.postService.deleteComment(req.user.id, commentId);
    return { success: true };
  }
}
