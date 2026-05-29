import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const labels = { light: "Light", dark: "Dark", system: "System" };
const Icon = ({ theme }) => {
  if (theme === "light") return <Sun className="w-3.5 h-3.5" strokeWidth={1.5} />;
  if (theme === "dark") return <Moon className="w-3.5 h-3.5" strokeWidth={1.5} />;
  return <Monitor className="w-3.5 h-3.5" strokeWidth={1.5} />;
};

const ThemeToggle = () => {
  const { theme, cycleTheme } = useTheme();
  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="sy-status-indicator"
      style={{
        background: "transparent",
        border: "1px solid var(--sy-border-default)",
        padding: "6px 10px",
        borderRadius: 8,
        cursor: "pointer",
        color: "var(--sy-text-secondary)",
      }}
      aria-label={`Theme: ${labels[theme]}. Click to switch to ${labels[next]}.`}
      title={`Theme: ${labels[theme]}. Click for ${labels[next]}.`}
      data-testid="theme-toggle"
    >
      <Icon theme={theme} />
      <span>{labels[theme]}</span>
    </button>
  );
};

export default ThemeToggle;
