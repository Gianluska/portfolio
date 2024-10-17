import { useEffect, useRef } from "react";

import gsap from "gsap";

import * as T from "./types"

export function DecoderText({
  text,
  speed = 2000,
  className = "",
  stopShuffle = false,
}: T.DecoderTextProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const shuffleIntervalRef = useRef<number | null>(null);
  const chars =
    "abcdefghijklmnopqrstuvwxyz";

  useEffect(() => {
    if (!textRef.current) return;
    const element = textRef.current;

    element.innerHTML = text
      .split("")
      .map(() => `<span class="w-9 font-tupi text-5xl mb-4">${getRandomChar()}</span>`)
      .join("");

    const spans = Array.from(element.querySelectorAll("span"));

    startShuffling(spans);

    return () => {
      stopShuffling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    if (stopShuffle && textRef.current) {
      const spans = Array.from(textRef.current.querySelectorAll("span"));
      startRevealing(spans);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopShuffle]);

  const getRandomChar = () => chars[Math.floor(Math.random() * chars.length)];

  const startShuffling = (spans: HTMLSpanElement[]) => {
    stopShuffling();
    shuffleIntervalRef.current = window.setInterval(() => {
      spans.forEach((span) => {
        if (span.getAttribute("data-revealed") !== "true") {
          span.textContent = getRandomChar();
        }
      });
    }, 50);
  };

  const stopShuffling = () => {
    if (shuffleIntervalRef.current) {
      clearInterval(shuffleIntervalRef.current);
      shuffleIntervalRef.current = null;
    }
  };

  const startRevealing = (spans: HTMLSpanElement[]) => {
    const totalDuration = speed / 1000;
    const singleDuration = totalDuration / spans.length;

    const tl = gsap.timeline({
      onComplete: () => {
        stopShuffling();
      },
    });

    spans.forEach((span, index) => {
      tl.to(
        {},
        {
          duration: singleDuration,
          onStart: () => {
            span.setAttribute("data-revealed", "true");
            span.textContent = text[index];
            span.classList.remove("font-tupi");
          },
        },
        index * singleDuration
      );
    });
  };

  return <div ref={textRef} className={`decoder-text ${className}`}></div>;
}
