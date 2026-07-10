"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const SUPPORT_PHONE = "0395024181";
const SUPPORT_PHONE_DISPLAY = "0395 024 181";
const SUPPORT_HOURS = "08:00 - 22:00 (T2 - CN)";
const ZALO_CHAT_URL = `https://zalo.me/${SUPPORT_PHONE}`;
const SUPPORT_LOGO = "/images/logo_arishrimp_tachnen.png";
const ZALO_ICON_URL = "https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Zalo-Arc.png";
const PHONE_ICON_URL = "https://cdn.pixabay.com/photo/2016/11/17/16/06/icons-1831923_1280.png";
const SUPPORT_ICON_URL = "https://marketplace.canva.com/Zz79M/MAEeMxZz79M/1/tl/canva-cogwheel-gear-icon-MAEeMxZz79M.png";

type ContactItemProps = {
  title: string;
  description: string;
  href: string;
  external?: boolean;
  accentClass: string;
  icon: React.ReactNode;
};

function ContactItem({
  title,
  description,
  href,
  external = false,
  accentClass,
  icon,
}: ContactItemProps) {
  const content = (
    <div className="group flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 transition-colors duration-200 hover:border-[#1965a2]/25 hover:bg-white">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm ${accentClass}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-[#1965a2] md:text-[14px]">
          {title}
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-gray-600 md:text-[12px]">
          {description}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#1965a2] transition-transform duration-200 group-hover:translate-x-0.5" />
    </div>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }

  if (href.startsWith("/")) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return <a href={href} className="block">{content}</a>;
}

export default function AIChatButton() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const shouldHideOnPath = [
    "/admin",
    "/login",
    "/signup",
    "/reset-password",
    "/ai-doctor",
  ].some((path) => pathname?.startsWith(path));
  const isExpanded = isHovered || isPinnedOpen;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;

      setIsPinnedOpen(false);
      setIsHovered(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  if (shouldHideOnPath) return null;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-20 right-4 z-50 flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-4 md:bottom-6 md:right-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isExpanded && (
        <div className="w-[min(88vw,360px)] overflow-hidden rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50">
              <Image
                src={SUPPORT_LOGO}
                alt="AgriShrimp"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="text-[14px] font-bold text-[#1965a2] md:text-[15px]">
                Liên hệ để được tư vấn
              </h3>
              <p className="mt-1 text-[11px] leading-snug text-gray-500 md:text-[12px]">
                Giờ hỗ trợ: {SUPPORT_HOURS}
              </p>
            </div>
            <button
              type="button"
              aria-label="Đóng bảng liên hệ"
              onClick={() => {
                setIsPinnedOpen(false);
                setIsHovered(false);
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition-colors hover:bg-blue-50 hover:text-[#1965a2]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="my-4 border-b border-gray-200" />

          <div className="space-y-4 px-1 py-1">
            <ContactItem
              title="Liên hệ Zalo"
              description="Trao đổi trực tiếp với tư vấn viên"
              href={ZALO_CHAT_URL}
              external
              accentClass="bg-white border border-blue-100"
              icon={
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ZALO_ICON_URL}
                  alt="Zalo"
                  className="h-7 w-7 object-contain"
                />
              }
            />
            <ContactItem
              title="Gọi tư vấn"
              description={`Hotline: ${SUPPORT_PHONE_DISPLAY}`}
              href={`tel:${SUPPORT_PHONE}`}
              accentClass="bg-white border border-blue-100"
              icon={
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={PHONE_ICON_URL}
                  alt="Gọi tư vấn"
                  className="h-7 w-7 object-contain"
                />
              }
            />
            <ContactItem
              title="Gửi yêu cầu hỗ trợ"
              description="Mở trang hỗ trợ của AgriShrimp"
              href="/support"
              accentClass="bg-white border border-blue-100"
              icon={
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={SUPPORT_ICON_URL}
                  alt="Hỗ trợ"
                  className="h-7 w-7 object-contain"
                />
              }
            />
          </div>
        </div>
      )}

      <button
        type="button"
        aria-expanded={isExpanded}
        aria-label="Mở bảng liên hệ AgriShrimp"
        aria-pressed={isPinnedOpen}
        onClick={() => setIsPinnedOpen((current) => !current)}
        className={`group flex items-center overflow-hidden rounded-full bg-[#1965a2] py-2.5 text-left text-white shadow-sm transition-all duration-200 hover:bg-[#15588d] ${
          isExpanded ? "gap-3 px-3.5" : "gap-0 px-2.5"
        }`}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
          <Image
            src={SUPPORT_LOGO}
            alt="AgriShrimp"
            width={34}
            height={34}
            className="h-[34px] w-[34px] rounded-full object-contain"
          />
        </span>
        <span
          className={`overflow-hidden whitespace-nowrap pr-1.5 text-[13px] font-extrabold tracking-[-0.02em] transition-all duration-200 md:text-[14px] ${
            isExpanded ? "max-w-[220px] opacity-100" : "max-w-0 opacity-0"
          }`}
        >
          Liên hệ AgriShrimp
        </span>
      </button>
    </div>
  );
}
