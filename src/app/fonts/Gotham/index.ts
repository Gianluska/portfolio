import localFont from "next/font/local";

export const GothamFont = localFont({
  src: [
    {
      path: "./gotham-medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./gotham-medium-italic.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "./gotham-book.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./gotham-book-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./gotham-bold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./gotham-bold-italic.woff2",
      weight: "600",
      style: "italic",
    },
  ],
});
