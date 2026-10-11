"use client";

import { useEffect } from "react";

const OLD_DIGITS = "22570501356";
const OLD_TEXT = "+225 70 50 13 56";

export default function WhatsappSync() {
  useEffect(() => {
    let digits = "";
    let label = "";
    let timer: number | undefined;
    let observer: MutationObserver | null = null;
    let stopped = false;

    const patch = () => {
      if (!digits) return;
      document.querySelectorAll<HTMLAnchorElement>('a[href*="' + OLD_DIGITS + '"]').forEach((a) => {
        const h = a.getAttribute("href") || "";
        a.setAttribute("href", h.split(OLD_DIGITS).join(digits));
      });
      if (label) {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const nodes: Text[] = [];
        let n: Node | null = walker.nextNode();
        while (n) {
          if ((n.nodeValue || "").includes(OLD_TEXT)) nodes.push(n as Text);
          n = walker.nextNode();
        }
        nodes.forEach((t) => { t.nodeValue = (t.nodeValue || "").split(OLD_TEXT).join(label); });
      }
    };

    fetch("/api/public-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (stopped) return;
        const raw = String((d && d.values && d.values.whatsapp) || "").trim();
        const dg = raw.replace(/\D/g, "");
        if (dg.length < 8 || dg.length > 15 || dg === OLD_DIGITS) return;
        digits = dg;
        label = raw;
        patch();
        observer = new MutationObserver(() => {
          window.clearTimeout(timer);
          timer = window.setTimeout(patch, 50);
        });
        observer.observe(document.body, { childList: true, subtree: true });
      })
      .catch(() => {});

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      if (observer) observer.disconnect();
    };
  }, []);
  return null;
}