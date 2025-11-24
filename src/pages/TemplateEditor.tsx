import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TemplateSettings {
  // Page Layout
  pageMargin: number;
  
  // Header
  headerLogoHeight: number;
  headerFontSize: number;
  headerBorderWidth: number;
  
  // Title Section
  titleFontSize: number;
  titleFontWeight: string;
  
  // Table
  tableFontSize: number;
  tableBorderWidth: number;
  tableCellPadding: number;
  
  // Seal Numbers
  sealNumberFontSize: number;
  sealNumberFontWeight: string;
  
  // Colors
  headerBgColor: string;
  tableBorderColor: string;
  highlightBgColor: string;
  
  // Typography
  fontFamily: string;
}

const defaultSettings: TemplateSettings = {
  pageMargin: 0.2,
  headerLogoHeight: 48,
  headerFontSize: 12,
  headerBorderWidth: 2,
  titleFontSize: 18,
  titleFontWeight: "bold",
  tableFontSize: 12,
  tableBorderWidth: 1,
  tableCellPadding: 4,
  sealNumberFontSize: 14,
  sealNumberFontWeight: "bold",
  headerBgColor: "#000000",
  tableBorderColor: "#000000",
  highlightBgColor: "#1e3a8a",
  fontFamily: "Arial, sans-serif"
};

export default function TemplateEditor() {
  const navigate = useNavigate();
  const { flightId } = useParams();
  const { toast } = useToast();
  const [settings, setSettings] = useState<TemplateSettings>(defaultSettings);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [flightId]);

  const loadSettings = async () => {
    const saved = localStorage.getItem(`template-settings-${flightId}`);
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  };

  const saveSettings = () => {
    localStorage.setItem(`template-settings-${flightId}`, JSON.stringify(settings));
    toast({
      title: "Settings saved",
      description: "Template settings have been saved successfully."
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    toast({
      title: "Settings reset",
      description: "Template settings have been reset to defaults."
    });
  };

  const updateSetting = <K extends keyof TemplateSettings>(
    key: K,
    value: TemplateSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/equipment/${flightId}`)}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Equipment
            </Button>
            <h1 className="text-xl font-bold">Template Editor</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Template Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="layout" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="layout">Layout</TabsTrigger>
                    <TabsTrigger value="style">Style</TabsTrigger>
                    <TabsTrigger value="colors">Colors</TabsTrigger>
                  </TabsList>

                  <TabsContent value="layout" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Page Margin (cm)</Label>
                      <Slider
                        value={[settings.pageMargin]}
                        onValueChange={([value]) => updateSetting("pageMargin", value)}
                        min={0}
                        max={2}
                        step={0.1}
                        className="w-full"
                      />
                      <span className="text-xs text-muted-foreground">{settings.pageMargin} cm</span>
                    </div>

                    <div className="space-y-2">
                      <Label>Logo Height (px)</Label>
                      <Slider
                        value={[settings.headerLogoHeight]}
                        onValueChange={([value]) => updateSetting("headerLogoHeight", value)}
                        min={24}
                        max={96}
                        step={4}
                        className="w-full"
                      />
                      <span className="text-xs text-muted-foreground">{settings.headerLogoHeight} px</span>
                    </div>

                    <div className="space-y-2">
                      <Label>Table Cell Padding (px)</Label>
                      <Slider
                        value={[settings.tableCellPadding]}
                        onValueChange={([value]) => updateSetting("tableCellPadding", value)}
                        min={2}
                        max={12}
                        step={1}
                        className="w-full"
                      />
                      <span className="text-xs text-muted-foreground">{settings.tableCellPadding} px</span>
                    </div>

                    <div className="space-y-2">
                      <Label>Border Width (px)</Label>
                      <Slider
                        value={[settings.tableBorderWidth]}
                        onValueChange={([value]) => updateSetting("tableBorderWidth", value)}
                        min={1}
                        max={4}
                        step={1}
                        className="w-full"
                      />
                      <span className="text-xs text-muted-foreground">{settings.tableBorderWidth} px</span>
                    </div>
                  </TabsContent>

                  <TabsContent value="style" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Font Family</Label>
                      <Select
                        value={settings.fontFamily}
                        onValueChange={(value) => updateSetting("fontFamily", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                          <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                          <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                          <SelectItem value="Georgia, serif">Georgia</SelectItem>
                          <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Header Font Size (px)</Label>
                      <Slider
                        value={[settings.headerFontSize]}
                        onValueChange={([value]) => updateSetting("headerFontSize", value)}
                        min={8}
                        max={20}
                        step={1}
                        className="w-full"
                      />
                      <span className="text-xs text-muted-foreground">{settings.headerFontSize} px</span>
                    </div>

                    <div className="space-y-2">
                      <Label>Title Font Size (px)</Label>
                      <Slider
                        value={[settings.titleFontSize]}
                        onValueChange={([value]) => updateSetting("titleFontSize", value)}
                        min={12}
                        max={32}
                        step={2}
                        className="w-full"
                      />
                      <span className="text-xs text-muted-foreground">{settings.titleFontSize} px</span>
                    </div>

                    <div className="space-y-2">
                      <Label>Table Font Size (px)</Label>
                      <Slider
                        value={[settings.tableFontSize]}
                        onValueChange={([value]) => updateSetting("tableFontSize", value)}
                        min={8}
                        max={18}
                        step={1}
                        className="w-full"
                      />
                      <span className="text-xs text-muted-foreground">{settings.tableFontSize} px</span>
                    </div>

                    <div className="space-y-2">
                      <Label>Seal Number Font Size (px)</Label>
                      <Slider
                        value={[settings.sealNumberFontSize]}
                        onValueChange={([value]) => updateSetting("sealNumberFontSize", value)}
                        min={10}
                        max={24}
                        step={1}
                        className="w-full"
                      />
                      <span className="text-xs text-muted-foreground">{settings.sealNumberFontSize} px</span>
                    </div>
                  </TabsContent>

                  <TabsContent value="colors" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Header Background</Label>
                      <Input
                        type="color"
                        value={settings.headerBgColor}
                        onChange={(e) => updateSetting("headerBgColor", e.target.value)}
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Table Border Color</Label>
                      <Input
                        type="color"
                        value={settings.tableBorderColor}
                        onChange={(e) => updateSetting("tableBorderColor", e.target.value)}
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Highlight Background</Label>
                      <Input
                        type="color"
                        value={settings.highlightBgColor}
                        onChange={(e) => updateSetting("highlightBgColor", e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-2 pt-4">
                  <Button onClick={saveSettings} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={resetSettings} variant="outline">
                    Reset
                  </Button>
                </div>

                <Button
                  onClick={() => navigate(`/preview/${flightId}`)}
                  variant="secondary"
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Preview
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 p-4 bg-white overflow-auto"
                  style={{
                    fontFamily: settings.fontFamily,
                    maxHeight: "calc(100vh - 200px)"
                  }}
                >
                  <style dangerouslySetInnerHTML={{
                    __html: `
                      .preview-template table {
                        border-collapse: collapse;
                        width: 100%;
                      }
                      .preview-template td, .preview-template th {
                        border: ${settings.tableBorderWidth}px solid ${settings.tableBorderColor};
                        padding: ${settings.tableCellPadding}px;
                      }
                    `
                  }} />
                  
                  <div className="preview-template">
                    {/* Sample Header */}
                    <table>
                      <tbody>
                        <tr>
                          <td
                            rowSpan={2}
                            style={{
                              backgroundColor: settings.headerBgColor,
                              color: "white",
                              textAlign: "center",
                              fontSize: `${settings.headerFontSize}px`
                            }}
                          >
                            LOGO
                            <div style={{ height: `${settings.headerLogoHeight}px` }} />
                          </td>
                          <td style={{ fontSize: `${settings.tableFontSize}px`, fontWeight: "bold" }}>
                            Date
                          </td>
                          <td style={{ fontSize: `${settings.titleFontSize}px`, fontWeight: settings.titleFontWeight }}>
                            24/01/2025
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontSize: `${settings.tableFontSize}px`, fontWeight: "bold" }}>
                            Flight No.
                          </td>
                          <td style={{ fontSize: `${settings.titleFontSize}px`, fontWeight: settings.titleFontWeight }}>
                            TR123
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Sample Equipment Section */}
                    <table style={{ marginTop: "8px" }}>
                      <tbody>
                        <tr>
                          <td style={{ fontSize: `${settings.tableFontSize}px` }}>Hi-Lift 1</td>
                          <td style={{ fontSize: `${settings.tableFontSize}px`, textAlign: "center" }}>1</td>
                          <td style={{ fontSize: `${settings.sealNumberFontSize}px`, fontWeight: settings.sealNumberFontWeight }}>
                            Rear Seal: 12345, Front Seal: 67890
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan={2}
                            style={{
                              backgroundColor: settings.highlightBgColor,
                              color: "white",
                              fontSize: `${settings.tableFontSize}px`
                            }}
                          >
                            SSS sticker nos. for loose items
                          </td>
                          <td style={{ fontSize: `${settings.tableFontSize}px` }}>Colour: Red</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Sample Data Table */}
                    <table style={{ marginTop: "8px" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f3f4f6" }}>
                          <th style={{ fontSize: `${settings.tableFontSize}px` }}>S/n</th>
                          <th style={{ fontSize: `${settings.tableFontSize}px` }}>Cart No.</th>
                          <th style={{ fontSize: `${settings.tableFontSize}px` }}>Seal / Sticker No.</th>
                          <th style={{ fontSize: `${settings.tableFontSize}px` }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ fontSize: `${settings.tableFontSize}px`, textAlign: "center" }}>1</td>
                          <td style={{ fontSize: `${settings.tableFontSize}px`, textAlign: "center" }}>
                            <span style={{ fontSize: `${settings.sealNumberFontSize}px`, fontWeight: settings.sealNumberFontWeight }}>
                              5
                            </span> Full Size Trolley
                          </td>
                          <td style={{ fontSize: `${settings.sealNumberFontSize}px`, fontWeight: settings.sealNumberFontWeight }}>
                            123, 456, 789, 101, 112
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
