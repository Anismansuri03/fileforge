import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SizeUnit } from "@/lib/bytes";
import { formatBytes, parseTargetSize } from "@/lib/bytes";
import { cn } from "@/lib/utils";

interface TargetSizeInputProps {
  value: string;
  unit: SizeUnit;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: SizeUnit) => void;
  label?: string;
  error?: string | null;
  disabled?: boolean;
  className?: string;
}

export function TargetSizeInput({
  value,
  unit,
  onValueChange,
  onUnitChange,
  label = "Target size",
  error,
  disabled,
  className,
}: TargetSizeInputProps) {
  const inputId = useId();
  const bytes = parseTargetSize(value, unit);
  const showError = Boolean(error);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={inputId}>{label}</Label>
        {bytes !== null && (
          <span className="text-xs text-muted-foreground">
            {formatBytes(bytes)} max
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          id={inputId}
          type="number"
          inputMode="decimal"
          min={1}
          step="any"
          value={value}
          disabled={disabled}
          aria-invalid={showError}
          aria-describedby={showError ? `${inputId}-error` : undefined}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder="200"
          className="flex-1"
        />
        <Select
          value={unit}
          onValueChange={(next) => onUnitChange(next as SizeUnit)}
          disabled={disabled}
        >
          <SelectTrigger className="w-24" aria-label="Target size unit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="KB">KB</SelectItem>
            <SelectItem value="MB">MB</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showError && (
        <p id={`${inputId}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
