import React, { useEffect, useState } from 'react';
import gsap from 'gsap';

interface DecodingTextProps {
  text: string;
  stopShuffle: boolean;
  speed?: number; // Velocidade de revelação (em milissegundos)
}

export const DecoderText: React.FC<DecodingTextProps> = ({ text, stopShuffle, speed = 50 }) => {
  const [displayText, setDisplayText] = useState<string>('');
  const [shuffling, setShuffling] = useState<boolean>(true);

  useEffect(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let intervalId: NodeJS.Timeout | null = null;

    const shuffleText = () => {
      intervalId = setInterval(() => {
        setDisplayText(
          text.split('').map((char, i) =>
            i < displayText.length
              ? char
              : chars[Math.floor(Math.random() * chars.length)]
          ).join('')
        );
      }, speed);
    };

    const revealText = () => {
      gsap.to({}, {
        duration: speed / 1000,
        repeat: text.length - 1,
        onRepeat: () => {
          setDisplayText((prev) => text.substring(0, prev.length + 1));
        },
        onComplete: () => {
          setDisplayText(text); // Garante que todo o texto seja revelado ao final
          setShuffling(false);  // Para o shuffle
        },
      });
    };

    if (!stopShuffle) {
      shuffleText();
    } else {
      if (intervalId) clearInterval(intervalId); // Para o shuffle quando começar a revelação
      revealText();
    }

    return () => {
      if (intervalId) clearInterval(intervalId); // Limpa o shuffle quando o componente desmonta
      gsap.killTweensOf({}); // Limpa qualquer animação quando o componente desmontar
    };
  }, [stopShuffle, text, speed]);

  return <p className='text-white'>{displayText}</p>;
};
