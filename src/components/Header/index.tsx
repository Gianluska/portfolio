"use client";

import { motion } from "framer-motion";
import styles from "./header.module.scss";
import DecoderText from "../DecoderText";

const Header = () => {
  const transition = {
    duration: 1.5,
    ease: [0.43, 0.13, 0.23, 0.96],
  };

  return (
    <header className={styles.header}>
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ ...transition, delay: 0.3 }}
        className={styles.titleWrapper}
      >
        <DecoderText
          className={styles.title}
          text="Gianlucca Claudino"
          delay={500}
        />
      </motion.h1>

      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition}
      >
        <a className={styles.link} href="#">
          About me
        </a>
        <a className={styles.link} href="#">
          Contact
        </a>
        <a className={styles.link} href="#">
          Blog
        </a>
      </motion.nav>
    </header>
  );
};

export default Header;
