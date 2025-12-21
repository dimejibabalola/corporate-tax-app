import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_CHAPTERS, MASTERY_COLORS } from "@/lib/mock-data";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const Progress = () => {
    const chartData = MOCK_CHAPTERS.map(c => ({
        name: `Ch ${c.number}`,
        accuracy: c.accuracy,
        coverage: c.progress
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Deep dive into your performance metrics.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Performance by Chapter</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="accuracy" name="Accuracy %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="coverage" name="Coverage %" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Study Time</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center py-8">
                    <span className="text-4xl font-bold block mb-2">12.5 hrs</span>
                    <span className="text-muted-foreground">Total time studied this week</span>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Retention Score</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center py-8">
                    <span className="text-4xl font-bold block mb-2 text-green-600">High</span>
                    <span className="text-muted-foreground">SRS Interval Efficiency</span>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Progress;