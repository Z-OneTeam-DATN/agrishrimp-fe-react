"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, MessageCircle, Reply, Send, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import {
  BlogCommentDTO,
  createPublicBlogComment,
  getPublicBlogComments,
} from "@/app/services/blog.service";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

const MAX_COMMENT_LENGTH = 2000;

interface BlogCommentsProps {
  slug: string;
  className?: string;
}

interface ReplyTarget {
  parentId: number;
  authorName: string;
}

const formatCommentTime = (value?: string | null) => {
  if (!value) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const getFullImageUrl = (path?: string | null) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  if (path.startsWith("/api")) return path.replace("/api", "/be-api");
  return `/be-api${path.startsWith("/") ? "" : "/"}${path}`;
};

const getErrorMessage = (error: unknown) => {
  const data = (error as { response?: { data?: Record<string, unknown> } })?.response?.data;
  const message = data?.message ?? data?.detail ?? data?.error;
  return typeof message === "string" && message.trim()
    ? message
    : "Chưa gửi được bình luận. Vui lòng thử lại.";
};

const countComments = (comments: BlogCommentDTO[]) =>
  comments.reduce((total, comment) => total + 1 + (comment.replies?.length ?? 0), 0);

const appendReply = (
  comments: BlogCommentDTO[],
  parentId: number,
  reply: BlogCommentDTO
): BlogCommentDTO[] =>
  comments.map((comment) =>
    comment.id === parentId
      ? { ...comment, replies: [...(comment.replies ?? []), reply] }
      : comment
  );

export default function BlogComments({ slug, className }: BlogCommentsProps) {
  const router = useRouter();
  const { data: user, isAuthenticated, isLoading } = useCurrentUser();

  const [comments, setComments] = useState<BlogCommentDTO[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [rootContent, setRootContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [submitting, setSubmitting] = useState<"root" | "reply" | null>(null);

  const loginHref = `/login?redirect=/blog/${slug}`;
  const commentCount = useMemo(() => countComments(comments), [comments]);
  const currentUserName =
    user?.displayName || user?.fullName || user?.email?.split("@")[0] || "Bạn";
  const currentAvatar = getFullImageUrl(user?.avatar?.imageUrl || (user as any)?.avatarUrl);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const data = await getPublicBlogComments(slug);
      setComments(data);
    } finally {
      setLoadingComments(false);
    }
  }, [slug]);

  useEffect(() => {
    loadComments().catch(() => {
      setComments([]);
      setLoadingComments(false);
    });
  }, [loadComments]);

  const requireLogin = () => {
    toast.info("Vui lòng đăng nhập để bình luận.");
    router.push(loginHref);
  };

  const handleSubmitRoot = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = rootContent.trim();
    if (!content) return;
    if (!isAuthenticated) {
      requireLogin();
      return;
    }

    setSubmitting("root");
    try {
      const created = await createPublicBlogComment(slug, { content });
      setComments((prev) => [...prev, { ...created, replies: created.replies ?? [] }]);
      setRootContent("");
      toast.success("Đã đăng bình luận.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(null);
    }
  };

  const handleStartReply = (comment: BlogCommentDTO) => {
    setReplyTarget({ parentId: comment.id, authorName: comment.authorName });
    setReplyContent(`@${comment.authorName} `);
  };

  const handleSubmitReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!replyTarget) return;

    const mentionPrefix = `@${replyTarget.authorName}`;
    const rawContent = replyContent.trim();
    const content = rawContent.startsWith(mentionPrefix)
      ? rawContent
      : `${mentionPrefix} ${rawContent}`.trim();

    if (!content || content === mentionPrefix) return;
    if (!isAuthenticated) {
      requireLogin();
      return;
    }

    setSubmitting("reply");
    try {
      const created = await createPublicBlogComment(slug, {
        content,
        parentId: replyTarget.parentId,
      });
      setComments((prev) => appendReply(prev, replyTarget.parentId, { ...created, replies: [] }));
      setReplyContent("");
      setReplyTarget(null);
      toast.success("Đã trả lời bình luận.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(null);
    }
  };

  const renderAvatar = (comment: BlogCommentDTO, sizeClass = "h-10 w-10") => {
    const avatar = getFullImageUrl(comment.authorAvatarUrl);

    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500",
          sizeClass
        )}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={comment.authorName}
            className="h-full w-full object-cover"
            onError={(event) => {
              (event.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <UserRound size={18} />
        )}
      </div>
    );
  };

  const renderComment = (comment: BlogCommentDTO) => (
    <article key={comment.id} className="py-5 first:pt-0 last:pb-0">
      <div className="flex gap-3 sm:gap-4">
        {renderAvatar(comment)}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-sm font-bold text-slate-950">{comment.authorName}</h3>
            <span className="text-xs font-medium text-slate-400">
              {formatCommentTime(comment.createdAt)}
            </span>
          </div>

          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
            {comment.content}
          </p>

          <button
            type="button"
            onClick={() => handleStartReply(comment)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 transition-colors hover:text-blue-900"
          >
            <Reply size={14} />
            Trả lời
          </button>

          {replyTarget?.parentId === comment.id && (
            <form
              onSubmit={handleSubmitReply}
              className="mt-4 rounded-xl border border-blue-100 bg-blue-50/40 p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-600">
                  Trả lời {comment.authorName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setReplyTarget(null);
                    setReplyContent("");
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white hover:text-slate-800"
                  aria-label="Hủy trả lời"
                >
                  <X size={15} />
                </button>
              </div>
              <textarea
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
                maxLength={MAX_COMMENT_LENGTH}
                rows={3}
                className="min-h-[86px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500"
                placeholder={`@${comment.authorName} `}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  {replyContent.trim().length}/{MAX_COMMENT_LENGTH}
                </span>
                <button
                  type="submit"
                  disabled={submitting === "reply" || !replyContent.trim()}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-xs font-bold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submitting === "reply" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Gửi trả lời
                </button>
              </div>
            </form>
          )}

          {comment.replies?.length > 0 && (
            <div className="mt-5 space-y-4 border-l border-slate-200 pl-4 sm:pl-5">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex gap-3">
                  {renderAvatar(reply, "h-8 w-8")}
                  <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h4 className="text-sm font-bold text-slate-900">{reply.authorName}</h4>
                      <span className="text-xs font-medium text-slate-400">
                        {formatCommentTime(reply.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                      {reply.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );

  return (
    <section className={cn("mt-12 border-t border-slate-200 pt-8", className)}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageCircle size={19} className="text-blue-700" />
          <h2 className="text-lg font-bold text-slate-900">Bình luận bài viết</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {commentCount} bình luận
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            Đang kiểm tra đăng nhập...
          </div>
        ) : isAuthenticated ? (
          <form onSubmit={handleSubmitRoot}>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-blue-700">
                {currentAvatar ? (
                  <img src={currentAvatar} alt={currentUserName} className="h-full w-full object-cover" />
                ) : (
                  <UserRound size={18} />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{currentUserName}</p>
                <p className="text-xs text-slate-500">Đang bình luận bằng tài khoản của bạn</p>
              </div>
            </div>

            <textarea
              value={rootContent}
              onChange={(event) => setRootContent(event.target.value)}
              maxLength={MAX_COMMENT_LENGTH}
              rows={4}
              className="min-h-[112px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
              placeholder="Viết bình luận của bạn..."
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                {rootContent.trim().length}/{MAX_COMMENT_LENGTH}
              </span>
              <button
                type="submit"
                disabled={submitting === "root" || !rootContent.trim()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-bold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting === "root" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Gửi bình luận
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Đăng nhập để tham gia thảo luận</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Bạn có thể bình luận và trả lời nhận xét ngay dưới bài viết.
              </p>
            </div>
            <Link
              href={loginHref}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition-colors hover:bg-blue-800"
            >
              <LogIn size={16} />
              Đăng nhập
            </Link>
          </div>
        )}
      </div>

      <div className="mt-6">
        {loadingComments ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-12">
            <Loader2 className="mb-3 animate-spin text-blue-600" size={28} />
            <p className="text-sm font-medium text-slate-500">Đang tải bình luận...</p>
          </div>
        ) : comments.length > 0 ? (
          <div className="divide-y divide-slate-200">{comments.map(renderComment)}</div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
            <h3 className="text-base font-bold text-slate-800">Chưa có bình luận nào</h3>
            <p className="mt-2 text-sm text-slate-500">
              Hãy là người đầu tiên chia sẻ câu hỏi hoặc kinh nghiệm của bạn.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
