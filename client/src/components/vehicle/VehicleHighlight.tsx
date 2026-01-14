import { Card } from "../common/Card";
import { InfoItem } from "./InfoItem";

type Highlight = {
  title: string;
  value: string;
  subValue?: string;
};

type Props = {
  items: Highlight[];
};

export const VehicleHighlights = ({ items }: Props) => {
  return (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {items.map((item) => (
          <InfoItem
            key={item.title}
            title={item.title}
            value={item.value}
            subValue={item.subValue}
          />
        ))}
      </div>
    </Card>
  );
};
