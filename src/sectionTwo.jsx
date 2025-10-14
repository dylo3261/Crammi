import React from "react";
import "./sectionTwo.css";

export default function SectionTwo() {
  return (
    <>
      <h3 className="anySubject">Any Subject, Any Time.</h3>
      <h4 className="anySubject">Crammi has no boundaries. Just endless learning.</h4>
      <section className="section-two">
        <div className="scrolling-banner">
          <div className="fade-left"></div>
          <div className="scroll-track">
            <img src="/CrammiBroad.png" alt="Scrolling Banner" />
            <img src="/CrammiBroad.png" alt="Scrolling Banner Duplicate 1" />
            <img src="/CrammiBroad.png" alt="Scrolling Banner Duplicate 2" />
            <img src="/CrammiBroad.png" alt="Scrolling Banner Duplicate 3" />
          </div>
          <div className="fade-right"></div>
        </div>
      </section>
    </>
  );
}
