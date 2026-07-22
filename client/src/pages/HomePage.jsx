import { useEffect } from "react";
import Hero from "../components/Hero";
import ServicesSection from "../components/ServicesSection";
import HowItWorks, { CtaBanner } from "../components/HowItWorks";

export default function HomePage() {
    useEffect(() => {
        if (window.location.hash === "#services") {
            setTimeout(() => {
                document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
            }, 150);
        }
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <Hero />
            <HowItWorks />
            <ServicesSection />
            <CtaBanner />
        </div>
    );
}
