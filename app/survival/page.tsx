import Survival from "./survival";
import BrandSwap from "./brand-swap";
import styles from "./theme.module.css";

export default function SurvivalPage() {
  return (
    <div className={styles.theme}>
      <BrandSwap>
        <Survival />
      </BrandSwap>
    </div>
  );
}
