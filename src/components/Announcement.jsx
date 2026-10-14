import React from "react";

export const Announcement = () => {
  return (
    <aside className="announcement" aria-label="Special promotion">
      <span>A little something for your next chapter</span>
      <span className="announcement-sep">—</span>
      <strong>Save up to 40% on selected reads</strong>
      <span className="announcement-tag">✦ Free shipping on orders over ₹799</span>
    </aside>
  );
};
