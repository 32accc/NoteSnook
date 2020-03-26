import React from "react";
import { ThemeProvider as EmotionThemeProvider } from "emotion-theming";
import { store, useStore } from "../stores/app-store";
import { addCss } from "./css";

function colorsLight(primary) {
  return makeTheme({
    primary,
    background: "white",
    accent: "white",
    navbg: "#f0f0f0",
    border: "#f0f0f0",
    hover: "#e0e0e0",
    fontSecondary: "white",
    text: "#000000",
    overlay: "rgba(0, 0, 0, 0.1)",
    secondary: "white",
    icon: "#3b3b3b"
  });
}

function colorsDark(primary) {
  return makeTheme({
    primary,
    background: "#1f1f1f",
    accent: "#000",
    navbg: "#2b2b2b",
    border: "#2b2b2b",
    hover: "#3b3b3b",
    fontSecondary: "#000",
    text: "#ffffff",
    overlay: "rgba(255, 255, 255, 0.5)",
    secondary: "black",
    icon: "#dbdbdb"
  });
}

const shadowsDark = {
  1: "0 0 0px 0px #00000000",
  2: "0 0 8px 0px #55555544",
  3: "0 0 20px 0px #55555599"
};

const shadowsLight = {
  1: "0 0 20px 0px #1790F3aa",
  2: "0 0 8px 0px #00000047",
  3: "0 0 20px 0px #aaaaaa77",
  4: "0 0 5px 0px #00000017"
};

function theme(colors, shadows) {
  return {
    breakpoints: ["480px", "1000px", "1000px"],
    colors: colors,
    space: [0, 5, 10, 12, 15],
    fontSizes: {
      heading: 28,
      input: 14,
      title: 18,
      subtitle: 16,
      body: 14,
      menu: 14,
      subBody: 11
    },
    fontWeights: {
      body: 400,
      heading: 700,
      bold: 700
    },
    fonts: {
      body: "Noto Sans JP, sans-serif",
      heading: "Noto Serif, serif"
    },
    sizes: {
      full: "100%"
    },
    radii: {
      none: 0,
      default: 5
    },
    forms: {
      default: {
        borderWidth: 0,
        borderRadius: "default",
        border: "2px solid",
        borderColor: "border",
        fontFamily: "body",
        fontWeight: "body",
        fontSizes: "input",
        ":focus": {
          outline: "none",
          borderColor: "primary"
        },
        ":hover": {
          borderColor: "hover"
        }
      },
      search: {
        variant: "forms.default",
        ":focus": {
          outline: "none",
          boxShadow: 4
        }
      },
      error: {
        variant: "forms.default",
        borderColor: "red",
        ":focus": {
          outline: "none",
          borderColor: "red"
        },
        ":hover": {
          borderColor: "red"
        }
      }
    },
    text: {
      heading: {
        fontFamily: "heading",
        fontWeight: "heading",
        fontSize: "heading",
        color: "text"
      },
      title: {
        fontFamily: "heading",
        fontWeight: "bold",
        fontSize: "title"
      },
      body: {
        fontFamily: "body",
        fontWeight: "body",
        fontSize: "body"
      },
      menu: {
        pt: 1,
        pb: 2,
        px: 2,
        cursor: "pointer",
        ":hover": {
          backgroundColor: "shade"
        }
      }
    },
    buttons: {
      primary: {
        color: "fontSecondary",
        bg: "primary",
        borderRadius: "default",
        fontFamily: "body",
        fontWeight: "body",
        ":focus": {
          outline: "none"
        },
        ":hover": {
          cursor: "pointer"
        },
        ...ButtonPressedStyle
      },
      secondary: {
        variant: "buttons.primary",
        color: "text",
        bg: "navbg",
        ...ButtonPressedStyle
      },
      tertiary: {
        variant: "buttons.primary",
        color: "text",
        bg: "transparent",
        border: "2px solid",
        borderColor: "border",
        ":active": {
          color: "primary",
          opacity: 0.8
        }
      },
      nav: {
        bg: "transparent",
        fontFamily: "body",
        fontWeight: "body",
        ":focus": {
          outline: "none"
        }
      },
      links: {
        variant: "buttons.primary",
        bg: "transparent",
        color: "primary",
        fontSize: "subBody",
        fontFamily: "body",
        py: 0,
        px: 0,
        my: 0,
        mx: 0
      },
      setting: {
        bg: "transparent",
        borderBottom: "1px Solid",
        borderColor: "border",
        color: "text",
        textAlign: "left",
        fontSize: "body",
        borderRadius: 0,
        py: 2,
        px: 2,
        outline: "none",
        ":hover": { borderColor: "primary" },
        ":active": { color: "gray" }
      }
    },
    shadows: shadows
  };
}

function makeTheme({
  primary,
  background,
  accent,
  navbg,
  border,
  hover,
  fontSecondary,
  text,
  overlay,
  secondary,
  icon
}) {
  return {
    background,
    primary,
    shade: hexToRGB(primary, 0.1),
    //secondary: "",
    accent,
    //custom
    navbg,
    border,
    hover,
    fontSecondary,
    fontTertiary: "gray",
    transparent: "transparent",
    text,
    placeholder: hexToRGB(text, 0.6),
    overlay,
    static: "white",
    secondary,
    icon,
    error: "red",
    favorite: "#ffd700"
  };
}

function getTheme(type, accent) {
  return type === "dark"
    ? theme(colorsDark(accent), shadowsDark)
    : theme(colorsLight(accent), shadowsLight);
}

var currentTheme = window.localStorage.getItem("theme") || "light";
var currentAccent = window.localStorage.getItem("accent") || "#0560ff";

export function ThemeProvider(props) {
  let theme = useStore(store => store.theme);
  theme = theme.colors ? theme : getTheme(currentTheme, currentAccent);
  addCss(cssTheme(theme));
  return (
    <EmotionThemeProvider theme={theme}>
      {props.children instanceof Function
        ? props.children(theme)
        : props.children}
    </EmotionThemeProvider>
  );
}

export function changeAccent(accent) {
  currentAccent = accent;
  window.localStorage.setItem("accent", accent);
  const theme = getTheme(currentTheme, currentAccent);
  addCss(cssTheme(theme));
  store.getState().setTheme(theme);
}

export function changeTheme() {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  window.localStorage.setItem("theme", currentTheme);
  const theme = getTheme(currentTheme, currentAccent);
  addCss(cssTheme(theme));
  store.getState().setTheme(theme);
}

export function isDarkTheme() {
  return currentTheme === "dark";
}

export const ButtonPressedStyle = {
  ":active": {
    opacity: "0.8"
  }
};

function cssTheme(theme) {
  let root = ":root {";
  for (let color in theme.colors) {
    root += `--${color}: ${theme.colors[color]};`;
  }
  return root + "}";
}

function hexToRGB(hex, alpha = 1) {
  let parseString = hex;
  if (hex.startsWith("#")) {
    parseString = hex.slice(1, 7);
  }
  if (parseString.length !== 6) {
    return null;
  }
  const r = parseInt(parseString.slice(0, 2), 16);
  const g = parseInt(parseString.slice(2, 4), 16);
  const b = parseInt(parseString.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
