import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  const [value, setValue] = React.useState([50]); // Valor inicial do slider (50%)

  const handleValueChange = (newValue) => {
    setValue(newValue);
  };

  const handleTrackClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const newValue = [Math.round(percent * 100)];
    setValue(newValue);
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      value={value}
      onValueChange={handleValueChange}
      {...props}
    >
      <SliderPrimitive.Track
        className="relative h-2 w-full grow overflow-hidden rounded-full bg-transparent cursor-pointer"
        onClick={handleTrackClick}
      >
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="absolute text-4xl top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        style={{ left: `${value[0]}%` }}
      >
        ⚡
      </SliderPrimitive.Thumb>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 text-xs mt-1">
        {value[0]}%
      </div>
    </SliderPrimitive.Root>
  );
});

Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
