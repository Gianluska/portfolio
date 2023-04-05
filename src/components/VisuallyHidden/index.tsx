import { forwardRef } from "react";
import styles from "./visuallyHidden.module.scss";

const VisuallyHidden: React.FC<any> = forwardRef(
  (
    {
      className,
      showOnFocus,
      as: Component = "span",
      children,
      visible,
      ...rest
    },
    ref
  ) => {
    return (
      <Component
        className={styles.hidden + " " + className}
        data-hidden={!visible && !showOnFocus}
        data-show-on-focus={showOnFocus}
        ref={ref}
        {...rest}
      >
        {children}
      </Component>
    );
  }
);

VisuallyHidden.displayName = "VisuallyHidden";
export default VisuallyHidden;
