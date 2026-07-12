import Link from "next/link";
import { FileText } from "lucide-react";

import { BlogPostDTO } from "@/app/services/blog.service";

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(value))
    : "";

const normalizeDisplayTitle = (title: string) => {
  const trimmed = title.trim();
  if (!trimmed) return title;

  const letters = Array.from(trimmed).filter((char) => /\p{L}/u.test(char));
  const uppercaseLetters = letters.filter(
    (char) => char === char.toLocaleUpperCase("vi-VN"),
  );
  const lowercaseLetters = letters.filter(
    (char) => char === char.toLocaleLowerCase("vi-VN"),
  );
  const mostlyUppercase =
    letters.length > 0 &&
    uppercaseLetters.length / letters.length > 0.7 &&
    lowercaseLetters.length / letters.length < 0.15;

  if (!mostlyUppercase) return title;

  const normalized = trimmed
    .split(/\s+/)
    .map((word) => {
      const match = word.match(
        /^([^\p{L}\p{N}]*)([\p{L}\p{N}]+)([^\p{L}\p{N}]*)$/u,
      );
      if (!match) return word;

      const [, prefix, core, suffix] = match;
      const shouldPreserveUppercase =
        /\d/.test(core) ||
        (core.length <= 3 && core === core.toLocaleUpperCase("vi-VN"));

      return `${prefix}${shouldPreserveUppercase ? core : core.toLocaleLowerCase("vi-VN")}${suffix}`;
    })
    .join(" ");

  return normalized.charAt(0).toLocaleUpperCase("vi-VN") + normalized.slice(1);
};

interface HomeLatestBlogSectionProps {
  initialPosts: BlogPostDTO[];
}

export default function HomeLatestBlogSection({
  initialPosts,
}: HomeLatestBlogSectionProps) {
  if (initialPosts.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto mt-10 w-full max-w-[1440px] px-3 sm:px-4 md:px-6 xl:px-8">
      <div className="mb-3 flex items-center gap-3">
        <span className="h-5 w-1 shrink-0 rounded-full bg-primary" />
        <h2 className="text-[17px] font-black uppercase tracking-wide text-gray-900">
          Cẩm nang kiến thức
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {initialPosts.map((post) => (
          <article key={post.id} className="group/card flex h-full flex-col">
            <Link
              href={`/blog/${post.slug}`}
              className="relative block aspect-[16/9] overflow-hidden bg-slate-100"
            >
              {post.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.thumbnailUrl}
                  alt={post.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300">
                  <FileText size={38} />
                </div>
              )}
            </Link>

            <div className="flex flex-1 flex-col border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3 text-[12px] font-medium text-[#315f9c]">
                <span className="line-clamp-1">Cẩm Nang Kinh Nghiệm</span>
                <span className="shrink-0 text-slate-500">
                  {formatDate(post.publishedAt ?? post.createdAt)}
                </span>
              </div>

              <Link
                href={`/blog/${post.slug}`}
                className="mt-2 line-clamp-2 text-[15px] font-extrabold leading-[1.35] text-slate-950 transition-colors hover:text-[#315f9c] md:text-[16px]"
              >
                {normalizeDisplayTitle(post.title)}
              </Link>

              <p className="mt-2 line-clamp-3 flex-1 text-[12px] leading-6 text-slate-700 md:text-[13px]">
                {post.excerpt || "Bài viết đang được cập nhật nội dung chi tiết."}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
