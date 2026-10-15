import React from "react";
import { useShop } from "../context/ShopContext";

export const Announcement = () => {
  const { announcement, navigate } = useShop();

  if (!announcement || !announcement.is_enabled) {
    return null;
  }

  const {
    lead_text = "A little something for your next chapter",
    separator_symbol = "—",
    highlight_text = "Save up to 40% on selected reads",
    tag_text = "✦ Free shipping on orders over ₹799",
    bg_theme = "navy",
    link_url = ""
  } = announcement;

  const handleClick = (e) => {
    if (link_url && link_url.trim()) {
      e.preventDefault();
      navigate(link_url.trim());
    }
  };

  const isClickable = Boolean(link_url && link_url.trim());
  const themeClass = bg_theme ? `announcement-${bg_theme}` : "announcement-navy";

  return (
    <aside
      className={`announcement ${themeClass} ${isClickable ? "is-clickable" : ""}`}
      aria-label="Special promotion"
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {lead_text && <span>{lead_text}</span>}
      {lead_text && (highlight_text || tag_text) && separator_symbol && (
        <span className="announcement-sep">{separator_symbol}</span>
      )}
      {highlight_text && <strong>{highlight_text}</strong>}
      {tag_text && <span className="announcement-tag">{tag_text}</span>}
    </aside>
  );
};
