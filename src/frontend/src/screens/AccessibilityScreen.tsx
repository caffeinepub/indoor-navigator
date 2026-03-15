import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { ArrowLeft, Contrast, Eye, Type, Volume2 } from "lucide-react";

interface Props {
  onBack: () => void;
}

export default function AccessibilityScreen({ onBack }: Props) {
  const {
    fontSize,
    highContrast,
    reduceMotion,
    screenReaderHints,
    setFontSize,
    setHighContrast,
    setReduceMotion,
    setScreenReaderHints,
  } = useAccessibility();

  return (
    <section data-ocid="accessibility.section" className="animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button
          type="button"
          data-ocid="accessibility.back.button"
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center shadow-xs hover:bg-muted transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={17} className="text-foreground" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">
            Accessibility
          </h1>
          <p className="text-xs text-muted-foreground font-body">
            Customize your experience
          </p>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Font Size */}
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Type size={16} className="text-primary" />
              <h3 className="font-display text-sm font-bold text-foreground">
                Font Size
              </h3>
            </div>
            <RadioGroup
              data-ocid="accessibility.font_size.radio"
              value={fontSize}
              onValueChange={(v) =>
                setFontSize(v as "normal" | "large" | "xlarge")
              }
              className="space-y-2"
            >
              {[
                { value: "normal", label: "Normal", desc: "Default size" },
                {
                  value: "large",
                  label: "Large",
                  desc: "Slightly bigger text",
                },
                {
                  value: "xlarge",
                  label: "X-Large",
                  desc: "Maximum readability",
                },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center gap-3 py-2">
                  <RadioGroupItem
                    value={opt.value}
                    id={`font-${opt.value}`}
                    data-ocid={`accessibility.font_size_${opt.value}.radio`}
                  />
                  <Label
                    htmlFor={`font-${opt.value}`}
                    className="flex-1 cursor-pointer"
                  >
                    <span className="font-semibold text-sm text-foreground font-body">
                      {opt.label}
                    </span>
                    <span className="block text-xs text-muted-foreground font-body">
                      {opt.desc}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Toggles */}
        <Card className="border-0 shadow-card">
          <CardContent className="p-0">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                <Contrast size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground font-body">
                  High Contrast
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  Increase color contrast
                </p>
              </div>
              <Switch
                data-ocid="accessibility.high_contrast.switch"
                checked={highContrast}
                onCheckedChange={setHighContrast}
                aria-label="Toggle high contrast"
              />
            </div>
            <Separator className="mx-4" />
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                <Eye size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground font-body">
                  Reduce Motion
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  Limit animations
                </p>
              </div>
              <Switch
                data-ocid="accessibility.reduce_motion.switch"
                checked={reduceMotion}
                onCheckedChange={setReduceMotion}
                aria-label="Toggle reduce motion"
              />
            </div>
            <Separator className="mx-4" />
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                <Volume2 size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground font-body">
                  Screen Reader Hints
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  Enhanced aria labels
                </p>
              </div>
              <Switch
                data-ocid="accessibility.screen_reader.switch"
                checked={screenReaderHints}
                onCheckedChange={setScreenReaderHints}
                aria-label="Toggle screen reader hints"
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="border-0 shadow-card bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground font-body uppercase tracking-widest mb-2">
              Preview
            </p>
            <p className="text-foreground font-body text-sm">
              Find your way with Indoor Navigator
            </p>
            <p className="text-muted-foreground font-body text-xs mt-1">
              Your current font size setting applies here
            </p>
          </CardContent>
        </Card>
      </div>

      <footer className="px-5 py-6 text-center">
        <p className="text-[11px] text-muted-foreground font-body">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </footer>
    </section>
  );
}
