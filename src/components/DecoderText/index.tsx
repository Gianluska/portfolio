import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface DecodingTextProps {
  text: string;
  stopShuffle: boolean;
  speed?: number;
}

export const DecoderText: React.FC<DecodingTextProps> = ({ text, stopShuffle = false, speed = 50 }) => {
  const [displayText, setDisplayText] = useState<string>('');
  const textRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charsArray = text.split('');
    
    const shuffleText = () => {
      gsap.to({}, {
        duration: speed / 1000,
        repeat: -1,
        onUpdate: () => {
          setDisplayText(() =>
            charsArray.map((char, i) =>
              i < displayText.length ? char : chars[Math.floor(Math.random() * chars.length)]
            ).join('')
          );
        },
      });
    };

    const revealText = () => {
      gsap.to({}, {
        duration: 0.05,
        repeat: charsArray.length - 1,
        onRepeat: () => {
          setDisplayText((prev) => text.substring(0, prev.length + 1));
        },
        onComplete: () => {
          setDisplayText(text);
        },
      });
    };

    if (!stopShuffle) {
      shuffleText();
    } else {
      revealText();
    }

    return () => {
      gsap.killTweensOf({});
    };
  }, [stopShuffle, text, speed]);

  return <p ref={textRef} className='text-white'>{displayText}</p>;
};
