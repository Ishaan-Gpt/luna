"use client";

import { useMemo } from "react";
import { altFn, dirWord, fistsText, riseSet } from "@/lib/ground";
import { conName } from "@/lib/catalog";
import { fmtTime } from "@/lib/sky";
import { STARS } from "@/lib/stars";
import { useApp } from "./store";
import { Btn, GMine, Row, Sheet } from "./ui";

const KIND: Record<string, string> = { star: "Star", planet: "Planet", moon: "Our moon", sun: "Our star", dso: "Deep-sky object" };

export function ObjectSheet() {
  const { sky, selected, select, loc, catalog, marks, toggleMark, nicknames, setNickname, setTab } = useApp();
  const obj = useMemo(() => sky?.objs.find((o) => o.id === selected) ?? null, [sky, selected]);
  const rs = useMemo(() => {
    if (!obj || !sky) return null;
    const fn = altFn(obj, loc);
    return fn ? riseSet(fn, sky.date) : null;
  }, [obj, sky, loc]);
  const extra = obj?.kind === "star" ? STARS.find((s) => s.name.toLowerCase() === obj.name.toLowerCase()) : undefined;
  const marked = obj ? marks.includes(obj.id) : false;
  const nick = obj ? nicknames[obj.id] ?? "" : "";

  const ask = () => {
    if (!obj) return;
    try {
      sessionStorage.setItem("luna-ask", `Tell me about ${obj.name}. Where is it and when is it best tonight?`);
    } catch {}
    select(null);
    setTab("ask");
  };

  return (
    <Sheet open={!!obj} onClose={() => select(null)} label={obj ? `${obj.name} details` : "Details"}>
      {obj && (
        <div>
          <p className="t-label text-star/55">
            {obj.kind === "dso" ? obj.type : KIND[obj.kind]}
            {obj.con ? ` · ${conName(catalog, obj.con)}` : ""}
            {obj.kind !== "sun" && obj.kind !== "moon" ? ` · magnitude ${obj.mag.toFixed(1)}` : ""}
          </p>
          <h2 className="t-display mt-1 text-[clamp(40px,11vw,60px)] leading-[0.88]">
            {nick ? <>“{nick}”<span className="t-label mt-2 block text-star/55">{obj.name}</span></> : obj.name}
          </h2>

          <div className="mt-5">
            <Row k="Right now" v={obj.alt > 0 ? `${Math.round(obj.alt)}° up` : "Below horizon"} sub={obj.alt > 0 ? `${fistsText(obj.alt)} · ${dirWord(obj.az)}` : undefined} />
            {rs && <Row k="Rises" v={rs.rise ? fmtTime(rs.rise, loc.tz) : rs.top.alt > 0 ? "Always up" : "Never"} />}
            {rs && rs.top.alt > 0 && <Row k="Highest" v={fmtTime(rs.top.at, loc.tz)} sub={`${Math.round(rs.top.alt)}° up`} />}
            {rs && <Row k="Sets" v={rs.set ? fmtTime(rs.set, loc.tz) : rs.top.alt > 0 ? "Never sets" : "—"} />}
            {extra?.ly && <Row k="Distance" v={`${extra.ly.toLocaleString("en-IN")} light years`} sub="published estimate" />}
            {extra?.age && <Row k="Age" v={extra.age.replace("~", "≈ ")} sub="published estimate" />}
            {obj.kind === "star" && obj.id.startsWith("hip:") && <Row k="Catalogue" v={`HIP ${obj.id.slice(4)}`} sub="Hipparcos" />}
          </div>

          {obj.kind !== "sun" && (
            <>
              <div className="mt-6 flex flex-wrap gap-2">
                <Btn variant={marked ? "torch" : "line"} onClick={() => toggleMark(obj.id)}>
                  <GMine size={16} active={marked} /> {marked ? "Marked" : "Mark it"}
                </Btn>
                <Btn onClick={ask}>Ask Luna about it</Btn>
              </div>
              <label className="mt-6 block">
                <span className="t-label text-star/55">Nickname, just for you</span>
                <input value={nick} maxLength={28} onChange={(e) => setNickname(obj.id, e.target.value)} placeholder="Give it a name" className="mt-2 w-full border-b border-star/30 bg-transparent py-2 text-[17px] outline-none placeholder:text-star/30 focus:border-star" />
              </label>
              <p className="t-label mt-3 text-star/40">Official names never change, and nobody can sell you a star.</p>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}
