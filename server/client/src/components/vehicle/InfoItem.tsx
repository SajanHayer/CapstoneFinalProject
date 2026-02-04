type InfoItemProps = {
  title: string;
  value: string;
  subValue?: string;
};

export const InfoItem = ({ title, value, subValue }: InfoItemProps) => {
  return (
    <div className="flex flex-col">
      <p
        className="text-xs font-bold uppercase tracking-widest mb-3"
        style={{ color: "var(--muted)" }}
      >
        {title}
      </p>
      <div
        className="px-4 py-3 rounded-lg border-2"
        style={{ backgroundColor: "var(--card2)", borderColor: "var(--border)" }}
      >
        <p
          className="font-black text-3xl lg:text-4xl"
          style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
        >
          {value}
        </p>
      </div>
      {subValue && (
        <p className="text-sm mt-2" style={{ color: "#dc2626" }}>
          {subValue}
        </p>
      )}
    </div>
  );
};
