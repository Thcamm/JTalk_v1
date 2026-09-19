import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    Tooltip,
} from "recharts";

type DataItem = {
    day: string;
    minutes: number;
};

type Props = {
    data: DataItem[];
};

export default function WeeklyChart({
    data,
}: Props) {
    return (
        <div className="h-[320px] w-full">
            <ResponsiveContainer
                width="100%"
                height="100%"
            >
                <BarChart data={data}>
                    <XAxis dataKey="day" />

                    <Tooltip />

                    <Bar
                        dataKey="minutes"
                        fill="#ec4899"
                        radius={[10, 10, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}