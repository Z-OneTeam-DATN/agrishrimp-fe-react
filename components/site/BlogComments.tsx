"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  LogIn,
  Send,
  SlidersHorizontal,
  SmilePlus,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  BlogCommentDTO,
  createPublicBlogComment,
  getPublicBlogComments,
} from "@/app/services/blog.service";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

const MAX_COMMENT_LENGTH = 2000;

type SortMode = "newest" | "oldest";

interface BlogCommentsProps {
  slug: string;
  className?: string;
}

interface ReplyTarget {
  parentId: number;
  sourceId: number;
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

const getTimestamp = (value?: string | null) => (value ? new Date(value).getTime() : 0);

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
  const [rootFocused, setRootFocused] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [openThreads, setOpenThreads] = useState<Set<number>>(new Set());

  const loginHref = `/login?redirect=/blog/${slug}`;
  const commentCount = useMemo(() => countComments(comments), [comments]);
  const currentUserName =
    user?.displayName || user?.fullName || user?.email?.split("@")[0] || "Bạn";
  const currentAvatar = getFullImageUrl(user?.avatar?.imageUrl || (user as any)?.avatarUrl);

  const sortedComments = useMemo(() => {
    const direction = sortMode === "newest" ? -1 : 1;

    return [...comments]
      .sort((a, b) => (getTimestamp(a.createdAt) - getTimestamp(b.createdAt)) * direction)
      .map((comment) => ({
        ...comment,
        replies: [...(comment.replies ?? [])].sort(
          (a, b) => getTimestamp(a.createdAt) - getTimestamp(b.createdAt)
        ),
      }));
  }, [comments, sortMode]);

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

  const toggleThread = (commentId: number) => {
    setOpenThreads((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
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
      setComments((prev) => [{ ...created, replies: created.replies ?? [] }, ...prev]);
      setRootContent("");
      setRootFocused(false);
      toast.success("Đã đăng bình luận.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(null);
    }
  };

  const handleStartReply = (parentId: number, sourceId: number, authorName: string) => {
    if (!isAuthenticated) {
      requireLogin();
      return;
    }

    setReplyTarget({ parentId, sourceId, authorName });
    setReplyContent(`@${authorName} `);
    setOpenThreads((prev) => new Set(prev).add(parentId));
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
      setOpenThreads((prev) => new Set(prev).add(replyTarget.parentId));
      setReplyContent("");
      setReplyTarget(null);
      toast.success("Đã trả lời bình luận.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(null);
    }
  };

  const renderCurrentAvatar = (sizeClass = "h-10 w-10") => (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500",
        sizeClass
      )}
    >
      {currentAvatar ? (
        <img src={currentAvatar} alt={currentUserName} className="h-full w-full object-cover" />
      ) : (
        <UserRound size={18} />
      )}
    </div>
  );

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

  const renderReplyComposer = () => {
    if (!replyTarget) return null;

    return (
      <form onSubmit={handleSubmitReply} className="mt-4 flex gap-3">
        {renderCurrentAvatar("h-8 w-8")}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-slate-500">
              Đang trả lời @{replyTarget.authorName}
            </span>
            <button
              type="button"
              onClick={() => {
                setReplyTarget(null);
                setReplyContent("");
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="Hủy trả lời"
            >
              <X size={15} />
            </button>
          </div>

          <textarea
            value={replyContent}
            onChange={(event) => setReplyContent(event.target.value)}
            maxLength={MAX_COMMENT_LENGTH}
            rows={2}
            autoFocus
            className="max-h-40 min-h-[46px] w-full resize-y border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm leading-6 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-950"
            placeholder={`@${replyTarget.authorName} `}
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
              aria-label="Mở biểu tượng cảm xúc"
            >
              <SmilePlus size={18} />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setReplyTarget(null);
                  setReplyContent("");
                }}
                className="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting === "reply" || !replyContent.trim()}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                {submitting === "reply" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Phản hồi
              </button>
            </div>
          </div>
        </div>
      </form>
    );
  };

  const renderReply = (reply: BlogCommentDTO, parent: BlogCommentDTO) => (
    <div key={reply.id} className="flex gap-3">
      {renderAvatar(reply, "h-8 w-8")}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h4 className="text-[13px] font-bold text-slate-950">{reply.authorName}</h4>
          <span className="text-xs font-medium text-slate-500">{formatCommentTime(reply.createdAt)}</span>
        </div>
        <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
          {reply.content}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleStartReply(parent.id, reply.id, reply.authorName)}
            className="inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
          >
            Phản hồi
          </button>
        </div>
        {replyTarget?.sourceId === reply.id && renderReplyComposer()}
      </div>
    </div>
  );

  const renderComment = (comment: BlogCommentDTO) => {
    const replies = comment.replies ?? [];
    const isOpen = openThreads.has(comment.id);

    return (
      <article key={comment.id} className="flex gap-3 py-5 sm:gap-4">
        {renderAvatar(comment)}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h3 className="text-sm font-bold text-slate-950">{comment.authorName}</h3>
            <span className="text-xs font-medium text-slate-500">{formatCommentTime(comment.createdAt)}</span>
          </div>

          <p className="mt-1.5 whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-900">
            {comment.content}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStartReply(comment.id, comment.id, comment.authorName)}
              className="inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
            >
              Phản hồi
            </button>
          </div>

          {replyTarget?.sourceId === comment.id && renderReplyComposer()}

          {replies.length > 0 && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => toggleThread(comment.id)}
                className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-50"
              >
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                {replies.length} phản hồi
              </button>

              {isOpen && <div className="mt-3 space-y-5">{replies.map((reply) => renderReply(reply, comment))}</div>}
            </div>
          )}
        </div>
      </article>
    );
  };

  return (
    <section className={cn("mt-12 border-t border-slate-200 pt-8", className)}>
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <h2 className="text-[22px] font-bold leading-tight text-slate-950 sm:text-[26px]">
          {commentCount} bình luận
        </h2>

        <label className="inline-flex h-10 items-center gap-3 text-sm font-bold text-slate-900">
          <SlidersHorizontal size={22} />
          <span>Sắp xếp theo</span>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            className="cursor-pointer border-0 bg-transparent text-sm font-bold text-slate-900 outline-none"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </label>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            Đang kiểm tra đăng nhập...
          </div>
        ) : isAuthenticated ? (
          <form onSubmit={handleSubmitRoot} className="flex gap-3 sm:gap-4">
            {renderCurrentAvatar()}
            <div className="min-w-0 flex-1">
              <textarea
                value={rootContent}
                onFocus={() => setRootFocused(true)}
                onChange={(event) => setRootContent(event.target.value)}
                maxLength={MAX_COMMENT_LENGTH}
                rows={rootFocused || rootContent ? 3 : 1}
                className="max-h-44 min-h-[42px] w-full resize-y border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm leading-6 text-slate-900 outline-none transition-colors placeholder:text-slate-500 focus:border-slate-950"
                placeholder="Viết bình luận..."
              />

              {(rootFocused || rootContent) && (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
                    aria-label="Mở biểu tượng cảm xúc"
                  >
                    <SmilePlus size={18} />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRootContent("");
                        setRootFocused(false);
                      }}
                      className="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-100"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={submitting === "root" || !rootContent.trim()}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {submitting === "root" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                      Bình luận
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        ) : (
          <div className="flex gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <UserRound size={18} />
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 border-b border-slate-300 pb-3">
              <span className="text-sm font-medium text-slate-500">Đăng nhập để bình luận.</span>
              <Link
                href={loginHref}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800"
              >
                <LogIn size={15} />
                Đăng nhập
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        {loadingComments ? (
          <div className="flex items-center gap-3 py-8 text-sm font-medium text-slate-500">
            <Loader2 className="animate-spin text-blue-600" size={24} />
            Đang tải bình luận...
          </div>
        ) : sortedComments.length > 0 ? (
          <div className="divide-y-0">{sortedComments.map(renderComment)}</div>
        ) : (
          <div className="py-10 text-sm text-slate-500">
            Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ ý kiến của bạn.
          </div>
        )}
      </div>
    </section>
  );
}
