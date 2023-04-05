"use client";

import VisuallyHidden from "@/components/VisuallyHidden";
import { useReducedMotion, useSpring } from "framer-motion";
import { memo, useEffect, useRef } from "react";
import { delay } from "@/utils/delay";
import styles from "./decoderText.module.scss";

import * as T from "./types";

// prettier-ignore
const glyphs = [
  'a', 'b', 'c', 'd', 'e',
  'f', 'g', 'h', 'i', 'j',
  'k', 'l', 'm', 'n', 'o',
  'p', 'q', 'r', 's', 't',
  'u', 'v', 'w', 'x', 'y',
  'z', 
];

const CharType = {
  Glyph: "glyph",
  Value: "value",
};

const shuffle = (
  content: string[],
  output: T.IShuffleOutput[],
  position: number
) => {
  return content.map((value: string, index: number) => {
    if (index < position) {
      return { type: CharType.Value, value };
    }

    if (position % 1 < 0.5) {
      const rand = Math.floor(Math.random() * glyphs.length);
      return { type: CharType.Glyph, value: glyphs[rand] };
    }

    return { type: CharType.Glyph, value: output[index].value };
  });
};

const DecoderText: React.FC<T.IDecoderText> = memo(
  ({ text, start = true, delay: startDelay = 0, className, ...rest }) => {
    const output = useRef([{ type: CharType.Glyph, value: "" }]);
    const container = useRef<HTMLSpanElement>(null);
    const reduceMotion = useReducedMotion();
    const decoderSpring = useSpring(0, { stiffness: 6, damping: 4 });

    useEffect(() => {
      const containerInstance: any = container.current;
      const content = text.split("");
      let animation;

      const renderOutput = () => {
        const characterMap = output.current.map((item) => {
          return `<span class="${styles[item.type]}">${item.value}</span>`;
        });

        containerInstance.innerHTML = characterMap.join("");
      };

      const unsubscribeSpring = decoderSpring.onChange((value) => {
        output.current = shuffle(content, output.current, value);
        renderOutput();
      });

      const startSpring = async () => {
        await delay(startDelay);
        decoderSpring.set(content.length);
      };

      if (start && !animation && !reduceMotion) {
        startSpring();
      }

      if (reduceMotion) {
        output.current = content.map((value: string, index: number) => ({
          type: CharType.Value,
          value: content[index],
        }));
        renderOutput();
      }

      return () => {
        unsubscribeSpring?.();
      };
    }, [decoderSpring, reduceMotion, start, startDelay, text]);

    return (
      <span className={styles.text + " " + className} {...rest}>
        <VisuallyHidden className={styles.label}>{text}</VisuallyHidden>
        <span aria-hidden className={styles.content} ref={container} />
      </span>
    );
  }
);

DecoderText.displayName = "DecoderText";
export default DecoderText;
