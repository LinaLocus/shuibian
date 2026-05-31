import api from '../../api/client';

export interface PostComment {
  id: string;
  userId: string;
  nickname: string;
  avatar: string | null;
  content: string;
  createdAt: string;
  isMe: boolean;
}

export interface PostItem {
  id: string;
  familyId: string;
  familyName: string;
  author: { id: string; nickname: string; avatar: string | null };
  content: string;
  imageUrls: string[];
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  comments: PostComment[];
  isMine: boolean;
  createdAt: string;
}

export async function fetchPosts(opts: { familyId?: string; page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (opts.familyId) params.set('familyId', opts.familyId);
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  const { data } = await api.get(`/posts?${params}`);
  return data as { posts: PostItem[]; total: number; page: number; limit: number };
}

export async function createPost(input: { familyId: string; content: string; imageUrls?: string[] }) {
  const { data } = await api.post('/posts', input);
  return data;
}

export async function deletePost(id: string) {
  await api.delete(`/posts/${id}`);
}

export async function likePost(id: string) {
  await api.post(`/posts/${id}/like`);
}

export async function unlikePost(id: string) {
  await api.delete(`/posts/${id}/like`);
}

export async function addComment(postId: string, content: string): Promise<PostComment> {
  const { data } = await api.post(`/posts/${postId}/comments`, { content });
  return data;
}

export async function deleteComment(postId: string, commentId: string) {
  await api.delete(`/posts/${postId}/comments/${commentId}`);
}

export async function fetchUploadSignature(): Promise<{ cloudName: string; uploadPreset: string }> {
  const { data } = await api.get('/upload/signature');
  return data;
}

export interface FamilySummary {
  id: string;
  name: string;
}

export async function fetchMyFamilies(): Promise<FamilySummary[]> {
  const { data } = await api.get('/family');
  return data.map((f: any) => ({ id: f.id, name: f.name }));
}
