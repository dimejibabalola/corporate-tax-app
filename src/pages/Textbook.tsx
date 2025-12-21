import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Book, FileText, Check } from "lucide-react";
import { useState } from "react";
import { MOCK_CHAPTERS } from "@/lib/mock-data";

const Textbook = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [hasFile, setHasFile] = useState(true); // Default to true for demo

  const handleUpload = () => {
    setIsUploading(true);
    // Simulate upload
    setTimeout(() => {
      setIsUploading(false);
      setHasFile(true);
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Textbook Material</h1>
        <p className="text-muted-foreground">Manage your source material and parsing status.</p>
      </div>

      {!hasFile ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload your Textbook PDF</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Upload your Corporate Tax casebook. We support PDF files up to 100MB.
              We'll parse chapters and sections automatically.
            </p>
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="textbook">File</Label>
                <Input id="textbook" type="file" accept=".pdf" />
              </div>
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? "Processing..." : "Upload and Parse"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1 h-fit">
                <CardHeader>
                    <CardTitle>Current Textbook</CardTitle>
                    <CardDescription>Corporate Taxation: Examples & Explanations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">corp_tax_block_e_e_4th.pdf</p>
                            <p className="text-xs text-muted-foreground">32MB • Parsed 5 days ago</p>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full">
                        Replace File
                    </Button>
                    
                    <div className="pt-4 border-t">
                        <h4 className="text-sm font-medium mb-2">Parsing Stats</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Pages</span>
                                <span>842</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Chapters</span>
                                <span>18</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <span className="text-green-600 flex items-center gap-1"><Check size={12}/> Complete</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Table of Contents</CardTitle>
                    <CardDescription>Detected chapters and sections</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1">
                        {MOCK_CHAPTERS.map((chapter) => (
                            <div 
                                key={chapter.id} 
                                className="flex items-center justify-between p-3 hover:bg-secondary/50 rounded-lg transition-colors group cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground group-hover:bg-white group-hover:shadow-sm transition-all">
                                        {chapter.number}
                                    </div>
                                    <div>
                                        <p className="font-medium">{chapter.title}</p>
                                        <p className="text-xs text-muted-foreground">Pages {chapter.pageRange}</p>
                                    </div>
                                </div>
                                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100">
                                    <Book size={16} />
                                </Button>
                            </div>
                        ))}
                        <div className="p-3 text-center text-sm text-muted-foreground">
                            + 11 more chapters
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
};

export default Textbook;