type InfoItemProps = {
  title: string;
  value: string;
  subValue?: string;
};

export const InfoItem = ({ title, value, subValue }: InfoItemProps) => {
  return (
    <div className="flex flex-col">
      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">{title}</p>
      <p className="font-black text-xl text-gray-900 leading-tight">{value}</p>
      {subValue && (
        <p className="text-sm text-blue-600">{subValue}</p>
      )}
    </div>
  );
};
