import { Intro } from "@/components/Intro";
import styles from "./home.module.scss";

const transition = {
  duration: 1.5,
  ease: [0.43, 0.13, 0.23, 0.96],
  delay: 0.3,
};

const Home = () => {
  return (
    <section className={styles.hero}>
      <Intro />
    </section>
  );
};

export default Home;
