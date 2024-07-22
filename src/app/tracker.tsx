"use client";

import { useEffect } from "react";

export function Tracker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }
    fetch("https://projectplannerai.com/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: "use viewed page",
        projectId: "j5700jv8gtx7sqv1w0zn5q0djx6xd8p8",
      }),
    });
  }, []);

  return null;
}
