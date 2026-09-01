import Hero from "@/components/Hero";
import Summarizer from "@/components/Summarizer";

export default function Home() {
  return (
    <>
      <div className="main">
        <div className="gradient" />
      </div>
      <main className="app">
        <Hero />
        <Summarizer />
      </main>
    </>
  );
}
