import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Settings = () => {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>Configure the LLM provider settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="api-key">Claude API Key</Label>
                <Input id="api-key" type="password" placeholder="sk-..." />
                <p className="text-xs text-muted-foreground">Used to generate questions and explanations.</p>
            </div>
            <Button>Save Preferences</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;