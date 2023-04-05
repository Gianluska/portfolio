"use client";
import DecoderText from "@/components/DecoderText";
import styles from "./home.module.scss";
import { motion } from "framer-motion";

const transition = {
  duration: 1.5,
  ease: [0.43, 0.13, 0.23, 0.96],
  delay: 0.3,
};

const Home = () => {
  return (
    <section className={styles.hero}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition}
      >
        <DecoderText
          className={styles.title}
          text="Gianlucca Claudino"
          delay={300}
        />
      </motion.div>
    </section>
  );
};

export default Home;
