import { motion } from "framer-motion";
import { RoomCard } from "@/components/cards/RoomCard";
import { InvoiceCard } from "@/components/cards/InvoiceCard";

interface PageTemplateProps {
  title: string;
  subtitle: string;
  showCards?: boolean;
}

export function PageTemplate({ title, subtitle, showCards = true }: PageTemplateProps) {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="page-shell space-y-6">
      <header className="space-y-2">
        <h1 className="text-h2 font-heading">{title}</h1>
        <p className="muted-text">{subtitle}</p>
      </header>

      {showCards ? (
        <div className="airbnb-grid">
          <RoomCard title="Premium Studio" price="126.700 VND / day" />
          <RoomCard title="Deluxe Twin Room" price="150.000 VND / day" />
          <InvoiceCard id="INV-1032" amount="2.950.000 VND" status="Pending" />
        </div>
      ) : null}
    </motion.section>
  );
}
