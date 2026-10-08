import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import FlightsPage from "./pages/FlightsPage";
import SeatsPage from "./pages/SeatsPage";
import "./styles.css";

const router = createBrowserRouter([
  { path: "/", element: <FlightsPage /> },
  { path: "/flights/:id", element: <SeatsPage /> },
  { path: "*", element: <FlightsPage /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
