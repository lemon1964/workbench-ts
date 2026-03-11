// src/components/layout/AudioToggle.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export default function AudioToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  // Инициализация аудио и автозапуск по первому клику пользователя
  useEffect(() => {
    // ВАЖНО: абсолютный путь от корня, чтобы работало на /p/... и в проде
    audioRef.current = new Audio("/audio/golden-city.mp3");
    audioRef.current.loop = true;

    const tryPlay = () => {
      if (audioRef.current && !playing) {
        audioRef.current
          .play()
          .then(() => setPlaying(true))
          .catch(() => {});
      }
    };

    document.body.addEventListener("click", tryPlay, { once: true });
    return () => document.body.removeEventListener("click", tryPlay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setPlaying(false);
  };

  // Останавливаем музыку при уходе со страницы/внешней навигации
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const a = target?.closest("a") as HTMLAnchorElement | null;
      if (!a) return;

      const href = a.getAttribute("href") || "";
      if (!href) return;

      const isSpecialScheme =
        href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("sms:");

      let isExternal = false;
      try {
        const url = new URL(href, window.location.href);
        isExternal = url.origin !== window.location.origin;
      } catch {
        // относительные/якоря — ок
      }

      if (isSpecialScheme || isExternal) stopAudio();
    };

    const onPageHide = () => stopAudio();
    const onBeforeUnload = () => stopAudio();
    const onVisibilityChange = () => {
      if (document.hidden) stopAudio();
    };

    document.addEventListener("click", onDocClick, true);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("click", onDocClick, true);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (playing) {
      stopAudio();
      return;
    }

    audioRef.current
      .play()
      .then(() => setPlaying(true))
      .catch(() => {});
  };

  return (
    <button
      type="button"
      onClick={toggleAudio}
      className="text-slate-400 hover:text-slate-100 transition select-none"
      aria-label={playing ? "Выключить музыку" : "Включить музыку"}
      title={playing ? "Выключить музыку" : "Включить музыку"}
    >
      {playing ? "🔊" : "🔇"}
    </button>
  );
}