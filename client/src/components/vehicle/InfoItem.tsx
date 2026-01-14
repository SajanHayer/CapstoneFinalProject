type InfoItemProps = {
  title: string;
  value: string;
  subValue?: string;
};

export const InfoItem = ({ title, value, subValue }: InfoItemProps) => {
  return (
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="font-semibold">{value}</p>
      {subValue && (
        <p className="text-sm text-blue-600">{subValue}</p>
      )}
    </div>
  );
};
